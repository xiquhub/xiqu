package normalize

import "strings"

// 已知的 OCR 错误或异体字等价对（高置信度）
// 写法：把"错"映射到"对"
var ocrPairs = map[string]string{
	"壮": "状", // 壮元 → 状元
	"俩": "两",
	"凌": "菱", // 凌花/菱花（OCR 变体，同一剧目）
	"鬃": "鬃", // 占位防漏（同字）
	"棵": "棵",
}

// 形似简繁/异体（按需扩展）
var variantPairs = map[string]string{
	"霸王莊": "霸王庄",
	"莊":   "庄",
	"國":   "国",
	"斬":   "斩", // 陈若霖斬皇子 → 陈若霖斩皇子（363/364 vs 360-362）
}

// 整词替换（比单字替换更安全；优先于单字）
var phrasePairs = map[string]string{
	"贻春哥烛蒂": "贻顺哥烛蒂", // OCR 变体：春→顺 仅在此剧名中成立
	"马乐一日君": "马铎一日君", // OCR/异体字变体
}

func Normalize(s string) string {
	s = strings.TrimSpace(s)
	s = strings.Trim(s, "《》〈〉()（）[]【】 　\t")

	// 整词替换（优先级高于单字替换，避免误替换）
	for from, to := range phrasePairs {
		s = strings.ReplaceAll(s, from, to)
	}

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
