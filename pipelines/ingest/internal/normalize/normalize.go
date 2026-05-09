package normalize

import "strings"

// 已知的 OCR 错误或异体字等价对（高置信度）
// 写法：把"错"映射到"对"
var ocrPairs = map[string]string{
	"壮": "状", // 壮元 → 状元
	"春": "顺", // 仅在贻春哥/贻顺哥语境下成立，但作为单字映射风险可控
	"俩": "两",
	"凌": "菱", // 凌花/菱花
	"鬃": "鬃", // 占位防漏（同字）
	"棵": "棵",
}

// 形似简繁/异体（按需扩展）
var variantPairs = map[string]string{
	"霸王莊": "霸王庄",
	"莊":   "庄",
	"國":   "国",
}

func Normalize(s string) string {
	s = strings.TrimSpace(s)
	s = strings.Trim(s, "《》〈〉()（）[]【】 　\t")

	// 单字替换
	var b strings.Builder
	for _, r := range s {
		ch := string(r)
		if v, ok := ocrPairs[ch]; ok {
			b.WriteString(v)
			continue
		}
		if v, ok := variantPairs[ch]; ok {
			b.WriteString(v)
			continue
		}
		b.WriteString(ch)
	}
	return b.String()
}
