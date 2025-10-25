package models

import (
	"job-scraping-project/scrapers"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model

	Username     string         `json:"username" gorm:"not null"`
	FirstName    string         `json:"firstname" gorm:"not null"`
	LastName     string         `json:"lastname" gorm:"not null"`
	DateOfBirth  string         `json:"date_of_birth" gorm:"not null"`
	Email        string         `json:"email" gorm:"uniqueIndex;not null"`
	Password     string         `json:"password" gorm:"not null"`
	Description  string         `json:"description"`
	FavoriteJobs []FavoriteJobs `gorm:"foreignKey:UserID"`
}

type FavoriteJobs struct {
	gorm.Model
	scrapers.JobCard
	UserID uint
}

type PreferenceJobs struct {
	gorm.Model
	scrapers.JobCard
	UserID uint
}

type CVJobs struct {
	gorm.Model
	scrapers.JobCard
	UserID uint
}
