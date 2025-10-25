package scrapers

import (
	"fmt"
	"net/url"
	"strconv"
	"strings"

	"github.com/gocolly/colly"
)

var jobthaiCards []JobCard

func ScrapingJobthai(keywrd string, page int, onlyBKK bool) ([]JobCard, error) {

	if jobthaiCards != nil {
		jobthaiCards = nil
	}

	keywrd = strings.Join((strings.Split(strings.TrimSpace(keywrd), " ")), "+")
	encodedKeywrd := url.QueryEscape(keywrd)
	pageStr := strconv.Itoa(page)

	var scrapeURL string
	if keywrd == "" {
		if onlyBKK {
			scrapeURL = "https://www.jobthai.com/หางาน/กรุงเทพมหานคร/" + pageStr
		} else {
			scrapeURL = "https://www.jobthai.com/หางาน/งานทั้งหมด/" + pageStr
		}
	} else {
		if onlyBKK {
			scrapeURL = "https://www.jobthai.com/th/jobs?province=01&keyword=" + encodedKeywrd + "&page=" + pageStr
		} else {
			scrapeURL = "https://www.jobthai.com/th/jobs?keyword=" + encodedKeywrd + "&page=" + pageStr
		}
	}

	c := colly.NewCollector(colly.AllowedDomains("www.jobthai.com", "jobthai.com"))

	c.OnError(func(_ *colly.Response, err error) {
		fmt.Printf("JobThai scraping error: %v\n", err)
	})

	c.OnHTML("a[ga-name]", func(h *colly.HTMLElement) {
		selection := h.DOM
		var tmpCard JobCard
		tmpCard.Title = strings.TrimSpace(selection.Find("div.hcawrC div.gXNyXH h2.hHthyd").Text())
		tmpCard.Company = strings.TrimSpace(selection.Find("div.hcawrC div.gXNyXH span.icuLsB").Text())
		tmpCard.Location = strings.TrimSpace(selection.Find("div.hcawrC div.kjOLtL h3#location-text").Text())
		if tmpCard.Location == "" {
			tmpCard.Location = strings.TrimSpace(selection.Find("div.hcawrC div.kjOLtL span#location-text").Text())
		}
		tmpCard.Salary = strings.TrimSpace(selection.Find("div.hcawrC div.kjOLtL span#salary-text").Text())

		scrapedAttribute := h.Attr("href")
		tmpCard.URL = "https://www.jobthai.com" + scrapedAttribute
		tmpCard.Source = "jobthai.com"

		// fmt.Println(tmpCard.Title + "\n" + tmpCard.Company + "\n" + tmpCard.Location + "\n" + tmpCard.Salary + "\n" + tmpCard.URL + "\n" + tmpCard.Source + "\n")

		jobthaiCards = append(jobthaiCards, tmpCard)
	})

	err := c.Visit(scrapeURL)
	if err != nil {
		return nil, fmt.Errorf("failed to visit JobThai: %w", err)
	}

	return jobthaiCards, nil
}
