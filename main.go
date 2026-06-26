package main

import (
	"embed"

	"github.com/SardelkaS/weavectl/cmd"
)

//go:embed web/dist
var webFS embed.FS

func main() {
	cmd.SetWebFS(webFS)
	cmd.Execute()
}
