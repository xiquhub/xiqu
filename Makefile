.PHONY: help dev build test ingest snapshot backup restore lint clean

DB := db/xiqu.db
SCHEMA := db/schema.sql
SNAPSHOT := db/snapshots/latest.sql
TS := $(shell date +%Y%m%d-%H%M%S)

help:
	@echo "make dev       - 启动 web (Next.js) + server (Go)"
	@echo "make build     - 构建 Go 服务和 Next.js"
	@echo "make test      - 跑所有测试 (Go + schema smoke)"
	@echo "make ingest    - 跑 ingest 管线，输出 plays.jsonl"
	@echo "make snapshot  - 把当前 SQLite dump 到 db/snapshots/latest.sql"
	@echo "make backup    - 拷贝当前 SQLite 到 db/backups/xiqu-{ts}.db"
	@echo "make restore   - 用 latest.sql 重建 db/xiqu.db (会先删除现有 db)"
	@echo "make lint      - 校验 OpenAPI"
	@echo "make clean     - 删除构建产物（不动数据库）"

dev:
	@echo ">> 启动 server (8787) 与 web (3000)"
	@(cd apps/server && go run ./cmd/server) & \
	pnpm --filter web dev; \
	wait

build:
	cd apps/server && go build ./...
	pnpm --filter web build

test:
	cd apps/server && go test ./... -v
	@if find pipelines/ingest -name '*.go' -print -quit | grep -q .; then \
		cd pipelines/ingest && go test ./... -v; \
	else \
		echo "(pipelines/ingest has no Go files yet)"; \
	fi
	./db/snapshot_test.sh

ingest:
	cd pipelines/ingest && go run ./cmd/ingest \
	  -input ./data/files.txt \
	  -output ./out/plays.jsonl \
	  -report ./out/report.md

snapshot:
	@if [ ! -f "$(DB)" ]; then echo "no db at $(DB), skipping"; exit 0; fi
	sqlite3 "$(DB)" ".dump" > "$(SNAPSHOT)"
	@echo "snapshot written to $(SNAPSHOT)"

backup:
	@if [ ! -f "$(DB)" ]; then echo "no db at $(DB)"; exit 1; fi
	mkdir -p db/backups
	cp "$(DB)" "db/backups/xiqu-$(TS).db"
	@echo "backup written to db/backups/xiqu-$(TS).db"

restore:
	@if [ ! -f "$(SNAPSHOT)" ]; then echo "no snapshot at $(SNAPSHOT)"; exit 1; fi
	rm -f "$(DB)"
	sqlite3 "$(DB)" < "$(SNAPSHOT)"
	@echo "restored $(DB) from $(SNAPSHOT)"

lint:
	pnpm dlx @redocly/cli@latest lint shared/openapi.yaml

clean:
	rm -rf apps/web/.next apps/web/out
	cd apps/server && go clean
	cd pipelines/ingest && go clean
