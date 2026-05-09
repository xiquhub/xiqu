package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

// Client 是 LLM 客户端的抽象（便于测试 mock）。
type Client interface {
	// ConfirmMerge 询问 a 和 b 是否同一剧目；返回合并后剧名（""表示不合并）。
	ConfirmMerge(ctx context.Context, a, b string) (string, error)
}

// httpClient 用 Anthropic Messages API 直接 HTTP 实现。
type httpClient struct {
	apiKey string
	model  string
	hc     *http.Client
}

// NewAnthropicFromEnv 从 ANTHROPIC_API_KEY 创建客户端；未设置则返回 nil（调用方降级）。
func NewAnthropicFromEnv() Client {
	key := os.Getenv("ANTHROPIC_API_KEY")
	if key == "" {
		return nil
	}
	return &httpClient{
		apiKey: key,
		model:  "claude-sonnet-4-6",
		hc:     &http.Client{Timeout: 60 * time.Second},
	}
}

const mergePromptTpl = `你是闽剧资料专家。判断以下两个剧名是否同一剧目。

判断标准：
- 同一剧目可能因 OCR 错误、异体字、近义字、繁简差异、片段差异而看起来不同
- 不同剧目即使剧名相近（如"包公判金钗"vs"包公判女魂"）也是独立作品
- 把握不准就说不

剧名 A：%q
剧名 B：%q

仅输出 JSON：{"same": true|false, "canonical": "若同一剧目，给出标准写法；不同则空字符串"}
不要任何解释。`

type apiRequest struct {
	Model     string       `json:"model"`
	MaxTokens int          `json:"max_tokens"`
	Messages  []apiMessage `json:"messages"`
}

type apiMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type apiResponse struct {
	Content []struct {
		Type string `json:"type"`
		Text string `json:"text"`
	} `json:"content"`
}

func (h *httpClient) ConfirmMerge(ctx context.Context, x, y string) (string, error) {
	body, _ := json.Marshal(apiRequest{
		Model:     h.model,
		MaxTokens: 256,
		Messages: []apiMessage{
			{Role: "user", Content: fmt.Sprintf(mergePromptTpl, x, y)},
		},
	})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.anthropic.com/v1/messages", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("x-api-key", h.apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")
	req.Header.Set("content-type", "application/json")

	resp, err := h.hc.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("anthropic %d: %s", resp.StatusCode, string(b))
	}
	var r apiResponse
	if err := json.NewDecoder(resp.Body).Decode(&r); err != nil {
		return "", err
	}
	var text strings.Builder
	for _, c := range r.Content {
		if c.Type == "text" {
			text.WriteString(c.Text)
		}
	}
	return parseMergeResponse(text.String(), x), nil
}

// parseMergeResponse 抽出文本中第一段 JSON 并解析。
// 返回值：合并后剧名；若不合并或解析失败，返回 ""。
func parseMergeResponse(text, fallbackCanonical string) string {
	start := strings.Index(text, "{")
	end := strings.LastIndex(text, "}")
	if start < 0 || end <= start {
		return ""
	}
	var r struct {
		Same      bool   `json:"same"`
		Canonical string `json:"canonical"`
	}
	if err := json.Unmarshal([]byte(text[start:end+1]), &r); err != nil {
		return ""
	}
	if !r.Same {
		return ""
	}
	if r.Canonical == "" {
		return fallbackCanonical
	}
	return r.Canonical
}
