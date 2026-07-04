// Package ai provides the AI agent prompt for weavectl config generation.
package ai

// SchemaPrompt is a ready-to-use prompt for an AI agent that has access to
// service source code. Copy it and run the agent in your project workspace.
const SchemaPrompt = `# weavectl Config Generation Prompt

You are a software architecture analyst. Your task is to analyse the source code
of a microservice system and produce a **weavectl** service interaction graph
configuration that precisely describes every service, its API surface, async
workers, and all inter-service communications.

---

## Output requirements

- Return **only** valid YAML (or JSON) — no prose, no markdown fences.
- The top-level structure must match the schema below exactly.
- Use **kebab-case** for all ` + "`id`" + ` fields.
- Every ` + "`interaction.from`" + ` and ` + "`interaction.to`" + ` must reference an ` + "`id`" + ` that
  exists in the ` + "`services`" + ` list (and optionally a member id within that service).

---

## Schema reference

` + "```yaml" + `
version: "1.0"           # always "1.0"
name: string             # human-readable system name
description: string      # optional overall description

services:
  - id: string           # unique kebab-case identifier  (REQUIRED)
    name: string         # display name                  (REQUIRED)
    description: string  # optional
    color: "#HEX"        # optional brand colour

    # Visual shape of the node in the graph editor.
    # Allowed values (pick the most accurate):
    #   service   — a regular microservice / application (DEFAULT)
    #   database  — relational DB, document store, search index
    #   queue     — message broker (Kafka cluster, RabbitMQ, SQS, etc.)
    #   gateway   — API gateway, BFF, load-balancer, reverse proxy
    #   cache     — in-memory cache (Redis, Memcached, Hazelcast)
    #   external  — third-party system outside your control (Stripe, Twilio, …)
    shape: service

    # --- Synchronous API surface ---
    endpoints:
      - id: string         # unique within this service
        name: string       # method / route name
        # type values: http | grpc | graphql | websocket
        type: http
        method: GET        # HTTP only: GET POST PUT PATCH DELETE
        path: /api/v1/...  # URL path or gRPC fully-qualified method path
        description: string

    # --- Asynchronous workers / background tasks ---
    async:
      - id: string
        name: string
        # type values:
        #   kafka_consumer   — reads from a Kafka topic
        #   kafka_producer   — writes to a Kafka topic
        #   amqp_consumer    — reads from RabbitMQ / AMQP queue
        #   amqp_producer    — publishes to RabbitMQ / AMQP exchange
        #   cron             — time-based scheduled job
        #   worker           — generic background worker / job queue consumer
        #   task             — generic one-off or ad-hoc background task
        type: kafka_consumer
        topic: some.kafka.topic     # kafka_* types
        queue: queue-name           # amqp_* and worker types
        schedule: "0 2 * * *"       # cron type (standard cron expression)
        description: string

    # --- Domain events ---
    events:
      - id: string
        name: string
        type: publish      # publish | subscribe
        topic: domain.event.name
        description: string

interactions:
  - id: string             # unique kebab-case identifier  (REQUIRED)

    # Address format: "serviceId"  OR  "serviceId.memberId"
    # memberId is the id of an endpoint, async task, or event.
    from: source-service-id.endpoint-or-task-id
    to:   target-service-id.endpoint-or-task-id

    # type values:
    #   http       — REST HTTP call
    #   grpc       — gRPC remote procedure call
    #   graphql    — GraphQL query / mutation / subscription
    #   websocket  — persistent WebSocket connection
    #   kafka      — Kafka message (always set async: true)
    #   amqp       — RabbitMQ / AMQP message (always set async: true)
    #   redis      — Redis pub/sub, cache read/write, or Streams
    #   database   — direct database access (SQL, ORM, driver)
    type: grpc

    label: ShortLabel    # shown on the graph edge (keep ≤ 30 chars)
    description: string  # detailed explanation
    async: false         # true for fire-and-forget (kafka, amqp)

    # Optional free-form metadata (any key-value pairs)
    metadata:
      sla_ms: 100
      circuit_breaker: true
` + "```" + `

---

## Source-code analysis guide

Work through the codebase systematically before writing any YAML.

### 1. Identify service boundaries
- One deployable unit = one service entry.
- Look for: Dockerfile / docker-compose services, Kubernetes Deployment manifests,
  separate Go modules / Python packages / Node packages, CI pipeline jobs.

### 2. Determine the shape
| What you find in code | shape |
|---|---|
| HTTP/gRPC/GraphQL server with business logic | ` + "`service`" + ` |
| PostgreSQL, MySQL, MongoDB, Elasticsearch, etc. | ` + "`database`" + ` |
| Kafka cluster, RabbitMQ, SQS, NATS | ` + "`queue`" + ` |
| nginx, Envoy, Kong, AWS ALB, BFF layer | ` + "`gateway`" + ` |
| Redis, Memcached, Hazelcast | ` + "`cache`" + ` |
| Stripe, Twilio, SendGrid, any external SaaS | ` + "`external`" + ` |

### 3. Extract API endpoints (sync)
- **HTTP**: scan route registrations (` + "`router.GET`" + `, ` + "`@app.route`" + `, ` + "`app.get`" + `, ` + "`[HttpGet]`" + `, …).
  Record method + path.
- **gRPC**: read ` + "`.proto`" + ` files — each ` + "`rpc`" + ` line inside a ` + "`service`" + ` block is one endpoint.
  Path = ` + "`/package.ServiceName/MethodName`" + `.
- **GraphQL**: scan schema ` + "`.graphql`" + ` files or resolver registrations; each query/mutation/
  subscription is one endpoint.
- **WebSocket**: look for upgrade handlers, ` + "`ws://`" + ` URLs, or ` + "`socket.io`" + ` usage.

### 4. Extract async tasks
- **Kafka consumer**: ` + "`@KafkaListener`" + `, ` + "`consumer.subscribe`" + `, ` + "`sarama.Consumer`" + `, ` + "`confluent_kafka.Consumer`" + `.
  Record the topic name.
- **Kafka producer**: ` + "`producer.produce`" + `, ` + "`kafkaTemplate.send`" + `. Record the topic.
- **AMQP consumer**: ` + "`ch.Consume`" + `, ` + "`@RabbitListener`" + `. Record the queue name.
- **Cron**: ` + "`@Scheduled`" + `, ` + "`cron.AddFunc`" + `, ` + "`APScheduler`" + `. Record the cron expression.
- **Worker**: ` + "`celery.task`" + `, ` + "`sidekiq`" + `, ` + "`BullMQ`" + `, generic queue consumers.

### 5. Trace inter-service interactions
For each service, scan for calls to OTHER services:

- **HTTP clients**: ` + "`http.Get`" + `, ` + "`axios.post`" + `, ` + "`requests.get`" + `, ` + "`fetch`" + `, ` + "`RestTemplate`" + `.
  Follow the URL to identify the target service.
- **gRPC clients**: stub instantiation (` + "`NewUserServiceClient`" + `, ` + "`grpc.Dial`" + `).
  The method called → ` + "`to`" + ` = ` + "`targetService.endpointId`" + `.
- **Kafka producers**: ` + "`producer.send(topic, …)`" + ` → ` + "`from`" + ` = this service, ` + "`to`" + ` = kafka.
  Then who consumes that topic? → add a second interaction kafka → consumer.
- **Database**: ORM model definitions, ` + "`db.Query`" + `, ` + "`repository.save`" + ` → type ` + "`database`" + `.
- **Redis**: ` + "`redis.Get`" + `, ` + "`redis.Set`" + `, ` + "`PUBLISH`" + `, ` + "`SUBSCRIBE`" + ` → type ` + "`redis`" + `.

### 6. Identify domain events
- Classes/interfaces named ` + "`*Event`" + `, ` + "`*Created`" + `, ` + "`*Updated`" + `, ` + "`*Deleted`" + `.
- Event bus registrations (` + "`eventBus.publish`" + `, ` + "`@EventHandler`" + `).
- These become ` + "`events`" + ` entries with ` + "`type: publish`" + ` or ` + "`type: subscribe`" + `.

### 7. Quality checklist before outputting
- [ ] Every service that is called has an entry in ` + "`services`" + `.
- [ ] Every ` + "`interaction.from`" + ` and ` + "`to`" + ` resolves to a real ` + "`id`" + `.
- [ ] Kafka/AMQP interactions have ` + "`async: true`" + `.
- [ ] Database services use ` + "`shape: database`" + `.
- [ ] External third-party systems use ` + "`shape: external`" + `.
- [ ] No duplicate ` + "`id`" + ` values at any level.
- [ ] All ` + "`id`" + ` values are kebab-case.

---

Now analyse the source code in this workspace and generate the complete weavectl
configuration YAML for the entire system.
`

// GetSchemaPrompt returns the static schema prompt.
func GetSchemaPrompt() string {
	return SchemaPrompt
}
