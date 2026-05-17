import { useEffect, useRef, useState } from 'react';
import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import { env } from '../config/env';

interface WebSocketHookProps<T = unknown> {
  topic?: string;
  onMessage?: (message: T) => void;
  autoConnect?: boolean;
}

/**
 * Translate the configured HTTP {@code apiBaseUrl} (http://host:8080/api) into the
 * matching WebSocket URL (ws://host:8080/api/ws/connect). Keeps the {@code /api}
 * context-path so the request hits the backend's STOMP endpoint through the
 * Spring Cloud Gateway. Falls back to localhost so dev environments without
 * {@code VITE_API_BASE_URL} still work.
 */
function buildWsUrl(): string {
  const base = env.apiBaseUrl;
  if (!base) return 'ws://localhost:8080/api/ws/connect';

  try {
    const url = new URL(base);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    // Preserve the path prefix from VITE_API_BASE_URL so /api context-path is honoured.
    const prefix = url.pathname.replace(/\/+$/, '');
    return `${protocol}//${url.host}${prefix}/ws/connect`;
  } catch {
    return 'ws://localhost:8080/api/ws/connect';
  }
}

export function useWebSocket<T = unknown>({
  topic,
  onMessage,
  autoConnect = true,
}: WebSocketHookProps<T> = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);
  const onMessageRef = useRef(onMessage);

  // Keep the latest callback reference so we don't reconnect when the parent re-renders.
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!autoConnect) return;

    const client = new Client({
      brokerURL: buildWsUrl(),
      // Auth flows through the HttpOnly `accessToken` cookie at handshake time,
      // so no Authorization header is needed.
      debug: () => undefined,
      reconnectDelay: 5000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
    });

    client.onConnect = () => {
      setIsConnected(true);

      if (topic) {
        subscriptionRef.current = client.subscribe(topic, (message: IMessage) => {
          if (!message.body) return;
          try {
            onMessageRef.current?.(JSON.parse(message.body) as T);
          } catch {
            onMessageRef.current?.(message.body as unknown as T);
          }
        });
      }
    };

    client.onStompError = (frame) => {
      console.error('[WebSocket] Broker error:', frame.headers['message'], frame.body);
    };

    client.onWebSocketClose = () => {
      setIsConnected(false);
    };

    client.activate();
    clientRef.current = client;

    return () => {
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
      client.deactivate();
      clientRef.current = null;
    };
  }, [topic, autoConnect]);

  const subscribe = (newTopic: string, callback: (message: T) => void) => {
    if (!clientRef.current?.connected) {
      console.warn('[WebSocket] Cannot subscribe, not connected');
      return null;
    }

    subscriptionRef.current?.unsubscribe();

    const sub = clientRef.current.subscribe(newTopic, (message: IMessage) => {
      if (!message.body) return;
      try {
        callback(JSON.parse(message.body) as T);
      } catch {
        callback(message.body as unknown as T);
      }
    });
    subscriptionRef.current = sub;
    return sub;
  };

  const publish = (destination: string, body: unknown) => {
    if (!clientRef.current?.connected) {
      console.warn('[WebSocket] Cannot publish, not connected');
      return;
    }
    clientRef.current.publish({
      destination,
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  };

  return { isConnected, subscribe, publish };
}
