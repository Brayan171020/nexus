export interface ErrorResponse {
  timestamp: string;
  statusCode: number;
  message: string | string[];
  path: string;
}
