# weavectl

A CLI tool + local web UI for building, visualizing, and exploring **service interaction graphs**.

Model your microservice architecture — HTTP APIs, gRPC methods, Kafka topics, async tasks, events — then click any method to instantly trace the full call chain it triggers across the entire system. Export to JSON or YAML; import back for editing. Generate configs with an AI agent.

![weavectl screenshot placeholder](https://placehold.co/900x500/1e1b4b/a5b4fc?text=weavectl+UI)

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Example Config](#example-config)
- [Installation](#installation)
- [CLI Reference](#cli-reference)
- [Web UI Guide](#web-ui-guide)
- [Service Shapes](#service-shapes)
- [Config Format](#config-format)
- [Interaction Types](#interaction-types)
- [AI Generation](#ai-generation)
- [Development](#development)
- [Architecture](#architecture)

---

## Features

- **Visual graph editor** — drag-and-drop service nodes with expandable members (endpoints, tasks, events)
- **Call graph tracing** — select any API method or async task to highlight all interactions it *directly* triggers, transitively, across the whole graph; callers shown in blue, callees in green — never bleeds into unrelated members of a service that's merely touched along the way
- **Inline member editors + View mode** — clicking an endpoint/task/event opens a focused editor for just that member; flip on **View mode** to browse and trace without editors popping open
- **Undo / redo** — every edit can be undone (`Ctrl+Z`) and redone (`Ctrl+Shift+Z`); rapid edits like typing or dragging a node collapse into a single step
- **Search & filter** — one search box narrows both the services and interactions lists in the sidebar
- **Dark mode** — follows your OS theme by default; one click to override, remembered across restarts
- **6 node shapes** — visually distinguish services, databases, caches, queues, gateways, and external systems
- **8 interaction types** rendered with distinct colors and line styles: HTTP, gRPC, GraphQL, WebSocket, Kafka, AMQP, Redis, Database
- **Import / Export** — JSON and YAML config files; import via file upload, paste, or CLI flag
- **AI agent prompt** — one-click copy of a detailed schema prompt to run with any AI coding assistant (Claude Code, Cursor, etc.) against your source code
- **Auto-layout** — one-click dagre-based layout to untangle a busy graph
- **Single binary** — React UI is embedded in the Go binary; one command to start, no Docker required

---

## Quick Start

### Option A — `go install` (recommended, no Node.js required)

The repository ships with pre-built frontend assets, so a single command is enough:

```bash
go install github.com/SardelkaS/weavectl@latest
weavectl serve
```

`weavectl` will be placed in `$(go env GOPATH)/bin` — make sure that directory is in your `PATH`.

### Option B — Build from source

Prerequisites: **Go ≥ 1.22**, **Node.js ≥ 18**

```bash
git clone https://github.com/SardelkaS/weavectl.git
cd weavectl
make build          # builds web UI then compiles Go binary
./weavectl serve
```

If `make` is not available:

```bash
cd web && npm install && npm run build && cd ..
go build -o weavectl .
./weavectl serve
```

### Start the editor

```
→ http://localhost:8080
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

### Build your first graph

1. Click **Add** in the left sidebar → enter a service name (e.g. `API Gateway`)
2. In the service editor that opens, click **+ Add** under **Endpoints** → fill in name, type, path
3. Repeat for other services
4. Drag from a handle (dot) on one service node to a handle on another to create an interaction
5. Click the created edge to set its type (gRPC, Kafka, etc.) and label
6. Click **Export → YAML** to download your config

### Load an existing config

```bash
weavectl serve --config my-architecture.yaml
```

Or drag-and-drop / paste in the UI via **Import**.

---

## Example Config

[`examples/full-example.yaml`](examples/full-example.yaml) is a complete e-commerce microservice architecture that demonstrates every weavectl feature in one file:

| What it covers | Details |
|---|---|
| All 6 node shapes | `service`, `database`, `queue`, `gateway`, `cache`, `external` |
| All 8 interaction types | HTTP, gRPC, GraphQL, WebSocket, Kafka, AMQP, Redis, Database |
| All endpoint types | HTTP REST, gRPC, GraphQL, WebSocket |
| All async task types | `kafka_consumer/producer`, `amqp_consumer/producer`, `cron`, `worker` |
| Events | `publish` and `subscribe` |
| Interaction metadata | `sla_ms`, `circuit_breaker`, `retry` |
| 12 services | API Gateway, User, Order, Payment, Notification, Search, PostgreSQL, Elasticsearch, Redis, Kafka, RabbitMQ, Stripe, SendGrid, Twilio |

**Load it:**

```bash
weavectl serve --config examples/full-example.yaml
```

Or paste the file content into **Import → Paste JSON / YAML** in the UI.

---

## Installation

### `go install` — one command, no Node.js needed

```bash
go install github.com/SardelkaS/weavectl@latest
```

The repository keeps built frontend assets committed, so `go install` produces a fully self-contained binary with the UI embedded.

### From source (with Node.js)

```bash
git clone https://github.com/SardelkaS/weavectl.git
cd weavectl
make build          # npm install + npm run build + go build
# binary: ./weavectl  (or weavectl.exe on Windows)
```

To also install it to `$(go env GOPATH)/bin`:

```bash
make install        # make build-web && go install .
```

### Pre-built binaries

Download from the [Releases](https://github.com/SardelkaS/weavectl/releases) page. No Node.js required — the UI is embedded.

---

## CLI Reference

### `weavectl serve`

Start the web UI server.

```
weavectl serve [flags]
```

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--config` | `-c` | — | Path to a JSON or YAML config file to load on startup. The file is also written back when you click **Save** in the UI. |
| `--port`   | `-p` | `8080`  | TCP port to listen on. |
| `--dev`    | —    | false   | Development mode: serves only the `/api/*` routes and proxies all other requests to the Vite dev server on `:5173`. |

**Examples:**

```bash
# Start with an empty graph
weavectl serve

# Load and edit an existing config; Save in the UI writes back to the file
weavectl serve --config architecture.yaml

# Use a different port
weavectl serve --port 3000

# Development mode (see Development section)
weavectl serve --dev
```

---

### `weavectl convert`

Convert a config file between JSON and YAML formats.

```
weavectl convert -i <input> -o <output>
```

| Flag | Short | Required | Description |
|------|-------|----------|-------------|
| `--input`  | `-i` | yes | Source file (`.json`, `.yaml`, or `.yml`) |
| `--output` | `-o` | yes | Destination file — format is inferred from extension |

**Examples:**

```bash
weavectl convert -i architecture.json -o architecture.yaml
weavectl convert -i old.yml          -o new.json
```

---

## Web UI Guide

### Layout

```
┌───────────────────────────────────────────────────────────────────────┐
│ 🕸️ weavectl [Name]  View mode  Undo Redo  Layout Import Export Save   │
│                                                    AI Prompt    ☀/🌙  │
├──────────────┬──────────────────────────────────────────────────────-┤
│  Services    │                                                       │
│  🔍 Search…  │                  Graph Canvas                        │
│  ──────────  │                                                       │
│  ● API GW    │   ┌────────────────┐      ┌──────────────────┐        │
│  ● User Svc  │   │  API Gateway   │─────>│   User Service   │        │
│  ● Order Svc │   │ ▸ Endpoints    │      │ ▸ Endpoints      │        │
│              │   │   GET /users   │      │   GetUser [gRPC] │        │
│  Interactions│   │   POST /orders │      │ ▸ Async Tasks    │        │
│  ──────────  │   └────────────────┘      └──────────────────┘        │
│  api-gw→user │                                                       │
│  user→kafka  │                                  Legend ────────────┤ │
└──────────────┴───────────────────────────────────────────────────────┘
```

The toolbar, left to right: **View mode** toggle, **Undo/Redo**, **Layout**, **Import**, **Export**, **Save**, **AI Prompt**, and a **light/dark theme** toggle on the far right.

### Service Nodes

Each node represents a service and has three collapsible sections:

| Section | Icon | Contains |
|---------|------|---------|
| **Endpoints** | 🌐 | HTTP/gRPC/GraphQL/WebSocket API methods |
| **Async Tasks** | ⚡ | Kafka consumers/producers, AMQP, cron jobs, workers |
| **Events** | 📡 | Domain events this service publishes or subscribes to |

Click a section header to collapse/expand it. Click any member row to **trace its call graph** and open its editor (see [Call Graph Tracing](#call-graph-tracing) and [View Mode](#view-mode)).

### Adding and Editing

**Add a service:**
Click **Add** in the sidebar → enter name → the node appears on the canvas and the editor opens in the sidebar.

**Add members to a service:**
Select a service node (click its header) → the sidebar shows the service editor → use **+ Add** buttons under Endpoints / Async Tasks / Events.

**Edit an existing member directly:**
Click an endpoint / async task / event row itself (not the service header) → its own focused editor opens in the sidebar (name, type, method/path or topic/queue, description) with a **Delete** button. The same member can also be edited via the service editor's expandable list.

**Create an interaction:**
Hover over a service node — small dots (handles) appear on the left and right edges of each member row. Drag from a dot on the **source** node to a dot on the **target** node. A new HTTP interaction is created; click it to change its type, label, and other properties.

**Edit an interaction:**
Click any edge label on the canvas → the interaction editor opens in the sidebar.

**Delete:**
Open the editor for the service, member, or interaction → scroll to the bottom → click the red **Delete** button. Deleting a service asks for confirmation. Any deletion can be undone with `Ctrl+Z`.

### Call Graph Tracing

This is the core feature. Click any endpoint, async task, or event in a service node:

- **Green edges** — interactions this member triggers (callees), traced transitively
- **Blue edges** — interactions that trigger this member (callers)
- **Dimmed** — everything unrelated to the selected member, including *other, unrelated members of a service that's merely touched along the chain* — only the exact call path lights up
- **Editor opens** in the sidebar for the selected member, unless **View mode** is on (see below)

Click the same member again, or press the canvas background, to clear the trace and close its editor.

### View Mode

The 👁 switch in the toolbar turns off the auto-opening editor: selecting a service, interaction, or member still highlights and traces it on the canvas, but the sidebar stays on the plain list instead of popping open an editor. Useful for browsing or presenting an architecture without risking an accidental edit.

### Undo / Redo

Every edit can be undone — adding, editing, or deleting a service, member, or interaction; auto-layout; dragging a node on the canvas. Rapid-fire edits (typing into a field, dragging a node) are coalesced into a single undo step instead of one per keystroke or per frame.

| Action | Shortcut | Toolbar |
|--------|----------|---------|
| Undo | `Ctrl+Z` (`Cmd+Z` on macOS) | ↶ button |
| Redo | `Ctrl+Shift+Z` or `Ctrl+Y` | ↷ button |

### Search

The search box at the top of the sidebar filters the services list and the interactions list at the same time — matching on service name/id/tags, resolved endpoint/task/event names, interaction type, or label.

### Import and Export

| Action | How |
|--------|-----|
| Export JSON | Toolbar → **Export → JSON** — downloads `graph.json` |
| Export YAML | Toolbar → **Export → YAML** — downloads `graph.yaml` |
| Import file | Toolbar → **Import → Upload file** — accepts `.json`, `.yaml`, `.yml` |
| Import paste | Toolbar → **Import → Paste JSON / YAML** — paste text directly |
| Auto-save | If started with `--config`, clicking **Save** writes back to that file |

### Auto Layout

Click **Layout** in the toolbar to automatically arrange all nodes left-to-right using a hierarchical layout algorithm (dagre). Node positions are saved to the config.

### Theme

weavectl follows your OS's light/dark preference automatically. Click the sun/moon icon at the right end of the toolbar to override it manually — your choice is remembered (via `localStorage`) across restarts, even if the system theme changes later.

---

## Service Shapes

Each service node has a `shape` field that changes its visual appearance in the graph. Pick the shape that best describes the role of the component.

| Shape | Icon | Border | Badge colour | Intended for |
|-------|------|--------|--------------|--------------|
| `service` (default) | Server | solid 2px, rounded-xl | blue | Microservices, backends, BFFs |
| `database` | Database | solid 2px, square corners + top cylinder | green | PostgreSQL, MySQL, MongoDB, … |
| `queue` | MessageSquare | solid 2px, rounded-lg | orange | Kafka, RabbitMQ, SQS, … |
| `gateway` | Shield | solid 3px, rounded-3xl | purple | API gateways, load balancers, reverse proxies |
| `cache` | Zap | **dashed** 2px, rounded-lg | red | Redis, Memcached, CDN edge |
| `external` | Link | **dashed** 2px, square corners | grey | Third-party APIs, SaaS (Stripe, Twilio, …) |

Set shape in YAML:
```yaml
services:
  - id: postgres
    name: PostgreSQL
    shape: database
    color: "#336791"
```

Or pick it via the **Shape** grid in the service editor sidebar (click a service node → Edit).

---

## Config Format

The config is a single JSON or YAML file. All fields except `version`, `name`, `services`, and `interactions` are optional.

### Top-level structure

```yaml
version: "1.0"
name: "My Microservice Architecture"
description: "Optional description of the system"

services:
  - ...

interactions:
  - ...
```

### Service

```yaml
services:
  - id: user-service          # unique kebab-case ID (used in interactions)
    name: User Service        # display name
    description: Manages user profiles and authentication
    color: "#4F46E5"          # hex color for the node
    position:                 # canvas position (set by the UI, or leave at 0/0)
      x: 120
      y: 80

    endpoints:
      - id: get-user
        name: GetUser
        type: grpc            # http | grpc | graphql | websocket
        path: /users/{id}     # route path or gRPC method path
        method: GET           # HTTP method (GET | POST | PUT | PATCH | DELETE)
        description: Returns a user by ID

    async:
      - id: process-payment
        name: ProcessPayment
        type: kafka_consumer  # see Async Task Types table below
        topic: payments.requested
        queue: payments       # for AMQP tasks
        schedule: "0 * * * *" # cron expression (for cron type)
        description: Deducts the payment amount and emits a result event

    events:
      - id: user-created
        name: UserCreated
        type: publish         # publish | subscribe
        topic: user.created
        description: Emitted after a new user registers
```

### Interaction

```yaml
interactions:
  - id: api-gw-get-user       # unique ID
    from: api-gateway.get-user-ep   # serviceId or serviceId.memberId
    to: user-service.get-user       # serviceId or serviceId.memberId
    type: grpc                      # see Interaction Types below
    label: GetUser            # short label shown on the graph edge
    description: API Gateway calls User Service to resolve user identity
    async: false              # true for fire-and-forget (Kafka, AMQP)
    metadata:                 # optional arbitrary key-value pairs
      sla_ms: 50
      circuit_breaker: true
```

#### `from` / `to` address format

| Format | Meaning |
|--------|---------|
| `service-id` | Service-level connection (no specific member) |
| `service-id.member-id` | Connection to/from a specific endpoint, task, or event |

The `member-id` must match the `id` field of an endpoint, async task, or event within the referenced service.

### Async Task Types

| Type | Description |
|------|-------------|
| `kafka_consumer` | Consumes messages from a Kafka topic |
| `kafka_producer` | Publishes messages to a Kafka topic |
| `amqp_consumer` | Consumes from a RabbitMQ/AMQP queue |
| `amqp_producer` | Publishes to a RabbitMQ/AMQP exchange |
| `cron` | Scheduled job (set `schedule` to a cron expression) |
| `worker` | Generic background worker or queue consumer |
| `task` | Generic one-off or ad-hoc background task |

---

## Interaction Types

| Type | Color | Line | Meaning |
|------|-------|------|---------|
| `http` | Blue | Solid | REST HTTP call |
| `grpc` | Purple | Solid | gRPC remote procedure call |
| `graphql` | Pink | Solid | GraphQL query / mutation / subscription |
| `websocket` | Teal | Dashed 8/4 | WebSocket connection |
| `kafka` | Orange | Dashed 6/3 | Kafka message (async) |
| `amqp` | Yellow | Dashed 6/3 | AMQP / RabbitMQ message (async) |
| `redis` | Red | Dotted 3/3 | Redis pub/sub, cache read, or queue |
| `database` | Green | Solid | Direct database access |

Set `async: true` on interactions that are fire-and-forget (Kafka, AMQP) — this is shown as a ⚡ suffix on the edge label.

---

## Development

### Running in dev mode

Two terminals are required:

```bash
# Terminal 1 — Go backend (API only)
go run . serve --dev

# Terminal 2 — Vite dev server (React UI with HMR)
cd web
npm install
npm run dev
# → http://localhost:5173  (proxies /api to :8080)
```

Open [http://localhost:5173](http://localhost:5173) — the UI has hot-module reload, and the API is served by Go.

### Running tests

```bash
# Go backend (internal/config, internal/ai, internal/server)
go test ./...

# React frontend (Vitest) — tracing, serializer, layout
cd web
npm test
```

### Build commands

```bash
make build       # build-web + build-go (full production build)
make build-web   # npm install + npm run build only
make build-go    # go build only (requires web/dist to exist)
make install     # go install to GOPATH/bin
make clean       # remove binary and node_modules/dist
```

### Project structure

```
weavectl/
├── main.go                     # entry point; embeds web/dist into binary
├── go.mod / go.sum
├── Makefile
│
├── cmd/
│   ├── root.go                 # cobra root command
│   ├── serve.go                # weavectl serve
│   └── convert.go              # weavectl convert
│
├── internal/
│   ├── config/
│   │   ├── schema.go           # Go structs (mirrors TypeScript schema.ts)
│   │   ├── convert.go          # JSON ↔ YAML marshal/unmarshal
│   │   └── convert_test.go
│   ├── server/
│   │   ├── server.go           # HTTP server, REST handlers, SPA fallback
│   │   └── server_test.go
│   └── ai/
│       ├── prompt.go           # static AI agent prompt (schema + analysis guide)
│       └── prompt_test.go
│
└── web/                        # React application
    ├── src/
    │   ├── types/schema.ts     # TypeScript types matching schema.go
    │   ├── store/
    │   │   ├── graph.ts        # Zustand store (config, nodes, edges, trace, undo history)
    │   │   └── theme.ts        # light/dark theme store (system default + override)
    │   ├── lib/
    │   │   ├── tracing.ts      # BFS call-graph traversal (+ tracing.test.ts)
    │   │   ├── layout.ts       # dagre auto-layout (+ layout.test.ts)
    │   │   ├── serializer.ts   # config ↔ React Flow nodes/edges (+ serializer.test.ts)
    │   │   └── interactionStyles.ts  # colors & dash patterns per type
    │   └── components/
    │       ├── Canvas.tsx          # React Flow root
    │       ├── ServiceNode.tsx     # expandable service node
    │       ├── InteractionEdge.tsx # styled edge component
    │       ├── Sidebar.tsx         # service/interaction lists, search
    │       ├── ServiceEditor.tsx   # CRUD for endpoints/tasks/events
    │       ├── MemberEditor.tsx    # focused editor for a single member
    │       ├── InteractionEditor.tsx
    │       ├── FormControls.tsx    # shared Field/Input/Select/Textarea
    │       ├── Toolbar.tsx         # view mode/undo-redo/import/export/AI/theme
    │       └── AIPromptModal.tsx   # AI generation dialog
    └── dist/                   # built output (embedded into Go binary)
```

### REST API

The Go server exposes these endpoints (all under `/api`):

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/config` | Return current in-memory config as JSON |
| `PUT` | `/api/config` | Replace config; writes to `--config` file if set |
| `GET` | `/api/export?format=yaml` | Download config as JSON or YAML attachment |
| `POST` | `/api/import` | Multipart file upload, or a raw JSON/YAML body; returns parsed config |
| `GET` | `/api/ai/prompt` | Return the static AI agent prompt string (plain text) |

---

## Architecture

### Config as source of truth

The Zustand store holds the `Config` object as the canonical state. React Flow nodes and edges are derived from it on every change via `serializer.ts`. Node position changes (drag) are written back into `config.services[*].position` so positions survive export/import.

### Call graph tracing

`lib/tracing.ts` runs two BFS passes from the selected `serviceId.memberId`:

1. **Forward pass** — follows `from` references to find all callees (services this member calls, transitively)
2. **Backward pass** — follows `to` references to find all callers (services that call this member)

The result is two `Set<string>` of interaction IDs. Every edge reads its highlight state from these sets via `useEdgeHighlight()`. Nodes are highlighted if their service ID appears in the involved services set. Traversal only ever follows an exact `from`/`to` ref match — reaching a service through one of its members never fans out into that service's other, unrelated members.

### Undo / redo history

The store keeps `past`/`future` arrays of full `Config` snapshots alongside the live config. Every mutating action pushes the pre-change config onto `past` and clears `future`; `undo`/`redo` pop between them. Edits driven by continuous input (typing, node dragging) are coalesced by key + a short time window so one gesture produces one undo step instead of one per keystroke or per animation frame.

### Theme

`store/theme.ts` is a small, independent Zustand store: it resolves the initial theme from `localStorage` (an explicit user choice) or `prefers-color-scheme` (the system default), applies it by toggling a `dark` class on `<html>`, and keeps listening for OS theme changes for as long as the user hasn't overridden it. Styling itself is plain Tailwind `dark:` variants throughout the component tree — no separate dark theme stylesheet.

### Embedding

The React build (`web/dist/`) is embedded into the Go binary at compile time via `//go:embed web/dist` in `main.go`. In production, `weavectl serve` needs no external files. The `--dev` flag skips the embedded files and proxies to the Vite server instead.
