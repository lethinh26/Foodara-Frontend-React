import { env } from '../config/env';

export async function refreshAccessToken(): Promise<string | null> {
  try {
    console.log('Attempting to refresh access token...');
    const response = await fetch(`${env.apiBaseUrl}/v1/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include', 
      headers: {
       
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log('❌ Refresh token failed:', response.status, response.statusText);
      return null;
    }

    const body = await response.json();

    // { code: 1000, message: "...", result: { accessToken, tokenType, expiresIn } }
    if (body.code === 1000 && body.result?.accessToken) {
      console.log('✅ Refresh token successful');
      return body.result.accessToken;
    }

    console.log('❌ Refresh token response invalid:', body);
    return null;
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    return null;
  }
}
