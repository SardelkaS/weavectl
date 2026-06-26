package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/SardelkaS/weavectl/internal/config"
)

var (
	inputFile  string
	outputFile string
)

var convertCmd = &cobra.Command{
	Use:   "convert",
	Short: "Convert config between JSON and YAML",
	Example: `  weavectl convert -i graph.json -o graph.yaml
  weavectl convert -i graph.yaml -o graph.json`,
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.Load(inputFile)
		if err != nil {
			return fmt.Errorf("failed to load %s: %w", inputFile, err)
		}
		if err := config.Save(cfg, outputFile); err != nil {
			return fmt.Errorf("failed to save %s: %w", outputFile, err)
		}
		fmt.Printf("Converted %s → %s\n", inputFile, outputFile)
		return nil
	},
}

func init() {
	rootCmd.AddCommand(convertCmd)
	convertCmd.Flags().StringVarP(&inputFile, "input", "i", "", "Input file path")
	convertCmd.Flags().StringVarP(&outputFile, "output", "o", "", "Output file path")
	_ = convertCmd.MarkFlagRequired("input")
	_ = convertCmd.MarkFlagRequired("output")
}
