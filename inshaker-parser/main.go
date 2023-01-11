package main

import (
	"bytes"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"runtime"
	"sync"

	"github.com/PuerkitoBio/goquery"
	"golang.org/x/sync/errgroup"
)

const perm = 0644

var (
	workersCount = runtime.NumCPU()
	outData      *string
	srcUrl       *url.URL
	baseSrcUrl   *url.URL
)

type cocktail struct {
	Link        string   `json:"link"`
	Name        string   `json:"name"`
	Ingredients []string `json:"ingredients"`
	Tools       []string `json:"tools"`
}

type item struct {
	Link string `json:"link"`
	Name string `json:"name"`
}

func main() {
	outData = flag.String("out_data", "", "")
	src := flag.String("src", "", "")
	flag.Parse()

	if outData == nil {
		log.Println("out_data is required")
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
		return
	}

	baseSrcUrl, _ = url.Parse(srcUrl.String())
	baseSrcUrl.RawQuery = (url.Values{}).Encode()
	baseSrcUrl.Path = ""

	cocktails, err := parse()
	if err != nil {
		log.Println("parse error", err)
		return
	}

	b, err := json.Marshal(cocktails)
	if err != nil {
		log.Println("marshal error", err)
		return
	}

	if err := os.WriteFile(*outData, b, perm); err != nil {
		log.Println("write error", err)
		return
	}
}

func parse() ([]cocktail, error) {
	log.Println("parse started")
	defer log.Println("parse finished")
	cocktails, page, pageSize := []cocktail{}, 1, 20
	for {
		log.Println("parse batch started")
		values := srcUrl.Query()
		values.Set("random_page", fmt.Sprintf("%d", page))
		srcUrl.RawQuery = values.Encode()
		u := srcUrl.String()

		b, err := get(u)
		if err != nil {
			return nil, fmt.Errorf("get %s error: %w", u, err)
		}

		lcocktails, err := extractCocktails(b)
		if err != nil {
			return nil, fmt.Errorf("extract %s error: %w", u, err)
		}

		cocktails = append(cocktails, lcocktails...)
		if len(lcocktails) < pageSize {
			log.Println("parse batch finished")
			break
		}
		log.Println("parse batch finished")
		page++
	}

	cocktails, err := enrichCocktails(cocktails)
	if err != nil {
		return nil, fmt.Errorf("enrich cocktails error: %w", err)
	}

	cocktails, err = enrichCocktailsItems(cocktails)
	if err != nil {
		return nil, fmt.Errorf("enrich cocktails items error: %w", err)
	}

	return cocktails, nil
}

func extractCocktails(b []byte) ([]cocktail, error) {
	cocktails := []cocktail{}
	doc, err := goquery.NewDocumentFromReader(bytes.NewReader(b))
	if err != nil {
		return nil, fmt.Errorf("make document error: %w", err)
	}
	doc.Find(".cocktail-item-preview").Each(func(i int, s *goquery.Selection) {
		link, ok := s.Attr("href")
		if !ok {
			return
		}
		baseSrcUrl.Path = link
		cocktails = append(cocktails, cocktail{
			Link: baseSrcUrl.String(),
		})
	})
	return cocktails, nil
}

func enrichCocktails(cocktails []cocktail) ([]cocktail, error) {
	log.Println("enrich cocktails started")
	defer log.Println("enrich cocktails finished")
	g, ctx := errgroup.WithContext(context.Background())

	tasks := make(chan cocktail)
	g.Go(func() error {
		defer close(tasks)
		for _, t := range cocktails {
			select {
			case tasks <- t:
			case <-ctx.Done():
				return ctx.Err()
			}
		}
		return nil
	})

	processed := make(chan cocktail)
	for w := 0; w < workersCount; w++ {
		g.Go(func() error {
			for {
				select {
				case t, ok := <-tasks:
					if !ok {
						return nil
					}
					t, err := parseCocktail(t)
					if err != nil {
						return fmt.Errorf("parse cocktail %s error: %w", t.Link, err)
					}
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

	res := make([]cocktail, 0, len(cocktails))
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

	return res, nil
}

func parseCocktail(c cocktail) (cocktail, error) {
	b, err := get(c.Link)
	if err != nil {
		return c, fmt.Errorf("get %s error: %w", c.Link, err)
	}

	doc, err := goquery.NewDocumentFromReader(bytes.NewReader(b))
	if err != nil {
		return c, fmt.Errorf("make document %s error: %w", c.Link, err)
	}

	c.Name = doc.Find(".common-name").Text()
	doc.Find(".previews .ingredients a").Each(func(i int, s *goquery.Selection) {
		link, ok := s.Attr("href")
		if !ok {
			return
		}
		baseSrcUrl.Path = link
		c.Ingredients = append(c.Ingredients, baseSrcUrl.String())
	})
	doc.Find(".previews .tools a").Each(func(i int, s *goquery.Selection) {
		link, ok := s.Attr("href")
		if !ok {
			return
		}
		baseSrcUrl.Path = link
		c.Tools = append(c.Tools, baseSrcUrl.String())
	})
	return c, nil
}

func enrichCocktailsItems(cocktails []cocktail) ([]cocktail, error) {
	log.Println("enrich cocktails items started")
	defer log.Println("enrich cocktails items finished")
	itemsMap := map[string]string{}
	for _, v := range cocktails {
		for _, i := range v.Ingredients {
			itemsMap[i] = ""
		}
		for _, i := range v.Tools {
			itemsMap[i] = ""
		}
	}

	g, ctx := errgroup.WithContext(context.Background())

	tasks := make(chan string)
	g.Go(func() error {
		defer close(tasks)
		for k := range itemsMap {
			select {
			case tasks <- k:
			case <-ctx.Done():
				return ctx.Err()
			}
		}
		return nil
	})

	processed := make(chan item)
	for w := 0; w < workersCount; w++ {
		g.Go(func() error {
			for {
				select {
				case t, ok := <-tasks:
					if !ok {
						return nil
					}
					i, err := parseItem(t)
					if err != nil {
						return fmt.Errorf("parse cocktail %s error: %w", t, err)
					}
					processed <- i
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

	wg.Add(1)
	go func() {
		defer wg.Done()
		for p := range processed {
			itemsMap[p.Link] = p.Name
		}
	}()

	wg.Wait()

	if err != nil {
		return nil, err
	}

	for kc, c := range cocktails {
		ingredients := make([]string, len(c.Ingredients))
		for ki, i := range c.Ingredients {
			ingredients[ki] = itemsMap[i]
		}
		tools := make([]string, len(c.Tools))
		for kt, t := range c.Tools {
			tools[kt] = itemsMap[t]
		}
		cocktails[kc].Ingredients = ingredients
		cocktails[kc].Tools = tools
	}

	return cocktails, nil
}

func parseItem(s string) (item, error) {
	b, err := get(s)
	if err != nil {
		return item{}, fmt.Errorf("get %s error: %w", s, err)
	}
	doc, err := goquery.NewDocumentFromReader(bytes.NewReader(b))
	if err != nil {
		return item{}, fmt.Errorf("make document %s error: %w", s, err)
	}

	return item{
		Link: s,
		Name: doc.Find(".common-name").Text(),
	}, nil
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
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}
	b, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read body error: %w", err)
	}
	return b, nil
}
