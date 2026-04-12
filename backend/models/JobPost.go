package models

import "gorm.io/gorm"

type JobPost struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Type        string `json:"type"`
	PostedByID  uint   `gorm:"primaryKey" json:"posted_by_id"`
	PostedBy    User   `json:"posted_by"`
}

type FindPost struct {
	gorm.Model
	JobPost
	Contact
	Comments []Comment `json:"comments" gorm:"foreignKey:PostID"`
}

type RecruitPost struct {
	gorm.Model
	JobPost
	CompanyName string `json:"company_name"`
	Location    string `json:"location"`
	Salary      string `json:"salary"`
	Contact
	Comments []Comment `json:"comments" gorm:"foreignKey:PostID"`
}

type ContractPost struct {
	gorm.Model
	JobPost
	Contractor string `json:"contractor"`
	Location   string `json:"location"`
	Pay        string `json:"pay"`
	Contact
	Comments []Comment `json:"comments" gorm:"foreignKey:PostID"`
}

type Contact struct {
	Email     string `json:"email"`
	Tel       string `json:"tel"`
	Line      string `json:"line"`
	Instagram string `json:"instagram"`
	FaceBook  string `json:"facebook"`
	LinkedIn  string `json:"linkedin"`
}
