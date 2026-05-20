package main

import (
	"job-scraping-project/router"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"github.com/rs/cors"
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
			"https://job-scraper-frontend-fawn.vercel.app",
			"https://job-scraper-frontend-fawn.vercel.app/", // --- IGNORE ---
		},
		AllowedMethods: []string{
			"GET",
			"POST",
			"PUT",
			"DELETE",
			"OPTIONS",
		},
		AllowedHeaders: []string{
			"Content-Type",
			"Authorization",
		},
		AllowCredentials: true,
		Debug:            true,
	})

	handler := c.Handler(http.DefaultServeMux)

	log.Println("Running on port", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}
