export interface LLMProvider {
  id: string;
  name: string;
  display_name?: string;
  api_base_url?: string;
  available_models: string[];
  default_model?: string;
  config: Record<string, any>;
  is_active: boolean;
  last_tested_at?: string;
  created_at: string;
  has_api_key: boolean;
}

export interface LLMProviderCreate {
  name: string;
  display_name?: string;
  api_key?: string;
  api_base_url?: string;
  available_models?: string[];
  default_model?: string;
  config?: Record<string, any>;
  is_active?: boolean;
}
