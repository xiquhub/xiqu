package output

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/xiquhub/xiqu/pipelines/ingest/internal/types"
)

func WriteJSONL(w io.Writer, works []types.Work) error {
	enc := json.NewEncoder(w)
	enc.SetEscapeHTML(false)
	for _, work := range works {
		if err := enc.Encode(work); err != nil {
			return fmt.Errorf("encode %s: %w", work.Slug, err)
		}
	}
	return nil
}

func WriteJSONLFile(path string, works []types.Work) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()
	return WriteJSONL(f, works)
}
