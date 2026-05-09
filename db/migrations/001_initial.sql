-- 闽剧档案站 schema (V1)
-- 真源 SQLite 数据库；与 Cloudflare D1 同 schema。

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA trusted_schema = ON;          -- required for FTS5 writes inside triggers

-- 作品（剧目）
CREATE TABLE IF NOT EXISTS works (
  slug          TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  title_alt     TEXT,                              -- JSON array
  genre         TEXT NOT NULL DEFAULT '闽剧',
  heritage      TEXT,                              -- 非遗项目编号或 NULL
  plot_type     TEXT,                              -- 公案/家庭/才子佳人/历史/神怪
  era_setting   TEXT,
  adapted_from  TEXT,
  plot_summary  TEXT,                              -- markdown
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_works_title ON works(title);

-- 版本/录制
CREATE TABLE IF NOT EXISTS productions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  work_slug     TEXT NOT NULL REFERENCES works(slug) ON DELETE CASCADE,
  slug          TEXT NOT NULL,
  label         TEXT NOT NULL,
  troupe_id     INTEGER REFERENCES troupes(id),
  year          INTEGER,
  media_type    TEXT,                              -- 录音/录像/电影
  notes         TEXT,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL,
  UNIQUE(work_slug, slug)
);

CREATE INDEX IF NOT EXISTS idx_productions_work ON productions(work_slug);
CREATE INDEX IF NOT EXISTS idx_productions_troupe ON productions(troupe_id);

-- 分卷
CREATE TABLE IF NOT EXISTS parts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  production_id   INTEGER NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  file_name       TEXT NOT NULL,
  label           TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  duration_sec    INTEGER
);

CREATE INDEX IF NOT EXISTS idx_parts_production ON parts(production_id);

-- 演员
CREATE TABLE IF NOT EXISTS actors (
  slug          TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  hangdang      TEXT,
  bio           TEXT,
  active_period TEXT,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);

-- 剧团
CREATE TABLE IF NOT EXISTS troupes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  founded_year  INTEGER,
  city          TEXT,
  bio           TEXT,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);

-- 演员-录制 多对多
CREATE TABLE IF NOT EXISTS production_actors (
  production_id INTEGER NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  actor_slug    TEXT    NOT NULL REFERENCES actors(slug) ON DELETE CASCADE,
  role          TEXT,
  is_lead       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (production_id, actor_slug)
);

CREATE INDEX IF NOT EXISTS idx_pa_actor ON production_actors(actor_slug);

-- 字段来源/置信度
CREATE TABLE IF NOT EXISTS field_sources (
  entity_type   TEXT NOT NULL,
  entity_key    TEXT NOT NULL,
  field         TEXT NOT NULL,
  source        TEXT NOT NULL,
  source_url    TEXT,
  confidence    TEXT NOT NULL,
  recorded_at   INTEGER NOT NULL,
  PRIMARY KEY (entity_type, entity_key, field)
);

-- FTS5 搜索表
CREATE VIRTUAL TABLE IF NOT EXISTS works_fts USING fts5(
  slug UNINDEXED,
  title,
  title_alt,
  plot_summary,
  tokenize = 'unicode61 remove_diacritics 2'
);

-- FTS5 同步触发器
CREATE TRIGGER IF NOT EXISTS works_ai AFTER INSERT ON works BEGIN
  INSERT INTO works_fts(slug, title, title_alt, plot_summary)
  VALUES (new.slug, new.title, COALESCE(new.title_alt,''), COALESCE(new.plot_summary,''));
END;

CREATE TRIGGER IF NOT EXISTS works_ad AFTER DELETE ON works BEGIN
  DELETE FROM works_fts WHERE slug = old.slug;
END;

CREATE TRIGGER IF NOT EXISTS works_au AFTER UPDATE ON works BEGIN
  DELETE FROM works_fts WHERE slug = old.slug;
  INSERT INTO works_fts(slug, title, title_alt, plot_summary)
  VALUES (new.slug, new.title, COALESCE(new.title_alt,''), COALESCE(new.plot_summary,''));
END;
