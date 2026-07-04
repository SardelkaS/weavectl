package config

type Config struct {
	Version      string        `json:"version"               yaml:"version"`
	Name         string        `json:"name"                  yaml:"name"`
	Description  string        `json:"description,omitempty" yaml:"description,omitempty"`
	AIPrompt     string        `json:"ai_prompt,omitempty"   yaml:"ai_prompt,omitempty"`
	Services     []Service     `json:"services"              yaml:"services"`
	Interactions []Interaction `json:"interactions"          yaml:"interactions"`
}

// ServiceShape controls the visual appearance of a service node.
// Possible values: service (default), database, queue, gateway, cache, external
type ServiceShape = string

type Service struct {
	ID          string      `json:"id"                    yaml:"id"`
	Name        string      `json:"name"                  yaml:"name"`
	Description string      `json:"description,omitempty" yaml:"description,omitempty"`
	Color       string      `json:"color,omitempty"       yaml:"color,omitempty"`
	Shape       string      `json:"shape,omitempty"       yaml:"shape,omitempty"`
	Tags        []string    `json:"tags,omitempty"        yaml:"tags,omitempty"`
	Position    Position    `json:"position,omitempty"    yaml:"position,omitempty"`
	Endpoints   []Endpoint  `json:"endpoints,omitempty"   yaml:"endpoints,omitempty"`
	Async       []AsyncTask `json:"async,omitempty"       yaml:"async,omitempty"`
	Events      []Event     `json:"events,omitempty"      yaml:"events,omitempty"`
}

type Position struct {
	X float64 `json:"x" yaml:"x"`
	Y float64 `json:"y" yaml:"y"`
}

type Endpoint struct {
	ID          string   `json:"id"                    yaml:"id"`
	Name        string   `json:"name"                  yaml:"name"`
	Type        string   `json:"type"                  yaml:"type"` // http | grpc | graphql | websocket
	Method      string   `json:"method,omitempty"      yaml:"method,omitempty"`
	Path        string   `json:"path,omitempty"        yaml:"path,omitempty"`
	Description string   `json:"description,omitempty" yaml:"description,omitempty"`
	Tags        []string `json:"tags,omitempty"        yaml:"tags,omitempty"`
}

type AsyncTask struct {
	ID          string   `json:"id"                    yaml:"id"`
	Name        string   `json:"name"                  yaml:"name"`
	Type        string   `json:"type"                  yaml:"type"` // kafka_consumer | kafka_producer | cron | worker | amqp_consumer | amqp_producer | task
	Topic       string   `json:"topic,omitempty"       yaml:"topic,omitempty"`
	Queue       string   `json:"queue,omitempty"       yaml:"queue,omitempty"`
	Schedule    string   `json:"schedule,omitempty"    yaml:"schedule,omitempty"`
	Description string   `json:"description,omitempty" yaml:"description,omitempty"`
	Tags        []string `json:"tags,omitempty"        yaml:"tags,omitempty"`
}

type Event struct {
	ID          string   `json:"id"                    yaml:"id"`
	Name        string   `json:"name"                  yaml:"name"`
	Type        string   `json:"type"                  yaml:"type"` // publish | subscribe
	Topic       string   `json:"topic,omitempty"       yaml:"topic,omitempty"`
	Description string   `json:"description,omitempty" yaml:"description,omitempty"`
	Tags        []string `json:"tags,omitempty"        yaml:"tags,omitempty"`
}

type Interaction struct {
	ID          string         `json:"id"                    yaml:"id"`
	From        string         `json:"from"                  yaml:"from"` // serviceId or serviceId.memberId
	To          string         `json:"to"                    yaml:"to"`   // serviceId or serviceId.memberId
	Type        string         `json:"type"                  yaml:"type"` // http|grpc|kafka|amqp|redis|database|websocket|graphql
	Label       string         `json:"label,omitempty"       yaml:"label,omitempty"`
	Description string         `json:"description,omitempty" yaml:"description,omitempty"`
	Async       bool           `json:"async,omitempty"       yaml:"async,omitempty"`
	Metadata    map[string]any `json:"metadata,omitempty"    yaml:"metadata,omitempty"`
}

func Empty() *Config {
	return &Config{
		Version:      "1.0",
		Name:         "New Architecture",
		Services:     []Service{},
		Interactions: []Interaction{},
	}
}
