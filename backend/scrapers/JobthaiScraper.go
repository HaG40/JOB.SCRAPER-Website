package scrapers

import (
	"fmt"
	"net/url"
	"strconv"
	"strings"

	"github.com/gocolly/colly"
)

var jobthaiCards []JobCard

func ScrapingJobthai(keywrd string, page int, province string, onlyBKK bool) ([]JobCard, error) {

	if jobthaiCards != nil {
		jobthaiCards = nil
	}

	keywrd = strings.Join((strings.Split(strings.TrimSpace(keywrd), " ")), "+")
	encodedKeywrd := url.QueryEscape(keywrd)
	// encodedProvince := url.QueryEscape(province)
	pageStr := strconv.Itoa(page)

	var scrapeURL string
	if keywrd == "" {
		if province != "" {
			scrapeURL = "https://www.jobthai.com/หางาน/" + encodedKeywrd + "/" + pageStr
		} else if onlyBKK {
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
		tmpCard.Title = strings.TrimSpace(selection.Find("div.blrqAx div.jPyROu h2.kMinKN").Text())
		tmpCard.Company = strings.TrimSpace(selection.Find("div.blrqAx div.dHtBqY span.gXNyXH").Text())
		tmpCard.Location = strings.TrimSpace(selection.Find("div.blrqAxdiv.kjOLtL h3#location-text").Text())
		if tmpCard.Location == "" {
			tmpCard.Location = strings.TrimSpace(selection.Find("div.blrqAx div.kjOLtL span#location-text").Text())
		}
		tmpCard.Salary = strings.TrimSpace(selection.Find("div.blrqAx div.kjOLtL span#salary-text").Text())

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

func SingleScrapingJobthai(keywrd string, page int, index int) (JobCard, error) {

	if jobthaiCards != nil {
		jobthaiCards = nil
	}

	keywrd = strings.ReplaceAll(keywrd, " ", "+")
	pageStr := strconv.Itoa(page)

	// keywrd = strings.Join((strings.Split(strings.TrimSpace(keywrd), " ")), "+")
	// encodedKeywrd := url.QueryEscape(keywrd)

	scrapeURL := "https://www.jobthai.com/th/jobs?keyword=" + keywrd + "&page=" + pageStr

	c := colly.NewCollector(colly.AllowedDomains("www.jobthai.com", "jobthai.com"))

	c.OnError(func(_ *colly.Response, err error) {
		fmt.Printf("JobThai scraping error: %v\n", err)
	})

	c.OnHTML("a[ga-name]", func(h *colly.HTMLElement) {
		selection := h.DOM
		var tmpCard JobCard
		tmpCard.Title = strings.TrimSpace(selection.Find("div.blrqAx div.jPyROu h2.kMinKN").Text())
		tmpCard.Company = strings.TrimSpace(selection.Find("div.blrqAx div.dHtBqY span.gXNyXH").Text())
		tmpCard.Location = strings.TrimSpace(selection.Find("div.blrqAxdiv.kjOLtL h3#location-text").Text())
		if tmpCard.Location == "" {
			tmpCard.Location = strings.TrimSpace(selection.Find("div.blrqAx div.kjOLtL span#location-text").Text())
		}
		tmpCard.Salary = strings.TrimSpace(selection.Find("div.blrqAx div.kjOLtL span#salary-text").Text())

		scrapedAttribute := h.Attr("href")
		tmpCard.URL = "https://www.jobthai.com" + scrapedAttribute
		tmpCard.Source = "jobthai.com"

		// fmt.Println(tmpCard.Title + "\n" + tmpCard.Company + "\n" + tmpCard.Location + "\n" + tmpCard.Salary + "\n" + tmpCard.URL + "\n" + tmpCard.Source + "\n")

		jobthaiCards = append(jobthaiCards, tmpCard)
	})

	err := c.Visit(scrapeURL)
	if err != nil {
		return JobCard{}, fmt.Errorf("failed to visit JobThai: %w", err)
	}

	return jobthaiCards[index], nil
}

func sanitizeJobThaiURL(raw string) (string, error) {
	u, err := url.Parse(raw)
	if err != nil {
		return "", err
	}

	segments := strings.Split(u.Path, "/")
	var cleaned []string

	for _, s := range segments {
		if s != "company" {
			cleaned = append(cleaned, s)
		}
	}

	u.Path = strings.Join(cleaned, "/")
	return u.String(), nil
}

func formatJobText(detail, req string) string {
	var builder strings.Builder

	builder.WriteString("รายละเอียดงาน :\n\n")
	builder.WriteString(detail)
	builder.WriteString("\n\n\n")

	builder.WriteString("คุณสมบัติผู้สมัคร :\n\n")
	builder.WriteString(req)

	return builder.String()
}

func DetailScrapingJobthai(jobURL string) (string, error) {
	var jobDetail string
	var jobRequirements string

	// แปลง URL ก่อน
	cleanURL, err := sanitizeJobThaiURL(jobURL)
	if err != nil {
		return "ไม่พบข้อมูลงาน", fmt.Errorf("invalid JobThai URL: %w", err)
	}

	c := colly.NewCollector(
		colly.AllowedDomains("www.jobthai.com", "jobthai.com"),
	)

	c.OnError(func(_ *colly.Response, err error) {
		fmt.Printf("JobThai detail scraping error: %v\n", err)
	})

	c.OnHTML("span#job-detail", func(h *colly.HTMLElement) {
		jobDetail = h.Text
	})

	c.OnHTML("div#job-properties-wrapper ol", func(h *colly.HTMLElement) {
		var builder strings.Builder

		h.ForEach("li", func(_ int, el *colly.HTMLElement) {
			text := strings.TrimSpace(el.Text)
			if text != "" {
				builder.WriteString("- ")
				builder.WriteString(text)
				builder.WriteString("\n")
			}
		})

		jobRequirements = builder.String()
	})

	fmt.Println("Visiting JobThai job detail page:", cleanURL)

	err = c.Visit(cleanURL)
	if err != nil {
		return "ไม่พบข้อมูลงาน", fmt.Errorf("failed to visit JobThai job detail: %w", err)
	}

	return formatJobText(jobDetail, jobRequirements), nil
}
