package server

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	"github.com/SardelkaS/weavectl/internal/config"
)

func newTestServer() *Server {
	s := New(Options{})
	s.cfg = &config.Config{
		Version:      "1.0",
		Name:         "Test",
		Services:     []config.Service{{ID: "svc-a", Name: "Service A"}},
		Interactions: []config.Interaction{},
	}
	return s
}

func TestHandleConfigGet(t *testing.T) {
	s := newTestServer()
	req := httptest.NewRequest(http.MethodGet, "/api/config", nil)
	rec := httptest.NewRecorder()

	s.handleConfig(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	var got config.Config
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("invalid JSON response: %v", err)
	}
	if got.Name != "Test" {
		t.Errorf("expected name %q, got %q", "Test", got.Name)
	}
}

func TestHandleConfigPut(t *testing.T) {
	s := newTestServer()
	newCfg := config.Config{Version: "1.0", Name: "Updated", Services: []config.Service{}, Interactions: []config.Interaction{}}
	body, _ := json.Marshal(newCfg)

	req := httptest.NewRequest(http.MethodPut, "/api/config", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	s.handleConfig(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", rec.Code)
	}
	if s.cfg.Name != "Updated" {
		t.Errorf("expected in-memory config to be updated, got name %q", s.cfg.Name)
	}
}

func TestHandleConfigPutSavesToConfiguredPath(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "graph.json")

	s := New(Options{ConfigPath: path})
	s.cfg = &config.Config{Version: "1.0", Name: "Initial", Services: []config.Service{}, Interactions: []config.Interaction{}}

	newCfg := config.Config{Version: "1.0", Name: "Saved", Services: []config.Service{}, Interactions: []config.Interaction{}}
	body, _ := json.Marshal(newCfg)
	req := httptest.NewRequest(http.MethodPut, "/api/config", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	s.handleConfig(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", rec.Code)
	}

	saved, err := config.Load(path)
	if err != nil {
		t.Fatalf("expected config to be persisted to %s: %v", path, err)
	}
	if saved.Name != "Saved" {
		t.Errorf("expected saved config name %q, got %q", "Saved", saved.Name)
	}
}

func TestHandleConfigPutInvalidJSON(t *testing.T) {
	s := newTestServer()
	req := httptest.NewRequest(http.MethodPut, "/api/config", strings.NewReader("{not json"))
	rec := httptest.NewRecorder()

	s.handleConfig(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestHandleConfigMethodNotAllowed(t *testing.T) {
	s := newTestServer()
	req := httptest.NewRequest(http.MethodDelete, "/api/config", nil)
	rec := httptest.NewRecorder()

	s.handleConfig(rec, req)

	if rec.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", rec.Code)
	}
}

func TestHandleExportJSON(t *testing.T) {
	s := newTestServer()
	req := httptest.NewRequest(http.MethodGet, "/api/export?format=json", nil)
	rec := httptest.NewRecorder()

	s.handleExport(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("expected application/json content type, got %q", ct)
	}
	var got config.Config
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("invalid JSON export: %v", err)
	}
}

func TestHandleExportYAML(t *testing.T) {
	s := newTestServer()
	req := httptest.NewRequest(http.MethodGet, "/api/export?format=yaml", nil)
	rec := httptest.NewRecorder()

	s.handleExport(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if ct := rec.Header().Get("Content-Type"); ct != "application/x-yaml" {
		t.Errorf("expected application/x-yaml content type, got %q", ct)
	}
	if !strings.Contains(rec.Body.String(), "name: Test") {
		t.Errorf("expected exported YAML to contain the config name, got: %s", rec.Body.String())
	}
}

func TestHandleImportRawJSON(t *testing.T) {
	s := newTestServer()
	newCfg := config.Config{Version: "1.0", Name: "Imported", Services: []config.Service{}, Interactions: []config.Interaction{}}
	body, _ := json.Marshal(newCfg)

	req := httptest.NewRequest(http.MethodPost, "/api/import?format=json", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	s.handleImport(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if s.cfg.Name != "Imported" {
		t.Errorf("expected server config updated to %q, got %q", "Imported", s.cfg.Name)
	}
}

func TestHandleImportMultipartYAMLFile(t *testing.T) {
	s := newTestServer()

	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)
	fw, err := mw.CreateFormFile("file", "graph.yaml")
	if err != nil {
		t.Fatal(err)
	}
	fw.Write([]byte("version: \"1.0\"\nname: FromYAML\nservices: []\ninteractions: []\n"))
	mw.Close()

	req := httptest.NewRequest(http.MethodPost, "/api/import", &buf)
	req.Header.Set("Content-Type", mw.FormDataContentType())
	rec := httptest.NewRecorder()

	s.handleImport(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}
	if s.cfg.Name != "FromYAML" {
		t.Errorf("expected config name %q, got %q", "FromYAML", s.cfg.Name)
	}
}

func TestHandleAIPrompt(t *testing.T) {
	s := newTestServer()
	req := httptest.NewRequest(http.MethodGet, "/api/ai/prompt", nil)
	rec := httptest.NewRecorder()

	s.handleAIPrompt(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if rec.Body.Len() == 0 {
		t.Error("expected a non-empty prompt body")
	}
}

func TestWithCORSHandlesPreflight(t *testing.T) {
	s := newTestServer()
	called := false
	handler := s.withCORS(func(w http.ResponseWriter, r *http.Request) {
		called = true
	})

	req := httptest.NewRequest(http.MethodOptions, "/api/config", nil)
	rec := httptest.NewRecorder()
	handler(rec, req)

	if called {
		t.Error("expected the wrapped handler not to be called for an OPTIONS preflight")
	}
	if rec.Header().Get("Access-Control-Allow-Origin") != "*" {
		t.Error("expected the CORS header to be set")
	}
}
