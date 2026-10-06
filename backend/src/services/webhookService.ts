import crypto from 'crypto';
import { supabase, isSupabaseConfigured } from '../config/supabase';

export interface WebhookEndpoint {
  id: string;
  org_id: string;
  url: string;
  secret: string;
  events: string[];
  status: 'ACTIVE' | 'DISABLED';
  created_at: string;
}

export interface WebhookEventRecord {
  id: string;
  org_id: string;
  event_type: string;
  payload: any;
  attempts: number;
  status: 'PENDING' | 'DELIVERED' | 'FAILED';
  response_status?: number;
  last_error?: string;
  created_at: string;
}

// In-memory fallback stores
const memoryEndpoints = new Map<string, WebhookEndpoint>();
const memoryEvents: WebhookEventRecord[] = [];

export const webhookService = {
  /**
   * Register a new webhook endpoint for an organization
   */
  async registerEndpoint(
    orgId: string,
    url: string,
    events: string[] = ['transfer.initiated', 'transfer.completed', 'transfer.rejected']
  ): Promise<WebhookEndpoint> {
    const id = crypto.randomUUID();
    const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;
    const now = new Date().toISOString();

    const endpoint: WebhookEndpoint = {
      id,
      org_id: orgId,
      url,
      secret,
      events,
      status: 'ACTIVE',
      created_at: now,
    };

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('webhook_endpoints').insert({
          id,
          org_id: orgId,
          url,
          secret,
          events,
          status: 'ACTIVE',
        });
        if (error) console.warn('[webhookService] DB insert notice:', error.message);
      } catch (err) {}
    }

    memoryEndpoints.set(id, endpoint);
    return endpoint;
  },

  /**
   * List webhook endpoints for an organization
   */
  async listEndpoints(orgId?: string): Promise<WebhookEndpoint[]> {
    if (isSupabaseConfigured() && orgId) {
      try {
        const { data, error } = await supabase
          .from('webhook_endpoints')
          .select('*')
          .eq('org_id', orgId);
        if (!error && data) return data;
      } catch (err) {}
    }

    const all = Array.from(memoryEndpoints.values());
    return orgId ? all.filter((e) => e.org_id === orgId) : all;
  },

  /**
   * Compute HMAC-SHA256 signature header for webhook payload
   */
  generateSignature(payload: any, secret: string, timestamp: number = Math.floor(Date.now() / 1000)): string {
    const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${serialized}`)
      .digest('hex');
    return `t=${timestamp},v1=${signature}`;
  },

  /**
   * Emit an event and deliver asynchronously to all subscribed active endpoints
   */
  async emitEvent(orgId: string, eventType: string, data: any): Promise<WebhookEventRecord> {
    const eventId = crypto.randomUUID();
    const now = new Date().toISOString();

    const eventRecord: WebhookEventRecord = {
      id: eventId,
      org_id: orgId,
      event_type: eventType,
      payload: data,
      attempts: 0,
      status: 'PENDING',
      created_at: now,
    };

    memoryEvents.unshift(eventRecord);

    // Find subscribed endpoints
    const endpoints = await this.listEndpoints(orgId);
    const activeSubscribers = endpoints.filter(
      (ep) => ep.status === 'ACTIVE' && (ep.events.includes(eventType) || ep.events.includes('*'))
    );

    // Deliver to subscribers with retry logic
    for (const ep of activeSubscribers) {
      this.deliverWithRetry(eventRecord, ep).catch((err) => {
        console.warn(`[webhookService] Delivery failed to ${ep.url}:`, err.message);
      });
    }

    return eventRecord;
  },

  /**
   * Deliver event with up to 3 exponential backoff attempts
   */
  async deliverWithRetry(event: WebhookEventRecord, endpoint: WebhookEndpoint, maxRetries: number = 3): Promise<void> {
    const timestamp = Math.floor(Date.now() / 1000);
    const signatureHeader = this.generateSignature(event.payload, endpoint.secret, timestamp);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      event.attempts = attempt;
      try {
        const response = await fetch(endpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-AgenticPay-Signature': signatureHeader,
            'X-AgenticPay-Event': event.event_type,
            'X-AgenticPay-Delivery': event.id,
          },
          body: JSON.stringify({
            id: event.id,
            type: event.event_type,
            createdAt: event.created_at,
            data: event.payload,
          }),
        });

        event.response_status = response.status;
        if (response.ok) {
          event.status = 'DELIVERED';
          return;
        }

        event.last_error = `HTTP ${response.status} ${response.statusText}`;
      } catch (err: any) {
        event.last_error = err.message;
      }

      // Exponential backoff wait before retry if not last attempt
      if (attempt < maxRetries) {
        const backoffMs = Math.min(100 * Math.pow(2, attempt - 1), 1000);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }

    event.status = 'FAILED';
  },

  /**
   * List event delivery logs
   */
  async listEvents(orgId?: string, limit: number = 50): Promise<WebhookEventRecord[]> {
    if (orgId) {
      return memoryEvents.filter((e) => e.org_id === orgId).slice(0, limit);
    }
    return memoryEvents.slice(0, limit);
  },
};
