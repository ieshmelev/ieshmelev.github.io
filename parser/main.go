package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"path"

	"github.com/PuerkitoBio/goquery"
	"golang.org/x/sync/errgroup"
)

const perm = 0644

var (
	errNotFound = errors.New("not found")
	fNotFound   = "not_found.png"
	outData     string
	outLogos    string
	pathLogos   string
	srcUrl      *url.URL
)

type team struct {
	ID     int     `json:"id"`
	Title  string  `json:"title"`
	Img    string  `json:"img"`
	Stars  float64 `json:"stars"`
	League string  `json:"league"`
}

func main() {
	outData = os.Getenv("OUT_DATA")
	if outData == "" {
		log.Println("OUT_DATA is required")
		return
	}

	outLogos = os.Getenv("OUT_LOGOS")
	if outLogos == "" {
		log.Println("OUT_LOGOS is required")
		return
	}

	pathLogos = os.Getenv("PATH_LOGOS")
	if outLogos == "" {
		log.Println("PATH_LOGOS is required")
		return
	}

	src := os.Getenv("SRC")
	if src == "" {
		log.Println("SRC is required")
		return
	}
	var err error
	srcUrl, err = url.Parse(src)
	if err != nil {
		log.Println("parse url error", err)
	}

	teams, err := parse()
	if err != nil {
		log.Println("parse error", err)
		return
	}

	teams, err = downloadLogos(teams)
	if err != nil {
		log.Println("download logos error", err)
		return
	}

	b, err := json.Marshal(teams)
	if err != nil {
		log.Println("marshal error", err)
		return
	}

	if err := os.WriteFile(outData, b, perm); err != nil {
		log.Println("write error", err)
		return
	}
}

func parse() ([]team, error) {
	teams, page, pageSize := []team{}, 1, 30
	for {
		values := srcUrl.Query()
		values.Set("page", fmt.Sprintf("%d", page))
		srcUrl.RawQuery = values.Encode()
		u := srcUrl.String()

		b, err := get(u)
		if err == errNotFound {
			break
		} else if err != nil {
			return nil, fmt.Errorf("get %s error: %w", u, err)
		}

		lteams, err := extract(b)
		if err != nil {
			return nil, fmt.Errorf("extract %s error: %w", u, err)
		}

		teams = append(teams, lteams...)
		if len(lteams) < pageSize {
			break
		}
		page++
	}
	return setIds(teams), nil
}

func extract(b []byte) ([]team, error) {
	teams := []team{}
	r := bytes.NewReader(b)
	doc, err := goquery.NewDocumentFromReader(r)
	if err != nil {
		return nil, fmt.Errorf("make document error: %w", err)
	}
	doc.Find(".table-teams tr").Each(func(i int, s *goquery.Selection) {
		img, imgOk := s.Find("img").Attr("src")
		if !imgOk {
			return
		}
		title := s.Find(".link-team").Text()
		league := s.Find(".link-league").Text()
		stars := s.Find(".fas").Length()
		halfStars := s.Find(".fa-star-half-alt").Length()
		teams = append(teams, team{
			Title:  title,
			Img:    img,
			Stars:  float64(stars) - float64(halfStars)*0.5,
			League: league,
		})
	})
	return teams, nil
}

func setIds(teams []team) []team {
	for k := range teams {
		teams[k].ID = k + 1
	}
	return teams
}

func downloadLogos(teams []team) ([]team, error) {
	res := make([]team, 0, len(teams))

	src := make(chan team)

	dst := make(chan team)
	defer close(dst)

	g, _ := errgroup.WithContext(context.Background())
	g.Go(func() error {
		defer close(src)
		for _, v := range teams {
			src <- v
		}
		return nil
	})

	g.Go(func() error {
		for v := range dst {
			res = append(res, v)
		}
		return nil
	})

	for k := 0; k < 10; k++ {
		g.Go(func() error {
			for v := range src {
				u, err := url.Parse(v.Img)
				if err != nil {
					return fmt.Errorf("parse url %s error: %w", v.Img, err)
				}
				b, err := get(v.Img)
				if err == errNotFound {
					v.Img = path.Join(pathLogos, fNotFound)
					dst <- v
					continue
				} else if err != nil {
					return fmt.Errorf("download logo %s error: %w", v.Img, err)
				}
				_, f := path.Split(u.Path)
				if err := os.WriteFile(path.Join(outLogos, f), b, perm); err != nil {
					return fmt.Errorf("save logo %s error: %w", v.Img, err)
				}
				v.Img = path.Join(pathLogos, f)
				dst <- v
			}
			return nil
		})
	}

	if err := g.Wait(); err != nil {
		return nil, err
	}

	return res, nil
}

func get(u string) ([]byte, error) {
	resp, err := http.Get(u)
	if err != nil {
		return nil, err
	}
	if resp == nil {
		return nil, fmt.Errorf("empty body")
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusNotFound {
		return nil, errNotFound
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}
	b, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read body error: %w", err)
	}
	return b, nil
}
