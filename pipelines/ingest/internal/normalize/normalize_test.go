package normalize

import "testing"

func TestNormalize_StripPunctuation(t *testing.T) {
	if got := Normalize("《六月雪》"); got != "六月雪" {
		t.Errorf("got %q", got)
	}
}

func TestNormalize_KnownOCRPairs(t *testing.T) {
	pairs := [][2]string{
		{"壮元与乞丐", "状元与乞丐"}, // 壮 → 状
		{"贻春哥烛蒂", "贻顺哥烛蒂"}, // 春 → 顺（已知 OCR 错）
		{"兄弟俩状元", "兄弟两状元"}, // 俩 → 两
	}
	for _, p := range pairs {
		a, b := Normalize(p[0]), Normalize(p[1])
		if a != b {
			t.Errorf("expected %q == %q, got %q vs %q", p[0], p[1], a, b)
		}
	}
}

func TestNormalize_VariantChars(t *testing.T) {
	// 凌花/菱花 视作同一规范化串
	if Normalize("凌花双合镜") != Normalize("菱花双合镜") {
		t.Errorf("凌花/菱花 should normalize equal")
	}
}

func TestNormalize_TrimsWhitespaceAndCase(t *testing.T) {
	if Normalize("  半把剪刀  ") != "半把剪刀" {
		t.Errorf("should trim")
	}
}
