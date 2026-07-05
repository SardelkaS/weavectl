package config

import (
	"os"
	"path/filepath"
	"testing"
)

func sampleConfig() *Config {
	return &Config{
		Version:     "1.0",
		Name:        "Sample",
		Description: "A sample config",
		Services: []Service{
			{
				ID:   "svc-a",
				Name: "Service A",
				Endpoints: []Endpoint{
					{ID: "ep1", Name: "GetThing", Type: "http", Method: "GET", Path: "/thing"},
				},
			},
		},
		Interactions: []Interaction{
			{ID: "ix1", From: "svc-a.ep1", To: "svc-b", Type: "http"},
		},
	}
}

func TestSerializeAndParseBytesJSON(t *testing.T) {
	cfg := sampleConfig()
	data, err := Serialize(cfg, "json")
	if err != nil {
		t.Fatalf("Serialize: %v", err)
	}

	got, err := ParseBytes(data, "json")
	if err != nil {
		t.Fatalf("ParseBytes: %v", err)
	}
	if got.Name != cfg.Name || len(got.Services) != 1 || len(got.Interactions) != 1 {
		t.Errorf("round-tripped config mismatch: %+v", got)
	}
}

func TestSerializeAndParseBytesYAML(t *testing.T) {
	cfg := sampleConfig()
	data, err := Serialize(cfg, "yaml")
	if err != nil {
		t.Fatalf("Serialize: %v", err)
	}

	got, err := ParseBytes(data, "yaml")
	if err != nil {
		t.Fatalf("ParseBytes: %v", err)
	}
	if got.Name != cfg.Name || got.Services[0].Endpoints[0].Path != "/thing" {
		t.Errorf("round-tripped config mismatch: %+v", got)
	}
}

func TestParseBytesDefaultFallsBackToYAML(t *testing.T) {
	// Valid YAML that is not valid JSON should still parse when format is unspecified.
	yamlOnly := []byte("version: \"1.0\"\nname: FallbackTest\nservices: []\ninteractions: []\n")

	got, err := ParseBytes(yamlOnly, "")
	if err != nil {
		t.Fatalf("expected YAML fallback to succeed, got error: %v", err)
	}
	if got.Name != "FallbackTest" {
		t.Errorf("expected name %q, got %q", "FallbackTest", got.Name)
	}
}

func TestParseBytesInvalidReturnsError(t *testing.T) {
	_, err := ParseBytes([]byte("{"), "")
	if err == nil {
		t.Fatal("expected an error for input invalid as both JSON and YAML, got nil")
	}
}

func TestLoadSaveRoundTripJSON(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "graph.json")
	cfg := sampleConfig()

	if err := Save(cfg, path); err != nil {
		t.Fatalf("Save: %v", err)
	}
	got, err := Load(path)
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	if got.Name != cfg.Name {
		t.Errorf("expected name %q, got %q", cfg.Name, got.Name)
	}
}

func TestLoadSaveRoundTripYAML(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "graph.yaml")
	cfg := sampleConfig()

	if err := Save(cfg, path); err != nil {
		t.Fatalf("Save: %v", err)
	}
	got, err := Load(path)
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	if got.Name != cfg.Name {
		t.Errorf("expected name %q, got %q", cfg.Name, got.Name)
	}

	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("ReadFile: %v", err)
	}
	if len(raw) == 0 {
		t.Error("expected a non-empty YAML file on disk")
	}
}

func TestLoadMissingFile(t *testing.T) {
	_, err := Load(filepath.Join(t.TempDir(), "does-not-exist.json"))
	if err == nil {
		t.Fatal("expected an error loading a missing file")
	}
}

func TestEmpty(t *testing.T) {
	cfg := Empty()
	if cfg.Version == "" || cfg.Services == nil || cfg.Interactions == nil {
		t.Errorf("Empty() should return a fully-initialized config, got %+v", cfg)
	}
}
