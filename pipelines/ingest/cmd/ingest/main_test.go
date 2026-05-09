package main

import (
	"bufio"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/xiquhub/xiqu/pipelines/ingest/internal/types"
)

func TestRun_AgainstFullInventory(t *testing.T) {
	dir := t.TempDir()
	out := filepath.Join(dir, "plays.jsonl")
	report := filepath.Join(dir, "report.md")

	// 跳过 LLM（确保 CI 不依赖网络）
	t.Setenv("ANTHROPIC_API_KEY", "")

	if err := run("../../data/files.txt", out, report); err != nil {
		t.Fatalf("run: %v", err)
	}

	f, err := os.Open(out)
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()

	var works []types.Work
	sc := bufio.NewScanner(f)
	sc.Buffer(make([]byte, 0, 64*1024), 1024*1024)
	for sc.Scan() {
		var w types.Work
		if err := json.Unmarshal([]byte(sc.Text()), &w); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}
		works = append(works, w)
	}

	// 规则阶段（无 LLM）期望产出在 [150, 260] 区间——上限放宽因为 OCR 变体未合并
	if len(works) < 150 || len(works) > 260 {
		t.Errorf("expected works in [150,260], got %d", len(works))
	}

	// 所有 works 必须有 slug 和至少一个 production
	for _, w := range works {
		if w.Slug == "" {
			t.Errorf("empty slug for title %q", w.Title)
		}
		if len(w.Productions) == 0 {
			t.Errorf("no productions for %q", w.Title)
		}
	}

	// 总 part 数应等于 514（每个原始文件出现一次）
	totalParts := 0
	for _, w := range works {
		for _, p := range w.Productions {
			totalParts += len(p.Parts)
		}
	}
	if totalParts != 514 {
		t.Errorf("expected 514 parts total, got %d", totalParts)
	}

	// report 文件存在
	if _, err := os.Stat(report); err != nil {
		t.Errorf("report missing: %v", err)
	}

	// 烟测：works 顺序应该按 slug 升序
	for i := 1; i < len(works); i++ {
		if strings.Compare(works[i-1].Slug, works[i].Slug) > 0 {
			t.Errorf("works not sorted at index %d", i)
			break
		}
	}
}
