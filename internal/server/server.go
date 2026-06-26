package server

import (
	"embed"
	"encoding/json"
	"fmt"
	"io"
	"io/fs"
	"log"
	"mime"
	"net/http"
	"net/http/httputil"
	"net/url"
	"path/filepath"
	"strings"
	"sync"

	"github.com/SardelkaS/weavectl/internal/ai"
	"github.com/SardelkaS/weavectl/internal/config"
)

type Options struct {
	Port       int
	ConfigPath string
	DevMode    bool
	WebFS      embed.FS
}

type Server struct {
	opts Options
	mu   sync.RWMutex
	cfg  *config.Config
}

func New(o Options) *Server {
	return &Server{opts: o}
}

func (s *Server) Start() error {
	if s.opts.ConfigPath != "" {
		cfg, err := config.Load(s.opts.ConfigPath)
		if err != nil {
			return fmt.Errorf("failed to load config: %w", err)
		}
		s.cfg = cfg
	} else {
		s.cfg = config.Empty()
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/api/config", s.withCORS(s.handleConfig))
	mux.HandleFunc("/api/export", s.withCORS(s.handleExport))
	mux.HandleFunc("/api/import", s.withCORS(s.handleImport))
	mux.HandleFunc("/api/ai/prompt", s.withCORS(s.handleAIPrompt))

	if s.opts.DevMode {
		target, _ := url.Parse("http://localhost:5173")
		proxy := httputil.NewSingleHostReverseProxy(target)
		mux.Handle("/", proxy)
		log.Printf("Dev mode: proxying UI to http://localhost:5173")
	} else {
		dist, err := fs.Sub(s.opts.WebFS, "web/dist")
		if err != nil {
			return fmt.Errorf("embedded web files not found: %w", err)
		}
		mux.Handle("/", s.spaHandler(http.FS(dist)))
	}

	addr := fmt.Sprintf(":%d", s.opts.Port)
	log.Printf("weavectl listening on http://localhost%s", addr)
	return http.ListenAndServe(addr, mux)
}

func (s *Server) spaHandler(fileSystem http.FileSystem) http.Handler {
	fileServer := http.FileServer(fileSystem)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		if path != "/" {
			f, err := fileSystem.Open(path)
			if err != nil {
				r.URL.Path = "/"
			} else {
				f.Close()
				ext := filepath.Ext(path)
				if ct := mime.TypeByExtension(ext); ct != "" {
					w.Header().Set("Content-Type", ct)
				}
			}
		}
		fileServer.ServeHTTP(w, r)
	})
}

func (s *Server) withCORS(h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			return
		}
		h(w, r)
	}
}

func (s *Server) handleConfig(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	switch r.Method {
	case http.MethodGet:
		s.mu.RLock()
		defer s.mu.RUnlock()
		json.NewEncoder(w).Encode(s.cfg)

	case http.MethodPut:
		var cfg config.Config
		if err := json.NewDecoder(r.Body).Decode(&cfg); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		s.mu.Lock()
		s.cfg = &cfg
		s.mu.Unlock()

		if s.opts.ConfigPath != "" {
			if err := config.Save(&cfg, s.opts.ConfigPath); err != nil {
				log.Printf("warn: failed to save config to %s: %v", s.opts.ConfigPath, err)
			}
		}
		w.WriteHeader(http.StatusNoContent)

	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleExport(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	format := r.URL.Query().Get("format")
	if format == "" {
		format = "json"
	}

	s.mu.RLock()
	cfg := s.cfg
	s.mu.RUnlock()

	data, err := config.Serialize(cfg, format)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if format == "yaml" || format == "yml" {
		w.Header().Set("Content-Type", "application/x-yaml")
		w.Header().Set("Content-Disposition", `attachment; filename="graph.yaml"`)
	} else {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Content-Disposition", `attachment; filename="graph.json"`)
	}
	w.Write(data)
}

func (s *Server) handleImport(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var data []byte
	var format string

	ct := r.Header.Get("Content-Type")
	if strings.Contains(ct, "multipart") {
		if err := r.ParseMultipartForm(10 << 20); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		file, header, err := r.FormFile("file")
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		defer file.Close()
		data, err = io.ReadAll(file)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		ext := strings.ToLower(filepath.Ext(header.Filename))
		if ext == ".yaml" || ext == ".yml" {
			format = "yaml"
		} else {
			format = "json"
		}
	} else {
		var err error
		data, err = io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		format = r.URL.Query().Get("format")
		if format == "" {
			format = "json"
		}
	}

	cfg, err := config.ParseBytes(data, format)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	s.mu.Lock()
	s.cfg = cfg
	s.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cfg)
}

// handleAIPrompt returns the static schema prompt for AI-assisted config generation.
func (s *Server) handleAIPrompt(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Write([]byte(ai.GetSchemaPrompt()))
}
