package parts

import "testing"

func TestSortOrder_Numeric(t *testing.T) {
	cases := map[string]int{
		"1": 1, "2": 2, "16": 16,
		"01": 1, "08": 8,
	}
	for in, want := range cases {
		if got := SortOrder(in); got != want {
			t.Errorf("%q -> %d, want %d", in, got, want)
		}
	}
}

func TestSortOrder_ChineseShangXia(t *testing.T) {
	cases := map[string]int{
		"上": 1, "中": 2, "下": 3,
		"上集": 1, "中集": 2, "下集": 3,
		"（上）": 1, "（中）": 2, "（下）": 3,
	}
	for in, want := range cases {
		if got := SortOrder(in); got != want {
			t.Errorf("%q -> %d, want %d", in, got, want)
		}
	}
}

func TestSortOrder_FullPlay(t *testing.T) {
	if SortOrder("全剧") != 0 {
		t.Errorf("全剧 应返回 0（表示整剧）")
	}
	if SortOrder("全") != 0 {
		t.Errorf("全 应返回 0")
	}
	if SortOrder("") != 0 {
		t.Errorf("空 应返回 0")
	}
}

func TestSortOrder_Letters(t *testing.T) {
	cases := map[string]int{"A": 1, "B": 2, "C": 3}
	for in, want := range cases {
		if got := SortOrder(in); got != want {
			t.Errorf("%q -> %d, want %d", in, got, want)
		}
	}
}

func TestNormalizeLabel(t *testing.T) {
	cases := map[string]string{
		"（上）": "上",
		"上集":  "上",
		"01":  "1",
		"":    "",
	}
	for in, want := range cases {
		if got := NormalizeLabel(in); got != want {
			t.Errorf("%q -> %q, want %q", in, got, want)
		}
	}
}
