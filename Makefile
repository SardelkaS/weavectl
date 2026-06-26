.PHONY: all build build-web build-go dev install clean

BINARY := weavectl
WEB_DIR := web

all: build

## build: Build web UI then Go binary
build: build-web build-go

## build-web: Install npm deps and build React app
build-web:
	cd $(WEB_DIR) && npm install && npm run build

## build-go: Compile the Go binary (requires web/dist to exist)
build-go:
	go build -o $(BINARY) .

## dev: Run Go server in dev mode + Vite dev server (requires tmux or run separately)
dev:
	@echo "Run in two terminals:"
	@echo "  Terminal 1: go run . serve --dev"
	@echo "  Terminal 2: cd web && npm run dev"

## install: Build web assets then install binary to GOPATH/bin
install: build-web
	go install .

## clean: Remove build artifacts
clean:
	rm -f $(BINARY) $(BINARY).exe
	rm -rf $(WEB_DIR)/dist $(WEB_DIR)/node_modules

## run: Quick dev start (Go in dev mode, assumes Vite is running separately)
run:
	go run . serve --dev
