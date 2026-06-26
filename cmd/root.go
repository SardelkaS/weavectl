package cmd

import (
	"embed"
	"os"

	"github.com/spf13/cobra"
)

var webFS embed.FS

func SetWebFS(fs embed.FS) {
	webFS = fs
}

var rootCmd = &cobra.Command{
	Use:   "weavectl",
	Short: "Service interaction graph editor",
	Long: `weavectl is a tool for creating, visualizing, and exporting
service interaction graphs with support for gRPC, HTTP, Kafka, and more.`,
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}
