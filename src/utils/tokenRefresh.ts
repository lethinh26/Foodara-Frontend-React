import { env } from '../config/env';

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await fetch(`${env.apiBaseUrl}/v1/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include', 
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const body = await response.json();

    if (body.code === 1000 && body.result?.accessToken) {
      return body.result.accessToken;
    }

    return null;
  } catch {
    return null;
  }
}
