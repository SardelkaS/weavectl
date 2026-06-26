package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/SardelkaS/weavectl/internal/server"
)

var (
	configPath string
	port       int
	devMode    bool
)

var serveCmd = &cobra.Command{
	Use:   "serve",
	Short: "Start the web UI",
	Long:  `Start a local web server and open the service graph editor in your browser.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		s := server.New(server.Options{
			Port:       port,
			ConfigPath: configPath,
			DevMode:    devMode,
			WebFS:      webFS,
		})
		fmt.Printf("Starting weavectl UI → http://localhost:%d\n", port)
		if configPath != "" {
			fmt.Printf("Config file: %s\n", configPath)
		}
		return s.Start()
	},
}

func init() {
	rootCmd.AddCommand(serveCmd)
	serveCmd.Flags().StringVarP(&configPath, "config", "c", "", "Path to config file (JSON or YAML)")
	serveCmd.Flags().IntVarP(&port, "port", "p", 8080, "Port to listen on")
	serveCmd.Flags().BoolVar(&devMode, "dev", false, "Dev mode: proxy UI to Vite dev server on :5173")
}
