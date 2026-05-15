import { useEffect, useRef, useState } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { env } from '../config/env';

interface WebSocketHookProps {
  topic?: string;
  onMessage?: (message: any) => void;
  autoConnect?: boolean;
}

export const useWebSocket = ({ topic, onMessage, autoConnect = true }: WebSocketHookProps = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);

  useEffect(() => {
    if (!autoConnect) return;

    const token = localStorage.getItem('token');
    
    // In mock mode, we don't connect to real websocket
    if (env.isMockMode) {
      console.log('[WebSocket] Mock mode enabled, skipping connection');
      return;
    }

    const client = new Client({
      brokerURL: 'ws://localhost:8080/ws/connect', // Gateway URL
      connectHeaders: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      debug: (str) => {
        if (!env.isProduction) {
          console.log('[STOMP]:', str);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      setIsConnected(true);
      console.log('[WebSocket] Connected');

      // If topic is provided on init, subscribe immediately
      if (topic && onMessage) {
        subscriptionRef.current = client.subscribe(topic, (message: IMessage) => {
          if (message.body) {
            try {
              const parsedBody = JSON.parse(message.body);
              onMessage(parsedBody);
            } catch (e) {
              onMessage(message.body);
            }
          }
        });
      }
    };

    client.onStompError = (frame) => {
      console.error('[WebSocket] Broker reported error: ' + frame.headers['message']);
      console.error('[WebSocket] Additional details: ' + frame.body);
    };

    client.onWebSocketClose = () => {
      setIsConnected(false);
      console.log('[WebSocket] Disconnected');
    };

    client.activate();
    clientRef.current = client;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      client.deactivate();
    };
  }, [topic, autoConnect]); // Removed onMessage from deps to avoid reconnecting on every render if callback changes

  const subscribe = (newTopic: string, callback: (message: any) => void) => {
    if (!clientRef.current || !clientRef.current.connected) {
      console.warn('[WebSocket] Cannot subscribe, not connected');
      return null;
    }

    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    const sub = clientRef.current.subscribe(newTopic, (message: IMessage) => {
      if (message.body) {
        try {
          const parsedBody = JSON.parse(message.body);
          callback(parsedBody);
        } catch (e) {
          callback(message.body);
        }
      }
    });

    subscriptionRef.current = sub;
    return sub;
  };

  const publish = (destination: string, body: any) => {
    if (clientRef.current && clientRef.current.connected) {
      clientRef.current.publish({
        destination,
        body: typeof body === 'string' ? body : JSON.stringify(body),
      });
    } else {
      console.warn('[WebSocket] Cannot publish, not connected');
    }
  };

  return { isConnected, subscribe, publish };
};
