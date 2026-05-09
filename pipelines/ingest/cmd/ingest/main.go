package main

import (
	"flag"
	"log"
)

func main() {
	input := flag.String("input", "data/files.txt", "input filename list")
	output := flag.String("output", "out/plays.jsonl", "output JSONL")
	report := flag.String("report", "out/report.md", "low-confidence cluster report")
	flag.Parse()

	log.Printf("ingest stub: input=%s output=%s report=%s", *input, *output, *report)
	log.Println("TODO: see Task 17")
}
