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
	for _, want := range []string{"services", "interactions", "endpoints", "async", "events", "internal", "kebab-case"} {
		if !strings.Contains(prompt, want) {
			t.Errorf("expected prompt to mention %q", want)
		}
	}
}

func TestGetSchemaPromptForbidsBareServiceRefs(t *testing.T) {
	prompt := GetSchemaPrompt()
	if !strings.Contains(prompt, "never valid") && !strings.Contains(prompt, "never be a bare") && !strings.Contains(prompt, "bare service id") {
		t.Error("expected the prompt to explicitly state that bare service ids are not a valid interaction endpoint")
	}
}

func TestGetSchemaPromptReturnsConstant(t *testing.T) {
	if GetSchemaPrompt() != SchemaPrompt {
		t.Error("GetSchemaPrompt() should return the SchemaPrompt constant")
	}
}
