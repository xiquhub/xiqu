package llm

import (
	"context"
	"testing"

	"github.com/xiquhub/xiqu/pipelines/ingest/internal/types"
)

type mockClient struct {
	merges map[string]string // key: "剧名 A|剧名 B" -> 合并后的标准剧名（空字符串表示不合并）
}

func (m *mockClient) ConfirmMerge(_ context.Context, a, b string) (merged string, err error) {
	if v, ok := m.merges[a+"|"+b]; ok {
		return v, nil
	}
	if v, ok := m.merges[b+"|"+a]; ok {
		return v, nil
	}
	return "", nil // 默认不合并
}

func TestRefineClusters_MergesByLLM(t *testing.T) {
	clusters := map[string][]types.ParsedFile{
		"荔枝换绛桃": {{Title: "荔枝换绛桃", Original: "014.flv"}},
		"荔枝换樱桃": {{Title: "荔枝换樱桃", Original: "308.flv"}},
		"咬奶头":   {{Title: "咬奶头", Original: "001.flv"}},
	}
	mc := &mockClient{merges: map[string]string{
		"荔枝换绛桃|荔枝换樱桃": "荔枝换绛桃",
	}}
	out, _ := RefineClusters(context.Background(), mc, clusters)

	if len(out) != 2 {
		t.Fatalf("expected 2 clusters after merge, got %d: %+v", len(out), keysOf(out))
	}
	if len(out["荔枝换绛桃"]) != 2 {
		t.Errorf("荔枝换绛桃 should have 2 files: %+v", out["荔枝换绛桃"])
	}
}

func TestRefineClusters_NoMerge(t *testing.T) {
	clusters := map[string][]types.ParsedFile{
		"咬奶头": {{Title: "咬奶头"}},
		"六月雪": {{Title: "六月雪"}},
	}
	mc := &mockClient{merges: map[string]string{}}
	out, _ := RefineClusters(context.Background(), mc, clusters)
	if len(out) != 2 {
		t.Errorf("no merges expected, got %d", len(out))
	}
}

func keysOf[V any](m map[string]V) []string {
	var ks []string
	for k := range m {
		ks = append(ks, k)
	}
	return ks
}
