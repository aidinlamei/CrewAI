export interface PaginationParams {
  page: number;
  page_size: number;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  page_size: number;
  pages: number;
  items: T[];
}

export interface MessageResponse {
  message: string;
  success: boolean;
}

export interface ErrorResponse {
  error: string;
  detail?: string;
  success: boolean;
}
