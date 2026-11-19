import { getToken } from '@/services/session';

/** Empty string = same origin (one-host showcase). Default local API for Expo Go / `npm run web`. */
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL === undefined
    ? 'http://localhost:8787'
    : process.env.EXPO_PUBLIC_API_URL
).replace(/\/$/, '');

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
  /** When true, body is sent as FormData and Content-Type is left for the runtime. */
  formData?: boolean;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {};
  if (options.body !== undefined && !options.formData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? (options.body !== undefined ? 'POST' : 'GET'),
      headers,
      body:
        options.body === undefined
          ? undefined
          : options.formData
            ? (options.body as FormData)
            : JSON.stringify(options.body),
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

export function resolveMediaUrl(pathOrUrl?: string | null): string | undefined {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (pathOrUrl.startsWith('/')) return `${API_URL}${pathOrUrl}`;
  return pathOrUrl;
}
