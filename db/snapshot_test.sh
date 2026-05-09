#!/usr/bin/env bash
set -euo pipefail

# 在临时 sqlite 文件上跑一遍 schema，确认所有 DDL 合法、表都存在
TMPDB=$(mktemp -t xiqu-schema.XXXXXX.db)
trap 'rm -f "$TMPDB"' EXIT

sqlite3 "$TMPDB" < db/schema.sql

EXPECTED_TABLES="actors field_sources parts production_actors productions troupes works works_fts"
ACTUAL=$(sqlite3 "$TMPDB" "SELECT name FROM sqlite_master WHERE type IN ('table') AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'works_fts_%' ORDER BY name;" | tr '\n' ' ' | sed 's/ $//')

if [ "$ACTUAL" != "$EXPECTED_TABLES" ]; then
  echo "FAIL: expected tables: $EXPECTED_TABLES"
  echo "      actual tables:   $ACTUAL"
  exit 1
fi

# 验证 FTS5 触发器与基本 INSERT 流程
# PRAGMA trusted_schema=ON is required per-connection for FTS5 writes inside triggers
# (SQLite >= 3.37 security policy; also needed on macOS system SQLite 3.43)
sqlite3 "$TMPDB" <<SQL
PRAGMA trusted_schema=ON;
INSERT INTO works(slug,title,created_at,updated_at) VALUES('liu-yue-xue','六月雪',0,0);
SELECT title FROM works_fts WHERE slug='liu-yue-xue';
SQL

echo "schema smoke test PASS"
