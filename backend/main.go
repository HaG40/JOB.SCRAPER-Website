package main

import (
	"job-scraping-project/router"
	"log"
	"net/http"
	"os"

	"github.com/rs/cors"

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

	c := cors.New(cors.Options{
		AllowedOrigins: []string{
			"https://job-scraper-frontend-fawn.vercel.app/",
		},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowCredentials: true,
		AllowedHeaders:   []string{"*"},
	})

	handler := c.Handler(http.DefaultServeMux)

	log.Fatal(http.ListenAndServe(":"+port, handler))
}
