package database

import (
	"job-scraping-project/models"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Connect() *gorm.DB {

	dsn := os.Getenv("DATABASE_URL")

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	db.AutoMigrate(
		&models.User{},
		&models.FavoriteJobs{},
		&models.FindPost{},
		&models.RecruitPost{},
		&models.ContractPost{},
		&models.Comment{},
		&models.PreferenceJobs{},
		&models.CVJobs{},
	)

	return db
}
