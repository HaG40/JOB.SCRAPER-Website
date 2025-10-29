package controller

import (
	"encoding/json"
	"errors"
	"job-scraping-project/database"
	"job-scraping-project/models"
	"job-scraping-project/utils"

	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Register(w http.ResponseWriter, r *http.Request) {

	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Access-Control-Allow-Credentials", "true")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if DB == nil {
		db := database.Connect()
		DB = db
	}

	if r.Method == http.MethodPost {
		var user models.User
		if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
			http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
			return
		}

		if user.Username == "" || user.Email == "" || user.Password == "" || user.FirstName == "" || user.LastName == "" || user.DateOfBirth == "" {
			http.Error(w, "โปรดกรอกข้อมูลให้ครบถ้วน", http.StatusBadRequest)
			return
		}

		if utils.HasEmptyOrSpace(user.Username) || utils.HasEmptyOrSpace(user.Email) || utils.HasEmptyOrSpace(user.Password) || utils.HasEmptyOrSpace(user.FirstName) || utils.HasEmptyOrSpace(user.LastName) || utils.HasEmptyOrSpace(user.DateOfBirth) {
			http.Error(w, "โปรดกรอกข้อมูลโดยที่ไม่มีการเว้นช่องว่าง", http.StatusBadRequest)
			return
		}

		if len(user.Password) < 8 {
			http.Error(w, "รหัสผ่านต้องมีความยาวมากกว่า 8", http.StatusBadRequest)
			return
		}

		dob, err := time.Parse("2006-01-02", user.DateOfBirth)
		if err != nil {
			http.Error(w, "รูปแบบวันเกิดไม่ถูกต้อง (รูปแบบที่ถูกต้อง: YYYY-MM-DD)", http.StatusBadRequest)
			return
		}

		today := time.Now()
		age := today.Year() - dob.Year()
		if today.Month() < dob.Month() || (today.Month() == dob.Month() && today.Day() < dob.Day()) {
			age--
		}

		if age < 15 {
			http.Error(w, "ผู้ใช้ต้องมีอายุอย่างน้อย 15 ปี", http.StatusBadRequest)
			return
		}

		if len(user.Password) < 8 {
			http.Error(w, "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร", http.StatusBadRequest)
			return
		}

		// Hash the password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
		if err != nil {
			http.Error(w, "The task can't be completed", http.StatusInternalServerError)
			return
		}
		user.Password = string(hashedPassword)

		if err := DB.Create(&user).Error; err != nil {
			http.Error(w, "Database error: "+err.Error(), http.StatusInternalServerError)
			return
		}

		user.Password = ""
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(user)
		w.WriteHeader(http.StatusOK)

	} else {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

}

func Login(w http.ResponseWriter, r *http.Request) {

	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Access-Control-Allow-Credentials", "true")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	type LoginRequest struct {
		EmailOrUsername string `json:"user"`
		Password        string `json:"password"`
	}

	if DB == nil {
		db := database.Connect()
		DB = db
	}

	if r.Method == http.MethodPost {

		var loginRequest LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&loginRequest); err != nil {
			http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
			return
		}

		if loginRequest.EmailOrUsername == "" || loginRequest.Password == "" {
			http.Error(w, "โปรดกรอกข้อมูลให้ครบถ้วน", http.StatusBadRequest)
			return
		}

		var user models.User
		authenticateUser := DB.Where("email = ? OR username = ?", loginRequest.EmailOrUsername, loginRequest.EmailOrUsername).First(&user)
		if authenticateUser.Error != nil {
			if errors.Is(authenticateUser.Error, gorm.ErrRecordNotFound) {
				http.Error(w, "ไม่พบอีเมลล์/ชื่อผู้ใช้ หรือ รหัสผ่าน", http.StatusNotFound)
				return
			} else {
				http.Error(w, "เกิดข้อผิดพลาด", http.StatusInternalServerError)
				return
			}
		}

		if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(loginRequest.Password)); err != nil {
			http.Error(w, "รหัสผ่านไม่ถูกต้อง", http.StatusBadRequest)
			return
		}

		claims := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.RegisteredClaims{
			Issuer:    strconv.Itoa(int(user.ID)),
			Subject:   "user_" + user.Username,
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		})

		secret := os.Getenv("SECRET_KEY")
		if secret == "" {
			log.Fatal("Secret key is not set")
			return
		}

		token, err := claims.SignedString([]byte(secret))
		if err != nil {
			http.Error(w, "Token generation failed", http.StatusInternalServerError)
			return
		}

		http.SetCookie(w, &http.Cookie{
			Name:     "access-token",
			Value:    token,
			HttpOnly: true,
			Secure:   true,
			Path:     "/",
			SameSite: http.SameSiteLaxMode,
			MaxAge:   int(time.Now().Add(time.Hour * 24).Unix()),
		})

		user.Password = ""
		w.Header().Set("Content-Type", "application/json")
		// json.NewEncoder(w).Encode(user)
		json.NewEncoder(w).Encode(token)
		w.WriteHeader(http.StatusOK)

	} else {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}
}

func User(w http.ResponseWriter, r *http.Request) {

	type Profile struct {
		UserId        uint   `json:"user_id"`
		Username      string `json:"username"`
		FirstName     string `json:"first_name"`
		LastName      string `json:"last_name"`
		DateOfBirth   string `json:"date_of_birth"`
		Email         string `json:"email"`
		InterestedJob string `json:"interested_job"`
		CV            []byte `json:"cv"`
	}

	if DB == nil {
		db := database.Connect()
		DB = db
	}

	if r.Method == http.MethodGet {
		userID, valid := r.Context().Value("userID").(string)
		if !valid {
			http.Error(w, "User ID not found in context", http.StatusInternalServerError)
			return
		}

		userIDString, err := strconv.ParseUint(userID, 10, 64)
		if err != nil {
			http.Error(w, "Invalid User ID", http.StatusBadRequest)
			return
		}

		var user models.User
		findUser := DB.First(&user, userIDString)
		if findUser.Error != nil {
			http.Error(w, "User ID not found", http.StatusNotFound)
			return
		}

		var profile Profile
		profile.UserId, profile.Username, profile.FirstName, profile.LastName, profile.DateOfBirth, profile.Email, profile.InterestedJob, profile.CV = user.ID, user.Username, user.FirstName, user.LastName, user.DateOfBirth, user.Email, user.InterestedJob, user.CV

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(profile)
		w.WriteHeader(http.StatusOK)

	} else {
		http.Error(w, "Only GET allowed", http.StatusMethodNotAllowed)
		return
	}
}

func ViewUser(w http.ResponseWriter, r *http.Request) {

	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Access-Control-Allow-Credentials", "true")

	type Profile struct {
		UserId        uint   `json:"user_id"`
		Username      string `json:"username"`
		FirstName     string `json:"first_name"`
		LastName      string `json:"last_name"`
		DateOfBirth   string `json:"date_of_birth"`
		Email         string `json:"email"`
		InterestedJob string `json:"interested_job"`
		CV            []byte `json:"cv"`
	}

	if r.Method == http.MethodGet {
		userID := r.URL.Query().Get("userID")

		var user models.User
		findUser := DB.First(&user, userID).Error
		if findUser != nil {
			if findUser == gorm.ErrRecordNotFound {
				http.Error(w, "ไม่พบผู้ใช้", http.StatusNotFound)
				return
			}
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		var profile Profile
		profile.UserId, profile.Username, profile.FirstName, profile.LastName, profile.DateOfBirth, profile.Email, profile.InterestedJob, profile.CV = user.ID, user.Username, user.FirstName, user.LastName, user.DateOfBirth, user.Email, user.InterestedJob, user.CV

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(profile)
		w.WriteHeader(http.StatusOK)
	} else {
		http.Error(w, "Only GET allowed", http.StatusMethodNotAllowed)
		return
	}
}

func ProtectedHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		userID, valid := r.Context().Value("userID").(string)
		if !valid {
			http.Error(w, "User ID not found in context", http.StatusInternalServerError)
			return
		}
		w.Write([]byte("User ID " + userID + " authorized"))
		w.WriteHeader(http.StatusOK)
	} else {
		http.Error(w, "Only GET allowed", http.StatusMethodNotAllowed)
		return
	}
}

func Logout(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		http.SetCookie(w, &http.Cookie{
			Name:     "access-token",
			Value:    "",
			HttpOnly: true,
			Secure:   true,
			Path:     "/",
			SameSite: http.SameSiteLaxMode,
			MaxAge:   -1,
		})

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Logged out"))
	} else {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}
}

func EditUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Only PUT allowed", http.StatusMethodNotAllowed)
		return
	}

	var updatedUser struct {
		ID            uint   `json:"ID"`
		Username      string `json:"username"`
		FirstName     string `json:"firstName"`
		LastName      string `json:"lastName"`
		DateOfBirth   string `json:"date_of_birth"`
		Email         string `json:"email"`
		InterestedJob string `json:"interested_job"` // "job1,job2,job3"
		CV            []byte `json:"cv"`
	}

	if err := json.NewDecoder(r.Body).Decode(&updatedUser); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Validation
	if updatedUser.Username == "" || updatedUser.FirstName == "" || updatedUser.LastName == "" || updatedUser.Email == "" || updatedUser.DateOfBirth == "" {
		http.Error(w, "โปรดกรอกข้อมูลที่จำเป็นให้ครบถ้วน", http.StatusBadRequest)
		return
	}

	var existingUser models.User
	if err := DB.First(&existingUser, updatedUser.ID).Error; err != nil {
		http.Error(w, "ไม่พบผู้ใช้งาน", http.StatusNotFound)
		return
	}

	existingUser.Username = updatedUser.Username
	existingUser.FirstName = updatedUser.FirstName
	existingUser.LastName = updatedUser.LastName
	existingUser.Email = updatedUser.Email
	existingUser.DateOfBirth = updatedUser.DateOfBirth
	existingUser.InterestedJob = updatedUser.InterestedJob
	if len(updatedUser.CV) > 0 {
		existingUser.CV = updatedUser.CV
	}

	if err := DB.Save(&existingUser).Error; err != nil {
		http.Error(w, "เกิดข้อผิดพลาดในการอัปเดตผู้ใช้: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(existingUser)
}

func GetUserCV(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("id")
	if userID == "" {
		http.Error(w, "Missing user ID", http.StatusBadRequest)
		return
	}

	var user models.User
	if err := DB.First(&user, userID).Error; err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	if len(user.CV) == 0 {
		http.Error(w, "No CV uploaded", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", `inline; filename="cv.pdf"`)
	w.WriteHeader(http.StatusOK)
	w.Write(user.CV)
}
