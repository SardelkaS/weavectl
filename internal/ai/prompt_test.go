package ai

import (
	"strings"
	"testing"
)

func TestGetSchemaPromptNotEmpty(t *testing.T) {
	if GetSchemaPrompt() == "" {
		t.Fatal("expected a non-empty prompt")
	}
}

func TestGetSchemaPromptMentionsKeySchemaFields(t *testing.T) {
	prompt := GetSchemaPrompt()
	for _, want := range []string{"services", "interactions", "endpoints", "async", "events", "kebab-case"} {
		if !strings.Contains(prompt, want) {
			t.Errorf("expected prompt to mention %q", want)
		}
	}
}

func TestGetSchemaPromptReturnsConstant(t *testing.T) {
	if GetSchemaPrompt() != SchemaPrompt {
		t.Error("GetSchemaPrompt() should return the SchemaPrompt constant")
	}
}
