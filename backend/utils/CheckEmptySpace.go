package utils

import "strings"

func HasEmptyOrSpace(s string) bool {
	return s == "" || strings.ContainsAny(s, " \t\n\r")
}
