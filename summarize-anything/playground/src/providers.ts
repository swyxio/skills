import type { ProviderConfig } from "./types";

export const PROVIDERS: Record<string, ProviderConfig> = {
  openai: {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4.1-mini",
    envVar: "OPENAI_API_KEY",
    isOpenAICompatible: true,
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    defaultModel: "claude-sonnet-4-20250514",
    envVar: "ANTHROPIC_API_KEY",
    isOpenAICompatible: false,
  },
  gemini: {
    id: "gemini",
    name: "Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-3.1-flash",
    envVar: "GEMINI_API_KEY",
    isOpenAICompatible: true,
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "google/gemini-3.1-flash",
    envVar: "OPENROUTER_API_KEY",
    isOpenAICompatible: true,
  },
  ollama: {
    id: "ollama",
    name: "Ollama (local)",
    baseUrl: "http://localhost:11434/v1",
    defaultModel: "llama3.1:8b",
    envVar: "",
    isOpenAICompatible: true,
  },
  custom: {
    id: "custom",
    name: "Custom",
    baseUrl: "",
    defaultModel: "",
    envVar: "CUSTOM_API_KEY",
    isOpenAICompatible: true,
  },
};
