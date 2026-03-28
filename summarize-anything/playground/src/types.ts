export interface RunLog {
  id: string;
  timestamp: string;
  input: {
    text: string;
    source: "sample" | "custom";
    wordCount: number;
  };
  config: {
    format: string;
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
    focusDirective: string;
    customBaseUrl?: string;
  };
  prompt: {
    system: string;
    isModified: boolean;
    parentRunId?: string;
  };
  output: {
    content: string;
    durationMs: number;
  };
  feedback?: {
    text: string;
    proposedPrompt?: string;
    accepted: boolean;
  };
}

export interface RunSummary {
  id: string;
  timestamp: string;
  format: string;
  model: string;
}

export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  defaultModel: string;
  envVar: string;
  isOpenAICompatible: boolean;
}

export interface PromptTemplate {
  name: string;
  description: string;
  template: string;
}

export interface KeyStatus {
  [provider: string]: boolean | "unknown";
}

export interface DiffLine {
  type: "same" | "added" | "removed";
  text: string;
}
