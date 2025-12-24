export interface Agent {
  id: string;
  project_id: string;
  name: string;
  role: string;
  goal: string;
  backstory?: string;
  llm_provider_id?: string;
  llm_model?: string;
  temperature: number;
  max_tokens?: number;
  config?: Record<string, any>;
  created_at: string;
}

export interface AgentCreate {
  project_id: string;
  name: string;
  role: string;
  goal: string;
  backstory?: string;
  llm_provider_id?: string;
  llm_model?: string;
  temperature?: number;
  max_tokens?: number;
  config?: Record<string, any>;
}

export interface AgentUpdate {
  name?: string;
  role?: string;
  goal?: string;
  backstory?: string;
  llm_provider_id?: string;
  llm_model?: string;
  temperature?: number;
  max_tokens?: number;
  config?: Record<string, any>;
}
