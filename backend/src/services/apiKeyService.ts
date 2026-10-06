import crypto from 'crypto';
import { supabase, isSupabaseConfigured } from '../config/supabase';

export interface ApiKeyRecord {
  id: string;
  org_id: string;
  key_hash: string;
  key_prefix: string;
  status: 'ACTIVE' | 'REVOKED';
  created_at: string;
}

export interface OrganizationRecord {
  id: string;
  name: string;
  created_at: string;
}

// In-memory fallback cache for instant testing / dev fallback
const memoryApiKeys = new Map<string, ApiKeyRecord>();
const memoryOrganizations = new Map<string, OrganizationRecord>();

export const apiKeyService = {
  /**
   * Hash a raw API key using SHA-256
   */
  hashKey(rawKey: string): string {
    return crypto.createHash('sha256').update(rawKey).digest('hex');
  },

  /**
   * Create or retrieve an organization
   */
  async getOrCreateOrganization(name: string): Promise<OrganizationRecord> {
    if (isSupabaseConfigured()) {
      try {
        const { data: existing, error: findErr } = await supabase
          .from('organizations')
          .select('*')
          .eq('name', name)
          .maybeSingle();

        if (!findErr && existing) {
          return existing;
        }

        const orgId = crypto.randomUUID();
        const { data: created, error: insertErr } = await supabase
          .from('organizations')
          .insert({ id: orgId, name })
          .select()
          .maybeSingle();

        if (!insertErr && created) {
          return created;
        }
      } catch (err) {
        console.warn('[apiKeyService] Supabase organizations table notice:', err);
      }
    }

    // Memory fallback
    for (const org of memoryOrganizations.values()) {
      if (org.name === name) return org;
    }
    const newOrg: OrganizationRecord = {
      id: crypto.randomUUID(),
      name,
      created_at: new Date().toISOString(),
    };
    memoryOrganizations.set(newOrg.id, newOrg);
    return newOrg;
  },

  /**
   * Generate a new tenant API key in `ag_live_...` format.
   * Stores the SHA-256 hash and prefix.
   * Returns the plaintext key ONCE.
   */
  async generateApiKey(orgId: string, name?: string): Promise<{ apiKey: string; keyPrefix: string; orgId: string; id: string }> {
    const rawEntropy = crypto.randomBytes(24).toString('hex');
    const rawKey = `ag_live_${rawEntropy}`;
    const keyPrefix = rawKey.slice(0, 16);
    const keyHash = this.hashKey(rawKey);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const record: ApiKeyRecord = {
      id,
      org_id: orgId,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      status: 'ACTIVE',
      created_at: now,
    };

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('api_keys').insert({
          id,
          org_id: orgId,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          status: 'ACTIVE',
        });
        if (error) {
          console.warn('[apiKeyService] Notice writing to api_keys table:', error.message);
        }
      } catch (err) {
        console.warn('[apiKeyService] Failed to insert into api_keys table:', err);
      }
    }

    // Save in memory cache as well
    memoryApiKeys.set(keyHash, record);

    return {
      apiKey: rawKey,
      keyPrefix,
      orgId,
      id,
    };
  },

  /**
   * Validate raw API key against active records in database or memory
   */
  async validateApiKey(rawKey: string): Promise<{ valid: boolean; orgId?: string; keyId?: string }> {
    if (!rawKey || !rawKey.startsWith('ag_live_')) {
      return { valid: false };
    }

    const keyHash = this.hashKey(rawKey);

    // 1. Check Supabase api_keys table
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('api_keys')
          .select('id, org_id, status')
          .eq('key_hash', keyHash)
          .eq('status', 'ACTIVE')
          .maybeSingle();

        if (!error && data) {
          return {
            valid: true,
            orgId: data.org_id,
            keyId: data.id,
          };
        }
      } catch (err) {
        // Fall through to memory cache
      }
    }

    // 2. Check memory cache fallback
    const memRecord = memoryApiKeys.get(keyHash);
    if (memRecord && memRecord.status === 'ACTIVE') {
      return {
        valid: true,
        orgId: memRecord.org_id,
        keyId: memRecord.id,
      };
    }

    return { valid: false };
  },
};
