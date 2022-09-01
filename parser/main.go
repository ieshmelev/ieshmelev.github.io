package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"

	"github.com/PuerkitoBio/goquery"
)

const defaultSrc = "https://www.fifaindex.com/ru/teams/fifa22/"

var srcUrl *url.URL

type team struct {
	ID     int     `json:"id"`
	Title  string  `json:"title"`
	Img    string  `json:"img"`
	Stars  float64 `json:"stars"`
	League string  `json:"league"`
}

func main() {
	out := os.Getenv("OUT")
	if out == "" {
		log.Println("out is required")
		return
	}

	src := os.Getenv("SRC")
	if src == "" {
		src = defaultSrc
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

	b, err := json.Marshal(teams)
	if err != nil {
		log.Println("marshal error", err)
		return
	}

	if err := os.WriteFile(out, b, 0644); err != nil {
		log.Println("write error", err)
		return
	}
}

func parse() ([]team, error) {
	teams, page, pageSize := []team{}, 1, 30
	for {
		b, err := func() ([]byte, error) {
			values := srcUrl.Query()
			values.Set("page", fmt.Sprintf("%d", page))
			srcUrl.RawQuery = values.Encode()
			resp, err := http.Get(srcUrl.String())
			if err != nil {
				return nil, fmt.Errorf("get error: %w", err)
			}
			if resp == nil {
				return nil, nil
			}
			defer resp.Body.Close()
			if resp.StatusCode == http.StatusNotFound {
				return nil, nil
			}
			if resp.StatusCode != http.StatusOK {
				return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
			}
			b, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				return nil, fmt.Errorf("read body error: %w", err)
			}
			return b, nil
		}()
		if err != nil {
			return nil, err
		}
		if b == nil {
			break
		}
		lteams, err := extract(b)
		if err != nil {
			return nil, fmt.Errorf("extract error: %w", err)
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
