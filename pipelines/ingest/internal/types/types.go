package types

// ParsedFile 是规则解析阶段从单个文件名抽出的事实。
type ParsedFile struct {
	Original  string   `json:"original"`
	Index     int      `json:"index"`
	Title     string   `json:"title"`
	PartLabel string   `json:"part_label"`
	PartOrder int      `json:"part_order"`
	Year      *int     `json:"year,omitempty"`
	Troupe    string   `json:"troupe,omitempty"`
	Leads     []string `json:"leads,omitempty"`
	Notes     []string `json:"notes,omitempty"`
	Heritage  bool     `json:"heritage"`
	MediaHint string   `json:"media_hint,omitempty"`
}

// Part 是 plays.jsonl 中一个分卷条目。
type Part struct {
	File      string `json:"file"`
	Label     string `json:"label,omitempty"`
	SortOrder int    `json:"sort_order"`
}

// Production 是同一 work 下的一次具体录制。
type Production struct {
	Slug       string   `json:"slug"`
	Label      string   `json:"label"`
	Troupe     string   `json:"troupe,omitempty"`
	Year       *int     `json:"year,omitempty"`
	MediaType  string   `json:"media_type,omitempty"`
	Leads      []string `json:"leads,omitempty"`
	Parts      []Part   `json:"parts"`
	Confidence string   `json:"confidence"`
}

// Work 是 plays.jsonl 中一行（一个独立剧目）。
type Work struct {
	Slug        string       `json:"slug"`
	Title       string       `json:"title"`
	TitleAlt    []string     `json:"title_alt,omitempty"`
	Heritage    bool         `json:"heritage"`
	Productions []Production `json:"productions"`
	NeedsReview []string     `json:"needs_review,omitempty"`
}
