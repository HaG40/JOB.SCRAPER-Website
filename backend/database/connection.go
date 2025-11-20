package database

import (
	"job-scraping-project/models"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect() *gorm.DB {

	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	dsn := "host=localhost user=postgres password=" + os.Getenv("DB_PASS") + " dbname=UsersDB port=5432 sslmode=disable TimeZone=Asia/Bangkok"

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})

	// if err != nil {
	// 	log.Fatal("Database connection failed to initialize")
	// 	return nil
	// }

	db.AutoMigrate(&models.User{}, &models.FavoriteJobs{}, &models.FindPost{}, &models.RecruitPost{}, &models.ContractPost{}, &models.Comment{}, &models.PreferenceJobs{}, &models.CVJobs{})

	return db
}
