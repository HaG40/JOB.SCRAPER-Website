package controller

import (
	"encoding/json"
	"errors"
	"job-scraping-project/database"
	"job-scraping-project/models"

	"net/http"

	"gorm.io/gorm"
)

func PostFindJob(w http.ResponseWriter, r *http.Request) {

	if DB == nil {
		db := database.Connect()
		DB = db
	}

	if r.Method == http.MethodPost {
		var PostFindJob models.FindPost
		if err := json.NewDecoder(r.Body).Decode(&PostFindJob); err != nil {
			http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
			return
		}

		if PostFindJob.Title == "" || PostFindJob.Description == "" || PostFindJob.Type == "" {
			http.Error(w, "โปรดกรอกข้อมูลที่จำเป็นให้ครบถ้วน", http.StatusBadRequest)
			return
		}

		if PostFindJob.Contact.Email == "" && PostFindJob.Contact.Tel == "" && PostFindJob.Contact.Line == "" && PostFindJob.Contact.Instagram == "" && PostFindJob.Contact.FaceBook == "" && PostFindJob.Contact.LinkedIn == "" {
			http.Error(w, "โปรดกรอกข้อมูลติดต่ออย่างน้อย 1 ชนิด", http.StatusBadRequest)
			return
		}

		getUserId := DB.Where("Id = ?", PostFindJob.PostedByID).First(&PostFindJob.PostedBy)
		if getUserId.Error != nil {
			if errors.Is(getUserId.Error, gorm.ErrRecordNotFound) {
				http.Error(w, "ไม่พบชื่อผู้ใช้", http.StatusNotFound)
				return
			} else {
				http.Error(w, "เกิดข้อผิดพลาด", http.StatusInternalServerError)
				return
			}
		}

		if PostFindJob.PostedByID == 0 {
			http.Error(w, "ไม่พบบัญชีผู้ใข้", http.StatusBadRequest)
			return
		}

		if err := DB.Create(&PostFindJob).Error; err != nil {
			http.Error(w, "Database error: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(PostFindJob)
		w.WriteHeader(http.StatusOK)

	} else {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}
}

func PostRecruitJob(w http.ResponseWriter, r *http.Request) {
	if DB == nil {
		db := database.Connect()
		DB = db
	}

	if r.Method == http.MethodPost {
		var PostRecruitJob models.RecruitPost
		if err := json.NewDecoder(r.Body).Decode(&PostRecruitJob); err != nil {
			http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
			return
		}
		if PostRecruitJob.Title == "" || PostRecruitJob.Description == "" || PostRecruitJob.Type == "" {
			http.Error(w, "โปรดกรอกข้อมูลที่จำเป็นให้ครบถ้วน", http.StatusBadRequest)
			return
		}

		if PostRecruitJob.Type != "find" && PostRecruitJob.Type != "recruit" {
			http.Error(w, "ประเภทของโพสต์ไม่ถูกต้อง", http.StatusBadRequest)
		}

		if PostRecruitJob.Contact.Email == "" && PostRecruitJob.Contact.Tel == "" && PostRecruitJob.Contact.Line == "" && PostRecruitJob.Contact.Instagram == "" && PostRecruitJob.Contact.FaceBook == "" && PostRecruitJob.Contact.LinkedIn == "" {
			http.Error(w, "โปรดกรอกข้อมูลติดต่ออย่างน้อย 1 ชนิด", http.StatusBadRequest)
			return
		}

		getUserId := DB.Where("Id = ?", PostRecruitJob.PostedByID).First(&PostRecruitJob.PostedBy)
		if getUserId.Error != nil {
			if errors.Is(getUserId.Error, gorm.ErrRecordNotFound) {
				http.Error(w, "ไม่พบชื่อผู้ใช้", http.StatusNotFound)
				return
			} else {
				http.Error(w, "เกิดข้อผิดพลาด", http.StatusInternalServerError)
				return
			}
		}

		if PostRecruitJob.PostedByID == 0 {
			http.Error(w, "ไม่พบบัญชีผู้ใข้", http.StatusBadRequest)
			return
		}

		if err := DB.Create(&PostRecruitJob).Error; err != nil {
			http.Error(w, "Database error: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(PostRecruitJob)
		w.WriteHeader(http.StatusOK)
	} else {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}
}

func PostContractJob(w http.ResponseWriter, r *http.Request) {
	if DB == nil {
		db := database.Connect()
		DB = db
	}

	if r.Method == http.MethodPost {
		var PostContractJob models.ContractPost
		if err := json.NewDecoder(r.Body).Decode(&PostContractJob); err != nil {
			http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
			return
		}
		if PostContractJob.Title == "" || PostContractJob.Description == "" || PostContractJob.Type == "" {
			http.Error(w, "โปรดกรอกข้อมูลที่จำเป็นให้ครบถ้วน", http.StatusBadRequest)
			return
		}

		if PostContractJob.Type != "find" && PostContractJob.Type != "contract" {
			http.Error(w, "ประเภทของโพสต์ไม่ถูกต้อง", http.StatusBadRequest)
		}

		if PostContractJob.Contact.Email == "" && PostContractJob.Contact.Tel == "" && PostContractJob.Contact.Line == "" && PostContractJob.Contact.Instagram == "" && PostContractJob.Contact.FaceBook == "" && PostContractJob.Contact.LinkedIn == "" {
			http.Error(w, "โปรดกรอกข้อมูลติดต่ออย่างน้อย 1 ชนิด", http.StatusBadRequest)
			return
		}

		getUserId := DB.Where("Id = ?", PostContractJob.PostedByID).First(&PostContractJob.PostedBy)
		if getUserId.Error != nil {
			if errors.Is(getUserId.Error, gorm.ErrRecordNotFound) {
				http.Error(w, "ไม่พบชื่อผู้ใช้", http.StatusNotFound)
				return
			} else {
				http.Error(w, "เกิดข้อผิดพลาด", http.StatusInternalServerError)
				return
			}
		}

		if PostContractJob.PostedByID == 0 {
			http.Error(w, "ไม่พบบัญชีผู้ใข้", http.StatusBadRequest)
			return
		}

		if err := DB.Create(&PostContractJob).Error; err != nil {
			http.Error(w, "Database error: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(PostContractJob)
		w.WriteHeader(http.StatusOK)
	} else {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}
}

func GetFindJob(w http.ResponseWriter, r *http.Request) {
	if DB == nil {
		db := database.Connect()
		DB = db
	}

	if r.Method == http.MethodGet {
		var findPosts []models.FindPost

		err := DB.Preload("PostedBy").Find(&findPosts).Error
		if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		if len(findPosts) == 0 {
			http.Error(w, "ไม่พบโพสต์", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(findPosts)
		return

	} else {
		http.Error(w, "Only GET allowed", http.StatusMethodNotAllowed)
		return
	}
}

func GetRecruitJob(w http.ResponseWriter, r *http.Request) {
	if DB == nil {
		db := database.Connect()
		DB = db
	}

	if r.Method == http.MethodGet {
		var recruitPosts []models.RecruitPost

		err := DB.Preload("PostedBy").Find(&recruitPosts).Error
		if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		if len(recruitPosts) == 0 {
			http.Error(w, "ไม่พบโพสต์", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(recruitPosts)
		return

	} else {
		http.Error(w, "Only GET allowed", http.StatusMethodNotAllowed)
		return
	}
}

func GetContractJob(w http.ResponseWriter, r *http.Request) {
	if DB == nil {
		db := database.Connect()
		DB = db
	}

	if r.Method == http.MethodGet {
		var contractPosts []models.ContractPost

		err := DB.Preload("PostedBy").Find(&contractPosts).Error
		if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		if len(contractPosts) == 0 {
			http.Error(w, "ไม่พบโพสต์", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(contractPosts)
		return

	} else {
		http.Error(w, "Only GET allowed", http.StatusMethodNotAllowed)
		return
	}
}
