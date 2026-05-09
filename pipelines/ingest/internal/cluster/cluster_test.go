package cluster

import (
	"testing"

	"github.com/xiquhub/xiqu/pipelines/ingest/internal/types"
)

func TestByNormalizedTitle_GroupsKnownVariants(t *testing.T) {
	in := []types.ParsedFile{
		{Original: "127", Title: "壮元与乞丐"},
		{Original: "490", Title: "状元与乞丐"},
		{Original: "491", Title: "状元与乞丐"},
		{Original: "001", Title: "咬奶头"},
	}
	got := ByNormalizedTitle(in)
	if len(got) != 2 {
		t.Fatalf("expected 2 clusters, got %d", len(got))
	}
	if len(got["状元与乞丐"]) != 3 {
		t.Errorf("壮元/状元 should cluster together: %+v", got["状元与乞丐"])
	}
	if len(got["咬奶头"]) != 1 {
		t.Errorf("咬奶头 should be alone")
	}
}
