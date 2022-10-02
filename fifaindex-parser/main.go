package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"path"
	"runtime"
	"sort"
	"sync"

	"github.com/PuerkitoBio/goquery"
	"golang.org/x/sync/errgroup"
)

const perm = 0644

var (
	errNotFound          = errors.New("not found")
	fNotFound            = "not_found.png"
	downloadWorkersCount = runtime.NumCPU()
	outData              *string
	outLogos             *string
	pathLogos            *string
	srcUrl               *url.URL
)

type team struct {
	ID     int     `json:"id"`
	Title  string  `json:"title"`
	Img    string  `json:"img"`
	Stars  float64 `json:"stars"`
	League string  `json:"league"`
}

func main() {
	outData = flag.String("out_data", "", "")
	outLogos = flag.String("out_logos", "", "")
	pathLogos = flag.String("path_logos", "", "")
	src := flag.String("src", "", "")
	flag.Parse()

	if outData == nil {
		log.Println("out_data is required")
		return
	}

	if outLogos == nil {
		log.Println("out_logos is required")
		return
	}

	if pathLogos == nil {
		log.Println("path_logos is required")
		return
	}

	if src == nil {
		log.Println("src is required")
		return
	}
	var err error
	srcUrl, err = url.Parse(*src)
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

	if err := os.WriteFile(*outData, b, perm); err != nil {
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
	g, ctx := errgroup.WithContext(context.Background())

	tasks := make(chan team)
	g.Go(func() error {
		defer close(tasks)
		for _, t := range teams {
			select {
			case tasks <- t:
			case <-ctx.Done():
				return ctx.Err()
			}
		}
		return nil
	})

	fNotFound := path.Join(*pathLogos, fNotFound)
	processed := make(chan team)
	for w := 0; w < downloadWorkersCount; w++ {
		g.Go(func() error {
			for {
				select {
				case t, ok := <-tasks:
					if !ok {
						return nil
					}

					u, err := url.Parse(t.Img)
					if err != nil {
						return fmt.Errorf("parse url %s error: %w", t.Img, err)
					}

					b, err := get(t.Img)
					if err == errNotFound {
						t.Img = fNotFound
						processed <- t
						continue
					} else if err != nil {
						return fmt.Errorf("download logo %s error: %w", t.Img, err)
					}

					_, f := path.Split(u.Path)
					if err := os.WriteFile(path.Join(*outLogos, f), b, perm); err != nil {
						return fmt.Errorf("save logo %s error: %w", t.Img, err)
					}

					t.Img = path.Join(*pathLogos, f)
					processed <- t

				case <-ctx.Done():
					return ctx.Err()
				}
			}
		})
	}

	wg := &sync.WaitGroup{}

	var err error
	wg.Add(1)
	go func() {
		defer wg.Done()
		defer close(processed)
		err = g.Wait()
	}()

	res := make([]team, 0, len(teams))
	wg.Add(1)
	go func() {
		defer wg.Done()
		for p := range processed {
			res = append(res, p)
		}
	}()

	wg.Wait()

	if err != nil {
		return nil, err
	}

	sort.Slice(res, func(i, j int) bool {
		return res[i].ID < res[j].ID
	})

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
