package cluster

import (
	"github.com/xiquhub/xiqu/pipelines/ingest/internal/normalize"
	"github.com/xiquhub/xiqu/pipelines/ingest/internal/types"
)

// ByNormalizedTitle 把同一归一化剧名的文件归到同一桶。
// 桶 key 是归一化后的剧名（这是规范代表）。
func ByNormalizedTitle(files []types.ParsedFile) map[string][]types.ParsedFile {
	out := make(map[string][]types.ParsedFile)
	for _, f := range files {
		key := normalize.Normalize(f.Title)
		out[key] = append(out[key], f)
	}
	return out
}
