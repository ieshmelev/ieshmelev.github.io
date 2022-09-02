package main

import (
	"bytes"
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
	for k, v := range teams {
		u, err := url.Parse(v.Img)
		if err != nil {
			return nil, fmt.Errorf("parse url %s error: %w", v.Img, err)
		}
		b, err := get(v.Img)
		if err == errNotFound {
			teams[k].Img = path.Join(pathLogos, fNotFound)
			continue
		} else if err != nil {
			return nil, fmt.Errorf("download logo %s error: %w", v.Img, err)
		}
		_, f := path.Split(u.Path)
		if err := os.WriteFile(path.Join(outLogos, f), b, perm); err != nil {
			return nil, fmt.Errorf("save logo %s error: %w", v.Img, err)
		}
		teams[k].Img = path.Join(pathLogos, f)
	}
	return teams, nil
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
