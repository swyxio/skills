# Backend setup and selection

Read this reference when no LLM client is already configured, when choosing
between local and hosted execution, or when a provider request fails. Do not
load it for an ordinary summary when the repository already has a working
client.

Provider model names, context windows, request parameters, prices, and rate
limits change frequently. Inspect the installed SDK and the provider's current
model/API documentation before choosing a model or quoting a limit. The durable
recommendations here are about adapter shape and workload fit.

## Minimum setup

Use an existing application client where possible. For a small shell workflow,
`curl` and `jq` are sufficient:

```bash
command -v curl
command -v jq
```

Do not install packages or write credentials without approval. Hosted keys
belong in environment variables or a secret manager, never inline arguments,
prompts, generated scripts, logs, or committed files.

Common provider variables:

```text
OPENAI_API_KEY
ANTHROPIC_API_KEY
GEMINI_API_KEY
OPENROUTER_API_KEY
CUSTOM_API_KEY
```

For local work, use an already-installed Ollama model or another local server.
Confirm that the model is present and discover its actual context configuration;
the model family name alone does not prove the runtime's context size.

## Selection guide

Choose from capabilities measured at action time:

| Situation | Prefer |
|---|---|
| Sensitive source or no network upload | A capable local model, if latency and memory are acceptable |
| Source comfortably fits one verified context | One direct call to the user's configured provider |
| Source approaches the context boundary | A larger-context configured model or map/reduce with the current model |
| Many independent chunks | A low-cost/fast model for map, optionally a stronger model for final reduce |
| High-stakes synthesis or subtle contradictions | The strongest approved model for final reduce, with source verification |
| Reproducible batch workflow | A pinned model plus captured provider/model/parameters and prompt version |

Reserve room for system instructions, focus directives, chunk metadata, and the
requested output. “Input token count is below the advertised context window” is
not enough if no output budget remains.

## OpenAI-compatible adapter

OpenAI, OpenRouter, Gemini's compatibility endpoint, Ollama, and some gateways
accept a chat-completions-shaped request. Compatibility is partial: inspect the
selected provider's supported parameters rather than assuming every field is
portable.

```bash
call_chat_compatible() {
  local base_url="$1"
  local api_key="$2"
  local model="$3"
  local system_prompt="$4"
  local source_text="$5"
  local output_tokens="$6"

  curl --fail-with-body --silent --show-error \
    "${base_url%/}/chat/completions" \
    -H "Authorization: Bearer ${api_key}" \
    -H "Content-Type: application/json" \
    -d "$(jq -n \
      --arg model "$model" \
      --arg system "$system_prompt" \
      --arg user "$source_text" \
      --argjson max_tokens "$output_tokens" \
      '{
        model: $model,
        temperature: 0.2,
        max_tokens: $max_tokens,
        messages: [
          {role: "system", content: $system},
          {role: "user", content: $user}
        ]
      }')" \
    | jq -er '.choices[0].message.content'
}
```

Typical base URLs:

```text
OpenAI:     https://api.openai.com/v1
OpenRouter: https://openrouter.ai/api/v1
Gemini:     https://generativelanguage.googleapis.com/v1beta/openai
Ollama:     http://localhost:11434/v1
```

For new OpenAI-native implementations, prefer the provider's current Responses
API when it fits the application; keep the chat adapter when cross-provider
portability is the explicit goal. Gemini recommends its native SDK/API when
advanced Gemini features are needed. Ollama supports only documented portions
of OpenAI-compatible APIs.

## Anthropic Messages adapter

Anthropic uses a distinct Messages shape and requires an explicit output token
budget:

```bash
call_anthropic() {
  local model="$1"
  local system_prompt="$2"
  local source_text="$3"
  local output_tokens="$4"

  curl --fail-with-body --silent --show-error \
    "https://api.anthropic.com/v1/messages" \
    -H "x-api-key: ${ANTHROPIC_API_KEY}" \
    -H "anthropic-version: 2023-06-01" \
    -H "content-type: application/json" \
    -d "$(jq -n \
      --arg model "$model" \
      --arg system "$system_prompt" \
      --arg user "$source_text" \
      --argjson max_tokens "$output_tokens" \
      '{
        model: $model,
        temperature: 0.2,
        max_tokens: $max_tokens,
        system: $system,
        messages: [{role: "user", content: $user}]
      }')" \
    | jq -er '.content[] | select(.type == "text") | .text'
}
```

## Repository playground

The playground's provider registry is at
[`../playground/src/providers.ts`](../playground/src/providers.ts). Treat its
default model IDs as executable defaults that may need maintenance, not as
timeless recommendations. If the playground is the requested surface, update
and test that registry rather than maintaining a second hidden provider list.

## Primary documentation

- [OpenAI API](https://platform.openai.com/docs/api-reference)
- [Claude Messages API](https://platform.claude.com/docs/en/api/messages)
- [Gemini OpenAI compatibility](https://ai.google.dev/gemini-api/docs/openai)
- [OpenRouter API](https://openrouter.ai/docs/api-reference/overview)
- [Ollama OpenAI compatibility](https://docs.ollama.com/api/openai-compatibility)

## Backend failure checks

- Authentication failure: confirm the expected environment variable and the
  target account/project; do not print the key.
- Unknown model: list currently available models or inspect the configured
  registry instead of guessing a replacement.
- Context error: measure the real request, reserve output headroom, then use a
  larger-context model or map/reduce.
- Rate limit: honor retry metadata, cap retries, preserve completed map outputs,
  and resume; do not restart every chunk.
- Local model is slow: reduce chunk size/concurrency, choose a smaller suitable
  model, or use local map plus an approved hosted final reduce.
- Parameter rejected: compare the provider's native schema with the portable
  adapter; fields such as output-token limits differ across APIs.
