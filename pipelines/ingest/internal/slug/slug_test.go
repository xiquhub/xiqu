package slug

import "testing"

func TestGenerate(t *testing.T) {
	cases := map[string]string{
		"六月雪":     "liu-yue-xue",
		"贻顺哥烛蒂":   "yi-shun-ge-zhu-di",
		"半把剪刀":    "ban-ba-jian-dao",
		"霸王庄":     "ba-wang-zhuang",
		"三搜幻化庵":   "san-sou-huan-hua-an",
	}
	for in, want := range cases {
		if got := Generate(in); got != want {
			t.Errorf("%q -> %q, want %q", in, got, want)
		}
	}
}

func TestGenerate_DropsPunctuation(t *testing.T) {
	if Generate("《六月雪》") != "liu-yue-xue" {
		t.Errorf("should strip punctuation")
	}
}
