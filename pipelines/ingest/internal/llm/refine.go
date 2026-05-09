package llm

import (
	"context"

	"github.com/xiquhub/xiqu/pipelines/ingest/internal/types"
)

// RefineClusters 对**两两相邻**的聚类做合并询问。
// 为节省 API 调用，仅询问以下情况：
//   - 两个 cluster 的 key 编辑距离 ≤ 2
//   - 或一个 key 是另一个的子串（且长度差 ≤ 1 字）
//
// 否则不询问，保留原聚类。
func RefineClusters(ctx context.Context, c Client, in map[string][]types.ParsedFile) (map[string][]types.ParsedFile, error) {
	if c == nil {
		return in, nil // 降级：无 LLM
	}

	keys := make([]string, 0, len(in))
	for k := range in {
		keys = append(keys, k)
	}

	// 收集候选合并对
	type pair struct{ a, b string }
	var pairs []pair
	for i := 0; i < len(keys); i++ {
		for j := i + 1; j < len(keys); j++ {
			if shouldAsk(keys[i], keys[j]) {
				pairs = append(pairs, pair{keys[i], keys[j]})
			}
		}
	}

	// 询问 LLM；遵从结果
	merged := make(map[string]string) // 旧 key -> 新 key
	for _, p := range pairs {
		canonical, err := c.ConfirmMerge(ctx, p.a, p.b)
		if err != nil || canonical == "" {
			continue
		}
		merged[p.a] = canonical
		merged[p.b] = canonical
	}

	if len(merged) == 0 {
		return in, nil
	}

	out := make(map[string][]types.ParsedFile, len(in))
	for k, v := range in {
		newKey := k
		if nk, ok := merged[k]; ok {
			newKey = nk
		}
		out[newKey] = append(out[newKey], v...)
	}
	return out, nil
}

// shouldAsk 决定是否值得花一次 API 调用询问这一对。
func shouldAsk(a, b string) bool {
	if abs(len([]rune(a))-len([]rune(b))) > 2 {
		return false
	}
	d := levenshtein([]rune(a), []rune(b))
	return d > 0 && d <= 2
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

func levenshtein(a, b []rune) int {
	if len(a) == 0 {
		return len(b)
	}
	if len(b) == 0 {
		return len(a)
	}
	prev := make([]int, len(b)+1)
	curr := make([]int, len(b)+1)
	for j := 0; j <= len(b); j++ {
		prev[j] = j
	}
	for i := 1; i <= len(a); i++ {
		curr[0] = i
		for j := 1; j <= len(b); j++ {
			cost := 1
			if a[i-1] == b[j-1] {
				cost = 0
			}
			curr[j] = min3(prev[j]+1, curr[j-1]+1, prev[j-1]+cost)
		}
		prev, curr = curr, prev
	}
	return prev[len(b)]
}

func min3(a, b, c int) int {
	m := a
	if b < m {
		m = b
	}
	if c < m {
		m = c
	}
	return m
}
