package main

import (
	"job-scraping-project/router"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
)

func withCORS(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		w.Header().Set("Access-Control-Allow-Origin", "https://job-scraper-frontend-fawn.vercel.app")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		h.ServeHTTP(w, r)
	})
}

func main() {

	if os.Getenv("RENDER") == "" && os.Getenv("FLY_APP_NAME") == "" {
		_ = godotenv.Load()
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "10000"
	}

	router.SetUpRoutes()

	handler := withCORS(http.DefaultServeMux)

	log.Println("Running on port", port)

	log.Fatal(http.ListenAndServe(":"+port, handler))
}
