package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/xiquhub/xiqu/pipelines/ingest/internal/cluster"
	"github.com/xiquhub/xiqu/pipelines/ingest/internal/inventory"
	"github.com/xiquhub/xiqu/pipelines/ingest/internal/llm"
	"github.com/xiquhub/xiqu/pipelines/ingest/internal/output"
	"github.com/xiquhub/xiqu/pipelines/ingest/internal/parser"
	"github.com/xiquhub/xiqu/pipelines/ingest/internal/parts"
	"github.com/xiquhub/xiqu/pipelines/ingest/internal/production"
	"github.com/xiquhub/xiqu/pipelines/ingest/internal/slug"
	"github.com/xiquhub/xiqu/pipelines/ingest/internal/types"
)

func main() {
	input := flag.String("input", "data/files.txt", "input filename list")
	outPath := flag.String("output", "out/plays.jsonl", "output JSONL")
	report := flag.String("report", "out/report.md", "low-confidence cluster report")
	flag.Parse()

	if err := run(*input, *outPath, *report); err != nil {
		log.Fatal(err)
	}
}

func run(inputPath, outPath, reportPath string) error {
	files, err := inventory.Load(inputPath)
	if err != nil {
		return fmt.Errorf("inventory: %w", err)
	}
	log.Printf("loaded %d filenames", len(files))

	parsed := make([]types.ParsedFile, 0, len(files))
	for _, f := range files {
		pf := parser.Parse(f)
		pf.PartOrder = parts.SortOrder(pf.PartLabel)
		pf.PartLabel = parts.NormalizeLabel(pf.PartLabel)
		parsed = append(parsed, pf)
	}

	rule := cluster.ByNormalizedTitle(parsed)
	log.Printf("rule clusters: %d", len(rule))

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()
	llmClient := llm.NewAnthropicFromEnv()
	if llmClient == nil {
		log.Println("ANTHROPIC_API_KEY not set; skipping LLM refinement")
	}
	refined, err := llm.RefineClusters(ctx, llmClient, rule)
	if err != nil {
		return fmt.Errorf("refine: %w", err)
	}
	log.Printf("refined clusters: %d", len(refined))

	works := make([]types.Work, 0, len(refined))
	for canonical, group := range refined {
		prods := production.Extract(group)
		w := types.Work{
			Slug:        slug.Generate(canonical),
			Title:       canonical,
			Productions: prods,
		}
		// heritage if any file flagged
		for _, f := range group {
			if f.Heritage {
				w.Heritage = true
				break
			}
		}
		// title_alt：原始 title 与 canonical 不同的，记入异名
		altSet := map[string]bool{}
		for _, f := range group {
			if strings.TrimSpace(f.Title) != "" && f.Title != canonical {
				altSet[f.Title] = true
			}
		}
		for k := range altSet {
			w.TitleAlt = append(w.TitleAlt, k)
		}
		sort.Strings(w.TitleAlt)
		works = append(works, w)
	}
	sort.SliceStable(works, func(i, j int) bool { return works[i].Slug < works[j].Slug })

	if err := output.WriteJSONLFile(outPath, works); err != nil {
		return fmt.Errorf("write: %w", err)
	}
	log.Printf("wrote %d works to %s", len(works), outPath)

	if err := writeReport(reportPath, works); err != nil {
		return fmt.Errorf("report: %w", err)
	}
	log.Printf("wrote report to %s", reportPath)
	return nil
}

func writeReport(path string, works []types.Work) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()

	low := 0
	multi := 0
	heritage := 0
	for _, w := range works {
		if w.Heritage {
			heritage++
		}
		if len(w.Productions) > 1 {
			multi++
		}
		for _, p := range w.Productions {
			if p.Confidence == "low" || p.Confidence == "medium" {
				low++
				break
			}
		}
	}

	fmt.Fprintf(f, "# Ingest Report\n\n")
	fmt.Fprintf(f, "- 总剧目（works）：**%d**\n", len(works))
	fmt.Fprintf(f, "- 多版本剧目：%d\n", multi)
	fmt.Fprintf(f, "- 国家级非遗剧目：%d\n", heritage)
	fmt.Fprintf(f, "- 含 medium/low confidence production 的剧目：%d\n", low)
	fmt.Fprintf(f, "\n## 需要人工抽查（confidence ≠ high）\n\n")
	for _, w := range works {
		for _, p := range w.Productions {
			if p.Confidence == "high" {
				continue
			}
			fmt.Fprintf(f, "- **%s** / %s（%s）\n", w.Title, p.Label, p.Confidence)
		}
	}
	return nil
}
