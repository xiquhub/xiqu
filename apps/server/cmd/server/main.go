package main

import (
	"log"
	"net/http"
	"os"

	"github.com/xiquhub/xiqu/apps/server/internal/api"
)

func main() {
	addr := ":8787"
	if v := os.Getenv("XIQU_API_ADDR"); v != "" {
		addr = v
	}
	log.Printf("xiqu api listening on %s", addr)
	if err := http.ListenAndServe(addr, api.NewRouter()); err != nil {
		log.Fatal(err)
	}
}
