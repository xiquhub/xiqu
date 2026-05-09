package inventory

import "testing"

func TestLoadReturnsAll514Filenames(t *testing.T) {
	files, err := Load("../../data/files.txt")
	if err != nil {
		t.Fatalf("load: %v", err)
	}
	if len(files) != 514 {
		t.Fatalf("expected 514 entries, got %d", len(files))
	}
	if files[0] != "001-福建地方戏曲闽剧《咬奶头》全剧.flv" {
		t.Fatalf("unexpected first entry: %q", files[0])
	}
	seen := map[string]bool{}
	for _, f := range files {
		if seen[f] {
			t.Fatalf("duplicate: %s", f)
		}
		seen[f] = true
	}
}
