package slug

import (
	"strings"
	"unicode"

	"github.com/mozillazg/go-pinyin"
)

func Generate(s string) string {
	s = strings.TrimSpace(s)
	s = strings.Trim(s, "《》〈〉()（）[]【】 　\t")

	args := pinyin.NewArgs()
	args.Style = pinyin.Normal // 不带声调
	syllables := pinyin.Pinyin(s, args)

	var parts []string
	for _, syl := range syllables {
		if len(syl) == 0 {
			continue
		}
		parts = append(parts, strings.ToLower(syl[0]))
	}
	out := strings.Join(parts, "-")

	// 兜底：如果输入包含纯 ASCII（拼音库不会处理），保留小写
	if out == "" {
		var b strings.Builder
		for _, r := range s {
			if unicode.IsLetter(r) || unicode.IsDigit(r) {
				b.WriteRune(unicode.ToLower(r))
			} else if r == ' ' {
				b.WriteRune('-')
			}
		}
		out = b.String()
	}

	return out
}
