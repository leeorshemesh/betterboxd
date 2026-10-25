import { getToken } from '@/services/session';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? (options.body !== undefined ? 'POST' : 'GET'),
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, `Can't reach the API at ${API_URL}. Start it with npm run server.`);
  }

  if (response.status === 204) return undefined as T;
  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new ApiError(response.status, payload.error ?? 'Request failed');
  }
  return payload as T;
}
