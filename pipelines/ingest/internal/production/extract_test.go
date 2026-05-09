package production

import (
	"testing"

	"github.com/xiquhub/xiqu/pipelines/ingest/internal/types"
)

func intp(n int) *int { return &n }

func TestExtract_SinglePart(t *testing.T) {
	pfs := []types.ParsedFile{
		{Original: "001.flv", Title: "咬奶头", PartLabel: "全剧", PartOrder: 0},
	}
	got := Extract(pfs)
	if len(got) != 1 {
		t.Fatalf("expected 1 production, got %d", len(got))
	}
	if len(got[0].Parts) != 1 {
		t.Errorf("expected 1 part")
	}
}

func TestExtract_SplitsByYear(t *testing.T) {
	pfs := []types.ParsedFile{
		{Original: "002.flv", Title: "六月雪", Year: intp(1985), MediaHint: "录音", Leads: []string{"黄愿亭", "林锦芳"}},
		{Original: "066.flv", Title: "六月雪", PartLabel: "1", PartOrder: 1},
		{Original: "067.flv", Title: "六月雪", PartLabel: "2", PartOrder: 2},
		{Original: "068.flv", Title: "六月雪", PartLabel: "3", PartOrder: 3},
	}
	got := Extract(pfs)
	if len(got) != 2 {
		t.Fatalf("expected 2 productions (1985 录音 vs 现代), got %d", len(got))
	}
}

func TestExtract_PartsSorted(t *testing.T) {
	pfs := []types.ParsedFile{
		{Original: "c", PartOrder: 3},
		{Original: "a", PartOrder: 1},
		{Original: "b", PartOrder: 2},
	}
	got := Extract(pfs)
	if len(got) != 1 || len(got[0].Parts) != 3 {
		t.Fatalf("structure")
	}
	if got[0].Parts[0].File != "a" || got[0].Parts[1].File != "b" || got[0].Parts[2].File != "c" {
		t.Errorf("parts not sorted: %+v", got[0].Parts)
	}
}

func TestExtract_ProductionSlugStable(t *testing.T) {
	pfs := []types.ParsedFile{
		{Original: "002.flv", Title: "六月雪", Year: intp(1985), MediaHint: "录音"},
	}
	got := Extract(pfs)
	if got[0].Slug != "1985-recording" {
		t.Errorf("slug: got %q, want 1985-recording", got[0].Slug)
	}
}
