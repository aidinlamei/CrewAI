export interface Tool {
  id: string;
  name: string;
  type: 'built-in' | 'langchain' | 'custom';
  category?: string;
  description?: string;
  python_code?: string;
  config?: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export interface ToolCreate {
  name: string;
  type: 'built-in' | 'langchain' | 'custom';
  category?: string;
  description?: string;
  python_code?: string;
  config?: Record<string, any>;
  is_active?: boolean;
}
