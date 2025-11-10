package scrapers

import (
	"fmt"
	"net/url"
	"strconv"
	"strings"

	"github.com/PuerkitoBio/goquery"
	"github.com/gocolly/colly"
)

var jobthCards []JobCard

func ScrapingJobTH(keywrd string, page int, province string, onlyBKK bool) ([]JobCard, error) {

	if jobthCards != nil {
		jobthCards = nil
	}

	keywrd = strings.Join((strings.Split(strings.TrimSpace(keywrd), " ")), "+")
	encodedKeywrd := url.QueryEscape(keywrd)
	pageStr := strconv.Itoa(page)

	var scrapeURL string
	if keywrd == "" {
		if onlyBKK {
			scrapeURL = "https://www.jobth.com/searchjob2.php?city=city00&page=" + pageStr
		} else {
			scrapeURL = "https://www.jobth.com/searchjob2.php?page=" + pageStr
		}
	} else {
		if onlyBKK {
			scrapeURL = "https://www.jobth.com/searchjob2.php?city=city00&keyword=" + encodedKeywrd + "&page=" + strconv.Itoa(page)
		} else {
			scrapeURL = "https://www.jobth.com/searchjob2.php?keyword=" + encodedKeywrd + "&page=" + strconv.Itoa(page)
		}
	}

	c := colly.NewCollector(colly.AllowedDomains("www.jobth.com", "jobth.com"))

	c.OnError(func(_ *colly.Response, err error) {
		fmt.Printf("JobTH scraping error: %v\n", err)
	})

	c.OnHTML("div.w3-hover-shadow", func(h *colly.HTMLElement) {
		selection := h.DOM
		var tmpCard JobCard
		tmpCard.Title = strings.TrimSpace(selection.Find("a.LinkVisited").Text())
		tmpCard.Company = strings.TrimSpace(selection.Find("div.w3-light-gray a.w3-large").Text())

		var prov string
		var area string

		h.DOM.Find("a").Each(func(_ int, s *goquery.Selection) {
			if s.Is("a[href]:not([class]):not([title])") {
				prov = s.Text()
			}
		})
		area = strings.TrimSpace(selection.Find("div.w3-light-gray a[title]").Text())

		tmpCard.Location = prov + " " + area
		tmpCard.Salary = strings.TrimSpace(selection.Find("div.w3-light-gray font").Next().Text())

		var scrapedAttribute string
		h.DOM.Find("a[href]").Each(func(_ int, s *goquery.Selection) {
			href, exists := s.Attr("href")
			if exists {
				href, err := url.PathUnescape(href)
				if err != nil {
					fmt.Println("Error decoding:", err)
					return
				}
				scrapedAttribute = href
			}
		})

		tmpCard.URL = "https://www.jobth.com" + scrapedAttribute
		tmpCard.Source = "jobth.com"

		// fmt.Println(tmpCard.Title + "\n" + tmpCard.Company + "\n" + tmpCard.Location + "\n" + tmpCard.Salary + "\n" + tmpCard.URL + "\n" + tmpCard.Source + "\n")

		jobthCards = append(jobthCards, tmpCard)
	})

	err := c.Visit(scrapeURL)
	if err != nil {
		return nil, fmt.Errorf("failed to visit JobTH: %w", err)
	}

	return jobthCards, nil
}

func SingleScrapingJobTH(keywrd string, index int) (JobCard, error) {

	if jobthCards != nil {
		jobthCards = nil
	}

	keywrd = strings.ReplaceAll(keywrd, " ", "+")
	// keywrd = strings.Join((strings.Split(strings.TrimSpace(keywrd), " ")), "+")
	// encodedKeywrd := url.QueryEscape(keywrd)

	scrapeURL := "https://www.jobth.com/searchjob2.php?keyword=" + keywrd + "&page=1"

	c := colly.NewCollector(colly.AllowedDomains("www.jobth.com", "jobth.com"))

	c.OnError(func(_ *colly.Response, err error) {
		fmt.Printf("JobTH scraping error: %v\n", err)
	})

	c.OnHTML("div.w3-hover-shadow", func(h *colly.HTMLElement) {
		selection := h.DOM
		var tmpCard JobCard
		tmpCard.Title = strings.TrimSpace(selection.Find("a.LinkVisited").Text())
		tmpCard.Company = strings.TrimSpace(selection.Find("div.w3-light-gray a.w3-large").Text())

		var prov string
		var area string

		h.DOM.Find("a").Each(func(_ int, s *goquery.Selection) {
			if s.Is("a[href]:not([class]):not([title])") {
				prov = s.Text()
			}
		})
		area = strings.TrimSpace(selection.Find("div.w3-light-gray a[title]").Text())

		tmpCard.Location = prov + " " + area
		tmpCard.Salary = strings.TrimSpace(selection.Find("div.w3-light-gray font").Next().Text())

		var scrapedAttribute string
		h.DOM.Find("a[href]").Each(func(_ int, s *goquery.Selection) {
			href, exists := s.Attr("href")
			if exists {
				href, err := url.PathUnescape(href)
				if err != nil {
					fmt.Println("Error decoding:", err)
					return
				}
				scrapedAttribute = href
			}
		})

		tmpCard.URL = "https://www.jobth.com" + scrapedAttribute
		tmpCard.Source = "jobth.com"

		// fmt.Println(tmpCard.Title + "\n" + tmpCard.Company + "\n" + tmpCard.Location + "\n" + tmpCard.Salary + "\n" + tmpCard.URL + "\n" + tmpCard.Source + "\n")

		jobthCards = append(jobthCards, tmpCard)
	})

	err := c.Visit(scrapeURL)
	if err != nil {
		return JobCard{}, fmt.Errorf("failed to visit JobTH: %w", err)
	}

	return jobthCards[index], nil
}
