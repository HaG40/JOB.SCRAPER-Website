package controller

import (
	"encoding/json"
	"job-scraping-project/database"
	"job-scraping-project/models"
	"net/http"
	"strconv"
)

func GetComments(w http.ResponseWriter, r *http.Request) {

	if DB == nil {
		db := database.Connect()
		DB = db
	}

	if r.Method == http.MethodGet {
		postID := r.URL.Query().Get("post_id")
		postType := r.URL.Query().Get("type")

		if postType == "" && postID == "" {
			http.Error(w, "Missing parameters", http.StatusBadRequest)
			return
		}

		postIDInt, err := strconv.Atoi(postID)
		if err != nil {
			postIDInt = 0
		}

		var comments []models.Comment

		if err := DB.Where("post_type = ? AND post_id = ?", postType, postIDInt).Find(&comments).Error; err != nil {
			http.Error(w, "Database error: "+err.Error(), http.StatusInternalServerError)
			return
		}

		if len(comments) == 0 {
			http.Error(w, "ไม่พบความคิดเห็น", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(comments)
		return

	} else {
		http.Error(w, "Only GET allowed", http.StatusMethodNotAllowed)
		return
	}
}

func PostComment(w http.ResponseWriter, r *http.Request) {

	if DB == nil {
		db := database.Connect()
		DB = db
	}

	if r.Method == http.MethodPost {
		postType := r.URL.Query().Get("type")
		if postType == "" {
			http.Error(w, "Missing parameter", http.StatusBadRequest)
			return
		}
		if postType != "find" && postType != "recruit" && postType != "contract" {
			http.Error(w, "Invalid parameter", http.StatusBadRequest)
			return
		}

		var comment models.Comment
		err := json.NewDecoder(r.Body).Decode(&comment)
		if err != nil {
			http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
			return
		}

		comment.PostType = postType

		if comment.Text == "" {
			http.Error(w, "ไม่อนุญาตให้แสดงความคิดเห็นเป็นช่องว่าง", http.StatusBadRequest)
			return
		}

		if comment.PostID == 0 {
			http.Error(w, "ไม่พบโพสต์", http.StatusBadRequest)
			return
		}

		if err := DB.Create(&comment).Error; err != nil {
			http.Error(w, "Database error: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(comment)
		return

	} else {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}
}
