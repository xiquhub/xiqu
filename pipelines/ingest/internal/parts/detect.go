package parts

import (
	"strconv"
	"strings"
)

// NormalizeLabel 把括号包裹和"集"后缀去掉、前导 0 修剪、空白去掉。
func NormalizeLabel(raw string) string {
	s := strings.TrimSpace(raw)
	s = strings.Trim(s, "（）()[] 　\t")
	s = strings.TrimSuffix(s, "集")
	if n, err := strconv.Atoi(s); err == nil {
		return strconv.Itoa(n) // 去前导 0
	}
	return s
}

// SortOrder 把 label 映射到稳定排序 int。整剧/空 → 0，1/2/...直返。
func SortOrder(raw string) int {
	s := NormalizeLabel(raw)
	if s == "" || s == "全剧" || s == "全" {
		return 0
	}
	if n, err := strconv.Atoi(s); err == nil {
		return n
	}
	switch s {
	case "上":
		return 1
	case "中":
		return 2
	case "下":
		return 3
	case "A":
		return 1
	case "B":
		return 2
	case "C":
		return 3
	case "D":
		return 4
	}
	// 中文数字 一二三...
	cnDigits := map[string]int{"一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9, "十": 10}
	if n, ok := cnDigits[s]; ok {
		return n
	}
	return 0
}
