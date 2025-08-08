/**
 * WebSocket Real-Time Manager - Major Performance Improvement #5
 * Provides real-time data synchronization with intelligent fallback strategies
 * Integrates with existing caching and deduplication systems for optimal performance
 */

import { JsonPlaceholderClient } from './client';
import { Post, User, Comment } from './types';

export interface WebSocketConfig {
  enabled: boolean;
  url?: string;
  autoReconnect: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  messageQueueSize: number;
  fallbackToPolling: boolean;
  pollingInterval: number;
  enableCompression: boolean;
  protocols?: string[];
}

export interface RealtimeEvent<T = any> {
  type: string;
  data: T;
  timestamp: number;
  id: string;
  source: 'websocket' | 'polling' | 'cache';
}

export interface RealtimeSubscription {
  id: string;
  channel: string;
  callback: (event: RealtimeEvent) => void;
  filter?: (data: any) => boolean;
  active: boolean;
  timestamp: number;
}

export interface RealtimeStats {
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  messagesReceived: number;
  messagesSent: number;
  reconnectAttempts: number;
  averageLatency: number;
  subscriptionsActive: number;
  uptime: number;
  fallbackMode: boolean;
  lastHeartbeat: number;
}

export interface ConnectionState {
  status: 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';
  connectedAt?: number;
  lastError?: Error;
  reconnectAttempts: number;
  latency: number;
}

export interface QueuedMessage {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retries: number;
}

/**
 * Advanced WebSocket manager with intelligent fallback and performance optimization
 */
export class WebSocketRealtimeManager {
  private client: JsonPlaceholderClient;
  private config: WebSocketConfig = {
    enabled: true,
    autoReconnect: true,
    reconnectInterval: 1000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000,
    messageQueueSize: 100,
    fallbackToPolling: true,
    pollingInterval: 5000,
    enableCompression: true,
    protocols: ['jsonplaceholder-realtime']
  };

  private websocket: WebSocket | null = null;
  private subscriptions = new Map<string, RealtimeSubscription>();
  private messageQueue: QueuedMessage[] = [];
  private connectionState: ConnectionState = {
    status: 'idle',
    reconnectAttempts: 0,
    latency: 0
  };

  private stats: RealtimeStats = {
    connectionStatus: 'disconnected',
    messagesReceived: 0,
    messagesSent: 0,
    reconnectAttempts: 0,
    averageLatency: 0,
    subscriptionsActive: 0,
    uptime: 0,
    fallbackMode: false,
    lastHeartbeat: 0
  };

  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pollingTimer: NodeJS.Timeout | null = null;
  private eventListeners = new Map<string, ((event: RealtimeEvent) => void)[]>();

  constructor(client: JsonPlaceholderClient, config?: Partial<WebSocketConfig>) {
    this.client = client;
    if (config) {
      this.config = { ...this.config, ...config };
    }

    if (this.config.enabled) {
      this.initialize();
    }
  }

  /**
   * Initialize WebSocket connection
   */
  private async initialize(): Promise<void> {
    if (!this.config.url) {
      // For JSONPlaceholder, we'll simulate a WebSocket URL
      this.config.url = 'ws://localhost:3001/realtime';
    }

    await this.connect();
  }

  /**
   * Establish WebSocket connection with retry logic
   */
  async connect(): Promise<void> {
    if (this.connectionState.status === 'connecting' || this.connectionState.status === 'connected') {
      return;
    }

    this.connectionState.status = 'connecting';
    this.stats.connectionStatus = 'connecting';

    try {
      await this.createWebSocketConnection();
    } catch (error) {
      console.warn('WebSocket connection failed, falling back to polling:', error);
      this.handleConnectionError(error as Error);
    }
  }

  /**
   * Create and configure WebSocket connection
   */
  private async createWebSocketConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.websocket = new WebSocket(this.config.url!, this.config.protocols);

        // Connection opened
        this.websocket.onopen = () => {
          this.connectionState.status = 'connected';
          this.connectionState.connectedAt = Date.now();
          this.connectionState.reconnectAttempts = 0;
          this.stats.connectionStatus = 'connected';
          this.stats.fallbackMode = false;

          this.startHeartbeat();
          this.processQueuedMessages();
          this.emit('connection:open', { status: 'connected' });
          
          resolve();
        };

        // Message received
        this.websocket.onmessage = (event) => {
          this.handleMessage(event);
        };

        // Connection closed
        this.websocket.onclose = (event) => {
          this.handleDisconnection(event);
        };

        // Connection error
        this.websocket.onerror = (error) => {
          this.handleConnectionError(new Error('WebSocket error'));
          reject(error);
        };

        // Timeout for connection
        setTimeout(() => {
          if (this.connectionState.status === 'connecting') {
            this.websocket?.close();
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      this.stats.messagesReceived++;

      // Handle different message types
      switch (message.type) {
        case 'heartbeat':
          this.handleHeartbeat(message);
          break;
        case 'data_update':
          this.handleDataUpdate(message);
          break;
        case 'subscription_ack':
          this.handleSubscriptionAck(message);
          break;
        case 'error':
          this.handleServerError(message);
          break;
        default:
          this.handleCustomMessage(message);
      }

    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Handle heartbeat messages for latency tracking
   */
  private handleHeartbeat(message: any): void {
    if (message.timestamp) {
      const latency = Date.now() - message.timestamp;
      this.connectionState.latency = latency;
      this.stats.averageLatency = this.stats.averageLatency * 0.8 + latency * 0.2;
      this.stats.lastHeartbeat = Date.now();
    }
  }

  /**
   * Handle real-time data updates
   */
  private handleDataUpdate(message: any): void {
    const event: RealtimeEvent = {
      type: message.dataType || 'update',
      data: message.data,
      timestamp: message.timestamp || Date.now(),
      id: message.id || this.generateEventId(),
      source: 'websocket'
    };

    // Notify subscribers
    this.notifySubscribers(event);

    // Update cache if applicable
    this.updateCacheFromRealtime(event);

    // Emit global event
    this.emit('data:update', event);
  }

  /**
   * Update cache with real-time data
   */
  private updateCacheFromRealtime(event: RealtimeEvent): void {
    // Integration with existing cache system
    const cacheKey = this.getCacheKeyFromEvent(event);
    if (cacheKey) {
      // Update cache with fresh data if client has cache capability
      try {
        (this.client as any).updateCache?.(cacheKey, event.data);
  } catch {
        // Cache update failed, continue without error
      }
    }
  }

  /**
   * Get cache key from event for cache integration
   */
  private getCacheKeyFromEvent(event: RealtimeEvent): string | null {
    switch (event.type) {
      case 'post_update':
        return `post-${event.data.id}`;
      case 'user_update':
        return `user-${event.data.id}`;
      case 'comment_update':
        return `comments-${event.data.postId}`;
      case 'posts_update':
        return 'posts-all';
      default:
        return null;
    }
  }

  /**
   * Subscribe to real-time updates for specific data
   */
  subscribe(channel: string, callback: (event: RealtimeEvent) => void, filter?: (data: any) => boolean): string {
    const subscriptionId = this.generateSubscriptionId();
    
    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel,
      callback,
      filter,
      active: true,
      timestamp: Date.now()
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.stats.subscriptionsActive = this.subscriptions.size;

    // Send subscription request to server
    this.sendMessage({
      type: 'subscribe',
      channel,
      subscriptionId
    });

    return subscriptionId;
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.active = false;
      this.subscriptions.delete(subscriptionId);
      this.stats.subscriptionsActive = this.subscriptions.size;

      // Send unsubscribe request to server
      this.sendMessage({
        type: 'unsubscribe',
        subscriptionId
      });
    }
  }

  /**
   * Subscribe to specific post updates
   */
  subscribeToPost(postId: number, callback: (post: Post) => void): string {
    return this.subscribe(`post:${postId}`, (event) => {
      if (event.type === 'post_update' && event.data.id === postId) {
        callback(event.data);
      }
    });
  }

  /**
   * Subscribe to user updates
   */
  subscribeToUser(userId: number, callback: (user: User) => void): string {
    return this.subscribe(`user:${userId}`, (event) => {
      if (event.type === 'user_update' && event.data.id === userId) {
        callback(event.data);
      }
    });
  }

  /**
   * Subscribe to comment updates for a post
   */
  subscribeToComments(postId: number, callback: (comments: Comment[]) => void): string {
    return this.subscribe(`comments:${postId}`, (event) => {
      if (event.type === 'comment_update' && event.data.postId === postId) {
        callback(event.data.comments || [event.data]);
      }
    });
  }

  /**
   * Subscribe to all posts updates
   */
  subscribeToAllPosts(callback: (posts: Post[]) => void): string {
    return this.subscribe('posts:all', (event) => {
      if (event.type === 'posts_update') {
        callback(event.data);
      }
    });
  }

  /**
   * Send message through WebSocket or queue if disconnected
   */
  private sendMessage(message: any): void {
    const queuedMessage: QueuedMessage = {
      id: this.generateMessageId(),
      type: message.type,
      data: message,
      timestamp: Date.now(),
      retries: 0
    };

    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      try {
        this.websocket.send(JSON.stringify(message));
        this.stats.messagesSent++;
  } catch {
        this.queueMessage(queuedMessage);
      }
    } else {
      this.queueMessage(queuedMessage);
    }
  }

  /**
   * Queue message for later delivery
   */
  private queueMessage(message: QueuedMessage): void {
    if (this.messageQueue.length >= this.config.messageQueueSize) {
      this.messageQueue.shift(); // Remove oldest message
    }
    this.messageQueue.push(message);
  }

  /**
   * Process queued messages when connection is restored
   */
  private processQueuedMessages(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      if (message.retries < 3) {
        this.sendMessage(message.data);
        message.retries++;
      }
    }
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.sendMessage({
          type: 'heartbeat',
          timestamp: Date.now()
        });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Handle connection errors with fallback strategies
   */
  private handleConnectionError(error: Error): void {
    this.connectionState.status = 'error';
    this.connectionState.lastError = error;
    this.stats.connectionStatus = 'error';

    console.error('WebSocket connection error:', error);

    if (this.config.fallbackToPolling) {
      this.startPollingFallback();
    }

    if (this.config.autoReconnect) {
      this.scheduleReconnect();
    }

    this.emit('connection:error', { error, fallbackActive: this.config.fallbackToPolling });
  }

  /**
   * Handle disconnection with reconnection logic
   */
  private handleDisconnection(event: CloseEvent): void {
    this.connectionState.status = 'disconnected';
    this.stats.connectionStatus = 'disconnected';

    this.stopHeartbeat();

    if (this.config.autoReconnect && event.code !== 1000) { // 1000 = normal closure
      this.scheduleReconnect();
    }

    if (this.config.fallbackToPolling) {
      this.startPollingFallback();
    }

    this.emit('connection:close', { code: event.code, reason: event.reason });
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.connectionState.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.connectionState.reconnectAttempts),
      30000 // Max 30 seconds
    );

    this.reconnectTimer = setTimeout(() => {
      this.connectionState.reconnectAttempts++;
      this.stats.reconnectAttempts++;
      this.connectionState.status = 'reconnecting';
      this.connect();
    }, delay);
  }

  /**
   * Start polling fallback when WebSocket fails
   */
  private startPollingFallback(): void {
    if (this.pollingTimer) {
      return; // Already polling
    }

    this.stats.fallbackMode = true;
    console.log('Starting polling fallback');

    this.pollingTimer = setInterval(async () => {
      try {
        // Poll for updates from each active subscription
        for (const subscription of this.subscriptions.values()) {
          if (subscription.active) {
            await this.pollForUpdates(subscription);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, this.config.pollingInterval);
  }

  /**
   * Poll for updates for a specific subscription
   */
  private async pollForUpdates(subscription: RealtimeSubscription): Promise<void> {
    try {
      let data: any;
      
      // Determine what to poll based on channel
      if (subscription.channel.startsWith('post:')) {
        const postId = parseInt(subscription.channel.split(':')[1]);
        data = await this.client.getPost(postId);
      } else if (subscription.channel.startsWith('user:')) {
        const userId = parseInt(subscription.channel.split(':')[1]);
        data = await this.client.getUser(userId);
      } else if (subscription.channel.startsWith('comments:')) {
        const postId = parseInt(subscription.channel.split(':')[1]);
        data = await this.client.getComments(postId);
      } else if (subscription.channel === 'posts:all') {
        data = await this.client.getPosts();
      }

      if (data) {
        const event: RealtimeEvent = {
          type: 'polling_update',
          data,
          timestamp: Date.now(),
          id: this.generateEventId(),
          source: 'polling'
        };

        // Apply filter if present
        if (!subscription.filter || subscription.filter(data)) {
          subscription.callback(event);
        }
      }
    } catch (error) {
      console.error('Failed to poll for updates:', error);
    }
  }

  /**
   * Stop polling fallback
   */
  private stopPollingFallback(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
      this.stats.fallbackMode = false;
    }
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Notify subscribers of events
   */
  private notifySubscribers(event: RealtimeEvent): void {
    for (const subscription of this.subscriptions.values()) {
      if (subscription.active) {
        // Check if event matches subscription channel
        if (this.eventMatchesSubscription(event, subscription)) {
          // Apply filter if present
          if (!subscription.filter || subscription.filter(event.data)) {
            try {
              subscription.callback(event);
            } catch (error) {
              console.error('Error in subscription callback:', error);
            }
          }
        }
      }
    }
  }

  /**
   * Check if event matches subscription
   */
  private eventMatchesSubscription(event: RealtimeEvent, subscription: RealtimeSubscription): boolean {
    // Simple channel matching logic
    const eventChannel = this.getChannelFromEvent(event);
    return eventChannel === subscription.channel || subscription.channel === '*';
  }

  /**
   * Get channel from event
   */
  private getChannelFromEvent(event: RealtimeEvent): string {
    switch (event.type) {
      case 'post_update':
        return `post:${event.data.id}`;
      case 'user_update':
        return `user:${event.data.id}`;
      case 'comment_update':
        return `comments:${event.data.postId}`;
      case 'posts_update':
        return 'posts:all';
      default:
        return event.type;
    }
  }

  /**
   * Emit global events
   */
  private emit(eventType: string, data: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener({ type: eventType, data, timestamp: Date.now(), id: this.generateEventId(), source: 'websocket' });
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  /**
   * Add event listener
   */
  on(eventType: string, callback: (event: RealtimeEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(eventType: string, callback: (event: RealtimeEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Handle server errors
   */
  private handleServerError(message: any): void {
    console.error('Server error:', message.error);
    this.emit('server:error', message);
  }

  /**
   * Handle subscription acknowledgment
   */
  private handleSubscriptionAck(message: any): void {
    console.log('Subscription acknowledged:', message.subscriptionId);
  }

  /**
   * Handle custom messages
   */
  private handleCustomMessage(message: any): void {
    this.emit('message:custom', message);
  }

  /**
   * Generate unique IDs
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get real-time statistics
   */
  getStats(): RealtimeStats {
    return {
      ...this.stats,
      uptime: this.connectionState.connectedAt ? Date.now() - this.connectionState.connectedAt : 0
    };
  }

  /**
   * Get connection state
   */
  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.websocket) {
      this.websocket.close(1000, 'Client disconnect');
    }
    this.stopHeartbeat();
    this.stopPollingFallback();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<WebSocketConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.disconnect();
    this.subscriptions.clear();
    this.messageQueue = [];
    this.eventListeners.clear();
  }
}

/**
 * Enhanced client with real-time WebSocket support
 */
export class RealtimeJsonPlaceholderClient extends JsonPlaceholderClient {
  private realtimeManager: WebSocketRealtimeManager;

  constructor(baseURL?: string, config?: unknown, realtimeConfig?: Partial<WebSocketConfig>) {
    super(baseURL, config as any);
    this.realtimeManager = new WebSocketRealtimeManager(this, realtimeConfig);
  }

  /**
   * Subscribe to real-time post updates
   */
  subscribeToPost(postId: number, callback: (post: Post) => void): string {
    return this.realtimeManager.subscribeToPost(postId, callback);
  }

  /**
   * Subscribe to real-time user updates
   */
  subscribeToUser(userId: number, callback: (user: User) => void): string {
    return this.realtimeManager.subscribeToUser(userId, callback);
  }

  /**
   * Subscribe to real-time comment updates
   */
  subscribeToComments(postId: number, callback: (comments: Comment[]) => void): string {
    return this.realtimeManager.subscribeToComments(postId, callback);
  }

  /**
   * Subscribe to all posts updates
   */
  subscribeToAllPosts(callback: (posts: Post[]) => void): string {
    return this.realtimeManager.subscribeToAllPosts(callback);
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribe(subscriptionId: string): void {
    this.realtimeManager.unsubscribe(subscriptionId);
  }

  /**
   * Get real-time statistics
   */
  getRealtimeStats(): RealtimeStats {
    return this.realtimeManager.getStats();
  }

  /**
   * Get WebSocket connection state
   */
  getConnectionState(): ConnectionState {
    return this.realtimeManager.getConnectionState();
  }

  /**
   * Listen for connection events
   */
  onConnectionChange(callback: (event: RealtimeEvent) => void): void {
    this.realtimeManager.on('connection:open', callback);
    this.realtimeManager.on('connection:close', callback);
    this.realtimeManager.on('connection:error', callback);
  }

  /**
   * Configure real-time behavior
   */
  configureRealtime(config: Partial<WebSocketConfig>): void {
    this.realtimeManager.updateConfig(config);
  }

  /**
   * Disconnect real-time connection
   */
  disconnectRealtime(): void {
    this.realtimeManager.disconnect();
  }

  /**
   * Clean up real-time resources
   */
  destroy(): void {
    this.realtimeManager.destroy();
  }
}

/**
 * Factory for creating real-time optimized clients
 */
export class RealtimeFactory {
  /**
   * Create client optimized for real-time dashboards
   */
  static createDashboardClient(baseURL?: string): RealtimeJsonPlaceholderClient {
    return new RealtimeJsonPlaceholderClient(baseURL, {}, {
      enabled: true,
      autoReconnect: true,
      reconnectInterval: 1000,
      heartbeatInterval: 15000, // Faster heartbeat for dashboards
      fallbackToPolling: true,
      pollingInterval: 3000, // Faster polling
      enableCompression: true
    });
  }

  /**
   * Create client optimized for collaborative editing
   */
  static createCollaborativeClient(baseURL?: string): RealtimeJsonPlaceholderClient {
    return new RealtimeJsonPlaceholderClient(baseURL, {}, {
      enabled: true,
      autoReconnect: true,
      reconnectInterval: 500,
      heartbeatInterval: 10000,
      fallbackToPolling: true,
      pollingInterval: 1000, // Very fast polling for collaboration
      enableCompression: true,
      messageQueueSize: 200 // Larger queue for collaborative edits
    });
  }

  /**
   * Create client optimized for mobile applications
   */
  static createMobileClient(baseURL?: string): RealtimeJsonPlaceholderClient {
    return new RealtimeJsonPlaceholderClient(baseURL, {}, {
      enabled: true,
      autoReconnect: true,
      reconnectInterval: 2000,
      heartbeatInterval: 45000, // Longer heartbeat to save battery
      fallbackToPolling: true,
      pollingInterval: 10000, // Slower polling for battery life
      enableCompression: true,
      maxReconnectAttempts: 10 // More attempts for unstable mobile connections
    });
  }
}
