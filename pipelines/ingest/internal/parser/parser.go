package parser

import (
	"path/filepath"
	"regexp"
	"strconv"
	"strings"

	"github.com/xiquhub/xiqu/pipelines/ingest/internal/types"
)

var (
	reIndex     = regexp.MustCompile(`^(\d{1,4})-`)
	reBookTitle = regexp.MustCompile(`《([^》]+)》`)
	reYear      = regexp.MustCompile(`(19[5-9]\d|20[0-2]\d)`)
	rePartTrail = regexp.MustCompile(`(?:[\(（]([上中下]|\d{1,2}|[A-Z]|[一二三四五六七八九十]+集?|上集|中集|下集)[\)）]|[\s　]*([1-9]|[一二三四五六七八九]|上|中|下|A|B|C|全剧|全)$)`)

	commonTroupeKeywords = []string{
		"福建省实验闽剧院", "福建省实验闽剧团", "福州闽剧院一团", "福州闽剧院二团",
		"福州闽剧一团", "福州闽剧二团", "福建福州闽剧院一团",
		"福州市闽剧一团", "福州市闽剧院", "福安市实验闽剧团",
	}

	mediaKeywords = []struct {
		hint string
		kw   string
	}{
		{"电影", "电影版"},
		{"录音", "录音"},
		{"标清", "标清"},
	}

	heritageKW = "国家非物质文化遗产"
	leadSuffix = []string{"领衔主演", "主演"}
)

// Parse 解析单个文件名，返回提取的事实。
func Parse(filename string) types.ParsedFile {
	base := strings.TrimSuffix(filename, filepath.Ext(filename))
	pf := types.ParsedFile{Original: filename}

	// index
	if m := reIndex.FindStringSubmatch(base); m != nil {
		if n, err := strconv.Atoi(m[1]); err == nil {
			pf.Index = n
		}
		base = base[len(m[0]):]
	}

	// 去掉前置的 "福建地方戏曲闽剧" / "闽剧" 等通用前缀
	for _, prefix := range []string{"福建地方戏曲闽剧", "闽剧"} {
		base = strings.TrimSpace(strings.TrimPrefix(strings.TrimSpace(base), prefix))
	}

	// heritage
	if strings.Contains(base, heritageKW) {
		pf.Heritage = true
		base = strings.ReplaceAll(base, "国家非物质文化遗产项目", "")
	}

	// 提取剧名（《...》优先，否则取第一个空格前的连续中文）
	if m := reBookTitle.FindStringSubmatch(base); m != nil {
		pf.Title = strings.TrimSpace(m[1])
		base = reBookTitle.ReplaceAllString(base, "")
	} else {
		// 形如 "闽剧 半把剪刀 1" 或 "闽剧 七品报喜郎 1" 或 "闽剧 半把剪刀（上）"
		s := strings.TrimSpace(base)
		fields := strings.Fields(s)
		if len(fields) > 0 {
			tok := fields[0]
			// If token contains a bracket (full-width or half-width), split it there
			if idx := strings.IndexAny(tok, "（("); idx > 0 {
				pf.Title = tok[:idx]
				base = tok[idx:] + " " + strings.Join(fields[1:], " ")
			} else {
				pf.Title = tok
				base = strings.TrimSpace(strings.TrimPrefix(s, tok))
			}
		}
	}

	// 年份
	if m := reYear.FindString(base); m != "" {
		if n, err := strconv.Atoi(m); err == nil {
			y := n
			pf.Year = &y
		}
		base = strings.ReplaceAll(base, m, "")
	}

	// media hint
	for _, mk := range mediaKeywords {
		if strings.Contains(base, mk.kw) {
			pf.MediaHint = mk.hint
			base = strings.ReplaceAll(base, mk.kw, "")
			break
		}
	}

	// 剧团
	for _, t := range commonTroupeKeywords {
		if strings.Contains(base, t) {
			pf.Troupe = t
			base = strings.ReplaceAll(base, t, "")
			break
		}
	}

	// leads（"... 主演" 或 "... 领衔主演" 之前的人名）
	for _, suffix := range leadSuffix {
		if idx := strings.Index(base, suffix); idx >= 0 {
			before := strings.TrimSpace(base[:idx])
			fields := strings.Fields(before)
			// 取末尾 1-3 个看似人名的 token（2-4 个汉字）
			leads := []string{}
			for i := len(fields) - 1; i >= 0 && len(leads) < 3; i-- {
				name := strings.TrimSpace(fields[i])
				if isLikelyName(name) {
					leads = append([]string{name}, leads...)
				} else {
					break
				}
			}
			if len(leads) > 0 {
				pf.Leads = leads
			}
			base = strings.ReplaceAll(base, suffix, "")
			for _, n := range leads {
				base = strings.ReplaceAll(base, n, "")
			}
			break
		}
	}

	// 如果还没识别出 leads，但末尾有 "黄愿亭 林锦芳" 这样的两个连续人名（无 "主演" 后缀）
	if len(pf.Leads) == 0 {
		fields := strings.Fields(base)
		var tail []string
		for i := len(fields) - 1; i >= 0 && len(tail) < 3; i-- {
			if isLikelyName(fields[i]) {
				tail = append([]string{fields[i]}, tail...)
			} else {
				break
			}
		}
		if len(tail) >= 2 {
			pf.Leads = tail
			for _, n := range tail {
				base = strings.ReplaceAll(base, n, "")
			}
		}
	}

	// part label：剧名右边的"全剧/1/上/A/（上）" 等
	rest := strings.TrimSpace(base)
	if rest != "" {
		// 优先括号内
		if m := rePartTrail.FindStringSubmatch(rest); m != nil {
			if m[1] != "" {
				pf.PartLabel = m[1]
			} else {
				pf.PartLabel = m[2]
			}
		} else {
			pf.PartLabel = rest
		}
	}

	return pf
}

func isLikelyName(s string) bool {
	r := []rune(s)
	if len(r) < 2 || len(r) > 4 {
		return false
	}
	for _, c := range r {
		if !(c >= 0x4E00 && c <= 0x9FFF) {
			return false
		}
	}
	return true
}
