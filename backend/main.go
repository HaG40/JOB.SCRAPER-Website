package main

import (
	"job-scraping-project/router"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
)

func main() {

	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	router.SetUpRoutes()
	http.ListenAndServe(":"+os.Getenv("PORT"), nil)
}
