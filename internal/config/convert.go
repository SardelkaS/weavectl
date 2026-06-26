package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v3"
)

func Load(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	return ParseBytes(data, formatFromPath(path))
}

func Save(cfg *Config, path string) error {
	data, err := Serialize(cfg, formatFromPath(path))
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0644)
}

func ParseBytes(data []byte, format string) (*Config, error) {
	var cfg Config
	switch format {
	case "yaml":
		if err := yaml.Unmarshal(data, &cfg); err != nil {
			return nil, fmt.Errorf("YAML parse error: %w", err)
		}
	default:
		if err := json.Unmarshal(data, &cfg); err != nil {
			// fallback to YAML
			if err2 := yaml.Unmarshal(data, &cfg); err2 != nil {
				return nil, fmt.Errorf("failed to parse as JSON (%v) or YAML (%v)", err, err2)
			}
		}
	}
	return &cfg, nil
}

func Serialize(cfg *Config, format string) ([]byte, error) {
	switch format {
	case "yaml":
		return yaml.Marshal(cfg)
	default:
		return json.MarshalIndent(cfg, "", "  ")
	}
}

func formatFromPath(path string) string {
	ext := strings.ToLower(filepath.Ext(path))
	if ext == ".yaml" || ext == ".yml" {
		return "yaml"
	}
	return "json"
}
