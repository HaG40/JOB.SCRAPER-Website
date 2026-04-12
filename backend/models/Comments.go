package models

type Comment struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	PostID    uint   `json:"post_id"`
	PostType  string `json:"post_type"`
	UserID    uint   `json:"user_id"`
	Username  string `json:"username"`
	Text      string `json:"text"`
	CreatedAt string `json:"created_at"`
}
