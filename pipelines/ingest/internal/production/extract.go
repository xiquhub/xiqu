package production

import (
	"fmt"
	"sort"
	"strings"

	"github.com/xiquhub/xiqu/pipelines/ingest/internal/types"
)

// Extract 把同一 work 下的若干 ParsedFile 切分为若干 Production。
func Extract(files []types.ParsedFile) []types.Production {
	if len(files) == 0 {
		return nil
	}
	// 按"production 信号 key"分组
	groups := make(map[string][]types.ParsedFile)
	for _, f := range files {
		key := signalKey(f)
		groups[key] = append(groups[key], f)
	}

	var prods []types.Production
	idx := 0
	for _, group := range groups {
		idx++
		prod := types.Production{
			Slug:       slugFor(group[0], idx, len(groups)),
			Label:      labelFor(group[0]),
			Confidence: confidenceFor(group),
		}
		// 同组内合并主演/剧团/年/媒介（取第一个非空）
		for _, f := range group {
			if prod.Troupe == "" {
				prod.Troupe = f.Troupe
			}
			if prod.Year == nil && f.Year != nil {
				prod.Year = f.Year
			}
			if prod.MediaType == "" && f.MediaHint != "" {
				prod.MediaType = f.MediaHint
			}
			if len(prod.Leads) == 0 && len(f.Leads) > 0 {
				prod.Leads = f.Leads
			}
			prod.Parts = append(prod.Parts, types.Part{
				File:      f.Original,
				Label:     f.PartLabel,
				SortOrder: f.PartOrder,
			})
		}
		sort.SliceStable(prod.Parts, func(i, j int) bool {
			return prod.Parts[i].SortOrder < prod.Parts[j].SortOrder
		})
		prods = append(prods, prod)
	}

	// 稳定排序 productions：先按 year（缺失放最后），再按 slug
	sort.SliceStable(prods, func(i, j int) bool {
		yi, yj := -1, -1
		if prods[i].Year != nil {
			yi = *prods[i].Year
		}
		if prods[j].Year != nil {
			yj = *prods[j].Year
		}
		if yi != yj {
			if yi < 0 {
				return false
			}
			if yj < 0 {
				return true
			}
			return yi < yj
		}
		return prods[i].Slug < prods[j].Slug
	})
	return prods
}

func signalKey(f types.ParsedFile) string {
	year := ""
	if f.Year != nil {
		year = fmt.Sprintf("%d", *f.Year)
	}
	leads := ""
	if len(f.Leads) > 0 {
		leads = f.Leads[0]
	}
	return strings.Join([]string{year, f.MediaHint, f.Troupe, leads}, "|")
}

func slugFor(f types.ParsedFile, idx, total int) string {
	parts := []string{}
	if f.Year != nil {
		parts = append(parts, fmt.Sprintf("%d", *f.Year))
	}
	switch f.MediaHint {
	case "录音":
		parts = append(parts, "recording")
	case "电影":
		parts = append(parts, "film")
	}
	if len(parts) == 0 {
		if total <= 1 {
			parts = append(parts, "main")
		} else {
			parts = append(parts, fmt.Sprintf("v%d", idx))
		}
	}
	return strings.Join(parts, "-")
}

func labelFor(f types.ParsedFile) string {
	var b strings.Builder
	if f.Year != nil {
		fmt.Fprintf(&b, "%d 年", *f.Year)
	}
	if f.MediaHint != "" {
		if b.Len() > 0 {
			b.WriteString(" ")
		}
		b.WriteString(f.MediaHint)
		b.WriteString("版")
	}
	if len(f.Leads) > 0 {
		if b.Len() > 0 {
			b.WriteString(" · ")
		}
		b.WriteString(strings.Join(f.Leads, "/"))
	}
	if b.Len() == 0 {
		return "主版"
	}
	return b.String()
}

func confidenceFor(group []types.ParsedFile) string {
	// 有明确剧团或年份或主演 → high；都没有 → medium
	for _, f := range group {
		if f.Troupe != "" || f.Year != nil || len(f.Leads) > 0 {
			return "high"
		}
	}
	return "medium"
}
