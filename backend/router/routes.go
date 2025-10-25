package router

import (
	"job-scraping-project/controller"
	"job-scraping-project/middleware"
	"net/http"
)

func SetUpRoutes() {
	// Job Search Route
	http.Handle("/api/jobs", middleware.JobsMiddleware(http.HandlerFunc(controller.JobsHandler)))
	http.Handle("/api/jobs/favorite/add", middleware.JobsMiddleware(http.HandlerFunc(controller.AddFavoriteJobHandler)))
	http.Handle("/api/jobs/favorite/delete", middleware.JobsMiddleware(http.HandlerFunc(controller.DeleteFavoriteJobHandler)))
	http.Handle("/api/jobs/favorite", middleware.JobsMiddleware(http.HandlerFunc(controller.GetFavoriteJobsHandler)))
	http.Handle("/api/jobs/favorite/check", middleware.JobsMiddleware(http.HandlerFunc(controller.CheckFavoriteJobHandler)))

	http.Handle("/api/jobs/preferences/add", middleware.JobsMiddleware(http.HandlerFunc(controller.AddPreferenceJobHandler)))
	http.Handle("/api/jobs/preferences/delete", middleware.JobsMiddleware(http.HandlerFunc(controller.DeletePreferenceJobHandler)))
	http.Handle("/api/jobs/preferences", middleware.JobsMiddleware(http.HandlerFunc(controller.GetPreferenceJobsHandler)))

	http.Handle("/api/jobs/cv/add", middleware.JobsMiddleware(http.HandlerFunc(controller.AddCVJobHandler)))
	http.Handle("/api/jobs/cv/delete", middleware.JobsMiddleware(http.HandlerFunc(controller.DeleteCVJobHandler)))
	http.Handle("/api/jobs/cv", middleware.JobsMiddleware(http.HandlerFunc(controller.GetCVJobsHandler)))

	// Job Post Route
	http.Handle("/api/jobs/post/find", middleware.JobsMiddleware(http.HandlerFunc(controller.PostFindJob)))
	http.Handle("/api/jobs/post/recruit", middleware.JobsMiddleware(http.HandlerFunc(controller.PostRecruitJob)))
	http.Handle("/api/jobs/post/contract", middleware.JobsMiddleware(http.HandlerFunc(controller.PostContractJob)))
	http.Handle("/api/jobs/get/find", middleware.JobsMiddleware(http.HandlerFunc(controller.GetFindJob)))
	http.Handle("/api/jobs/get/recruit", middleware.JobsMiddleware(http.HandlerFunc(controller.GetRecruitJob)))
	http.Handle("/api/jobs/get/contract", middleware.JobsMiddleware(http.HandlerFunc(controller.GetContractJob)))
	http.Handle("/api/user/view", middleware.JobsMiddleware(http.HandlerFunc(http.HandlerFunc(controller.ViewUser))))

	// Comments On Post
	http.Handle("/api/jobs/get/comments", middleware.JobsMiddleware(http.HandlerFunc(controller.GetComments)))
	http.Handle("/api/jobs/post/comments", middleware.JobsMiddleware(http.HandlerFunc(controller.PostComment)))

	// Authentication Routes
	http.HandleFunc("/api/register", controller.Register)
	http.HandleFunc("/api/login", controller.Login)

	http.Handle("/api/protected", middleware.AuthMiddleware(http.HandlerFunc(controller.ProtectedHandler)))
	http.Handle("/api/user", middleware.AuthMiddleware(http.HandlerFunc(controller.User)))
	http.Handle("/api/user/edit", middleware.AuthMiddleware(http.HandlerFunc(controller.EditUser)))
	http.Handle("/api/logout", middleware.AuthMiddleware(http.HandlerFunc(controller.Logout)))

}
