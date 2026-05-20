package main

import (
	"job-scraping-project/router"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	if os.Getenv("RENDER") == "" && os.Getenv("FLY_APP_NAME") == "" {
		_ = godotenv.Load()
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "10000"
	}

	router.SetUpRoutes()

	log.Println("Server running on port", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
