package scrapers

import (
	"fmt"
	"net/url"
	"strconv"
	"strings"

	"github.com/gocolly/colly"
)

var jobbkkCards []JobCard

func getJobUrl(url string) string {
	segments := strings.Split(url, "/")
	if len(segments) < 2 {
		return ""
	}
	s := strings.Join(segments[len(segments)-6:], "/")
	s = s[:len(s)-1]
	return s
}

func ScrapingJobbkk(keywrd string, page int, province string, onlyBKK bool) ([]JobCard, error) {

	if jobbkkCards != nil {
		jobbkkCards = nil
	}

	keywrd = strings.Join((strings.Split(strings.TrimSpace(keywrd), " ")), "+")
	encodedKeywrd := url.QueryEscape(keywrd)
	// encodedProvince := url.QueryEscape(province)
	pageStr := strconv.Itoa(page)

	var scrapeURL string

	if keywrd == "" {
		if onlyBKK {
			scrapeURL = "https://www.jobbkk.com/jobs/lists/" + pageStr + "/หางาน?province_id=246"
		} else {
			scrapeURL = "https://www.jobbkk.com/jobs/lists/" + pageStr + "/หางาน"
		}
	} else {
		if onlyBKK {
			scrapeURL = "https://www.jobbkk.com/jobs/lists/" + pageStr + "/หางาน," + encodedKeywrd + "?province_id=246"
		} else {
			scrapeURL = "https://www.jobbkk.com/jobs/lists/" + pageStr + "/หางาน," + encodedKeywrd
		}
	}

	c := colly.NewCollector(colly.AllowedDomains("www.jobbkk.com", "jobbkk.com"))

	c.OnError(func(_ *colly.Response, err error) {
		fmt.Printf("JobBKK scraping error: %v\n", err)
	})

	c.OnHTML("div.joblist-detail-device", func(h *colly.HTMLElement) {
		selection := h.DOM
		var tmpCard JobCard
		tmpCard.Title = strings.TrimSpace(selection.Find("div.joblist-ur-com-name div.joblist-name-urgent").Text())
		tmpCard.Company = strings.TrimSpace(selection.Find("div.joblist-ur-com-name div.joblist-company-name").Text())
		tmpCard.Location = strings.TrimSpace(selection.Find("div.joblist-loc-sal div.position-location").Text())
		tmpCard.Salary = strings.TrimSpace(selection.Find("div.joblist-loc-sal div.position-salary").Text())

		scrapedAttribute := h.Attr("onclick")
		tmpCard.URL = "https:/" + getJobUrl(scrapedAttribute)
		tmpCard.Source = "jobbkk.com"

		// fmt.Println(tmpCard.Title + "\n" + tmpCard.Company + "\n" + tmpCard.Location + "\n" + tmpCard.Salary + "\n" + tmpCard.URL + "\n" + tmpCard.Source + "\n")

		jobbkkCards = append(jobbkkCards, tmpCard)
	})

	err := c.Visit(scrapeURL)
	if err != nil {
		return nil, fmt.Errorf("failed to visit JobBKK: %w", err)
	}

	return jobbkkCards, nil
}

func SingleScrapingJobbkk(keywrd string, page int, index int) (JobCard, error) {

	if jobbkkCards != nil {
		jobbkkCards = nil
	}

	keywrd = strings.ReplaceAll(keywrd, " ", "+")
	pageStr := strconv.Itoa(page)

	// keywrd = strings.Join((strings.Split(strings.TrimSpace(keywrd), " ")), "+")
	// encodedKeywrd := url.QueryEscape(keywrd)

	scrapeURL := "https://www.jobbkk.com/jobs/lists/" + pageStr + "/หางาน," + keywrd

	c := colly.NewCollector(colly.AllowedDomains("www.jobbkk.com", "jobbkk.com"))

	c.OnError(func(_ *colly.Response, err error) {
		fmt.Printf("JobBKK scraping error: %v\n", err)
	})

	c.OnHTML("div.joblist-detail-device", func(h *colly.HTMLElement) {
		selection := h.DOM
		var tmpCard JobCard
		tmpCard.Title = strings.TrimSpace(selection.Find("div.joblist-ur-com-name div.joblist-name-urgent").Text())
		tmpCard.Company = strings.TrimSpace(selection.Find("div.joblist-ur-com-name div.joblist-company-name").Text())
		tmpCard.Location = strings.TrimSpace(selection.Find("div.joblist-loc-sal div.position-location").Text())
		tmpCard.Salary = strings.TrimSpace(selection.Find("div.joblist-loc-sal div.position-salary").Text())

		scrapedAttribute := h.Attr("onclick")
		tmpCard.URL = "https:/" + getJobUrl(scrapedAttribute)
		tmpCard.Source = "jobbkk.com"

		jobbkkCards = append(jobbkkCards, tmpCard)
	})

	err := c.Visit(scrapeURL)
	if err != nil {
		return JobCard{}, fmt.Errorf("failed to visit JobBKK: %w", err)
	}

	return jobbkkCards[index], nil
}
