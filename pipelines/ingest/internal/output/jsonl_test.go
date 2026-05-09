package output

import (
	"bytes"
	"encoding/json"
	"strings"
	"testing"

	"github.com/xiquhub/xiqu/pipelines/ingest/internal/types"
)

func TestWriteJSONL_Roundtrip(t *testing.T) {
	works := []types.Work{
		{Slug: "liu-yue-xue", Title: "六月雪", Productions: []types.Production{{Slug: "1985-recording", Label: "1985 录音", Parts: []types.Part{{File: "002.flv"}}}}},
		{Slug: "yao-nai-tou", Title: "咬奶头", Productions: []types.Production{{Slug: "main", Label: "主版", Parts: []types.Part{{File: "001.flv"}}}}},
	}
	var buf bytes.Buffer
	if err := WriteJSONL(&buf, works); err != nil {
		t.Fatalf("write: %v", err)
	}
	lines := strings.Split(strings.TrimSuffix(buf.String(), "\n"), "\n")
	if len(lines) != 2 {
		t.Fatalf("expected 2 lines, got %d", len(lines))
	}
	var first types.Work
	if err := json.Unmarshal([]byte(lines[0]), &first); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if first.Slug != "liu-yue-xue" {
		t.Errorf("first slug: %q", first.Slug)
	}
}
