package scrapers

type JobCard struct {
	Title    string `json:"title"`
	Company  string `json:"company"`
	Location string `json:"location"`
	Salary   string `json:"salary"`
	URL      string `json:"url"`
	Source   string `json:"source"`
}
