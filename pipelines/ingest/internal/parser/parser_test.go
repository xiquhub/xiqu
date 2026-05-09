package parser

import (
	"reflect"
	"testing"
)

func TestParse_BasicFullPlay(t *testing.T) {
	got := Parse("001-福建地方戏曲闽剧《咬奶头》全剧.flv")
	if got.Index != 1 {
		t.Errorf("index: want 1, got %d", got.Index)
	}
	if got.Title != "咬奶头" {
		t.Errorf("title: want 咬奶头, got %q", got.Title)
	}
	if got.PartLabel != "全剧" {
		t.Errorf("part_label: want 全剧, got %q", got.PartLabel)
	}
}

func TestParse_WithYearAndLeads(t *testing.T) {
	got := Parse("002-福建地方戏曲闽剧《六月雪》全剧 1985年录音 黄愿亭 林锦芳.flv")
	if got.Title != "六月雪" {
		t.Errorf("title: %q", got.Title)
	}
	if got.Year == nil || *got.Year != 1985 {
		t.Errorf("year: %v", got.Year)
	}
	if got.MediaHint != "录音" {
		t.Errorf("media_hint: %q", got.MediaHint)
	}
	if !reflect.DeepEqual(got.Leads, []string{"黄愿亭", "林锦芳"}) {
		t.Errorf("leads: %v", got.Leads)
	}
}

func TestParse_WithTroupeAndLeads(t *testing.T) {
	got := Parse("010-福建地方戏曲闽剧《王莲莲拜香》福建省实验闽剧团 林瑛主演.flv")
	if got.Title != "王莲莲拜香" {
		t.Errorf("title: %q", got.Title)
	}
	if got.Troupe != "福建省实验闽剧团" {
		t.Errorf("troupe: %q", got.Troupe)
	}
	if !reflect.DeepEqual(got.Leads, []string{"林瑛"}) {
		t.Errorf("leads: %v", got.Leads)
	}
}

func TestParse_HeritageNote(t *testing.T) {
	got := Parse("016-福建地方戏曲闽剧《贻顺哥烛蒂》全剧 国家非物质文化遗产项目.flv")
	if !got.Heritage {
		t.Errorf("expected heritage=true")
	}
}

func TestParse_NumberedPart(t *testing.T) {
	got := Parse("017-闽剧 七品报喜郎 1.flv")
	if got.Title != "七品报喜郎" {
		t.Errorf("title: %q", got.Title)
	}
	if got.PartLabel != "1" {
		t.Errorf("part_label: %q", got.PartLabel)
	}
}

func TestParse_ChineseUpperLowerPart(t *testing.T) {
	got := Parse("097-闽剧 半把剪刀（上）.flv")
	if got.PartLabel != "上" {
		t.Errorf("part_label: %q", got.PartLabel)
	}
}

func TestParse_FilmEdition(t *testing.T) {
	got := Parse("488-闽剧《炼印》电影版.flv")
	if got.MediaHint != "电影" {
		t.Errorf("media_hint: %q", got.MediaHint)
	}
}

func TestParse_LeadingZeroPad(t *testing.T) {
	got := Parse("507-闽剧《金河遇》全剧（上集）.mp4")
	if got.Index != 507 {
		t.Errorf("index: %d", got.Index)
	}
	if got.PartLabel != "上集" {
		t.Errorf("part_label: %q", got.PartLabel)
	}
}
