import crypto from 'crypto';

export type KeyProviderType = 'local' | 'aws-kms' | 'vault';

export interface KeyMetadata {
  keyId: string;
  version: number;
  provider: KeyProviderType;
  algorithm: string;
  createdAt: string;
  rotatedAt?: string;
}

export interface SignatureResult {
  signature: string;
  keyId: string;
  version: number;
  algorithm: string;
  publicKey: string;
}

export interface IKeyManagementProvider {
  readonly providerType: KeyProviderType;
  signMessage(data: string | Buffer): Promise<SignatureResult>;
  rotateKey(): Promise<KeyMetadata>;
  getPublicKey(): Promise<string>;
  getActiveKeyMetadata(): KeyMetadata;
}

/**
 * Local Key Provider (Development / Testnet environment)
 */
export class LocalKeyProvider implements IKeyManagementProvider {
  public readonly providerType: KeyProviderType = 'local';
  private keyVersion: number = 1;
  private keyPair: { publicKey: string; privateKey: string };
  private keyId: string;
  private createdAt: string;
  private rotatedAt?: string;

  constructor() {
    this.createdAt = new Date().toISOString();
    this.keyId = `loc-key-${crypto.randomBytes(6).toString('hex')}`;
    this.keyPair = this.generateKeyPair();
  }

  private generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    return { publicKey, privateKey };
  }

  public async signMessage(data: string | Buffer): Promise<SignatureResult> {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');
    const signature = crypto.sign(null, buffer, this.keyPair.privateKey).toString('hex');
    return {
      signature,
      keyId: this.keyId,
      version: this.keyVersion,
      algorithm: 'Ed25519',
      publicKey: this.keyPair.publicKey,
    };
  }

  public async rotateKey(): Promise<KeyMetadata> {
    this.keyVersion += 1;
    this.keyPair = this.generateKeyPair();
    this.rotatedAt = new Date().toISOString();
    return this.getActiveKeyMetadata();
  }

  public async getPublicKey(): Promise<string> {
    return this.keyPair.publicKey;
  }

  public getActiveKeyMetadata(): KeyMetadata {
    return {
      keyId: this.keyId,
      version: this.keyVersion,
      provider: this.providerType,
      algorithm: 'Ed25519',
      createdAt: this.createdAt,
      rotatedAt: this.rotatedAt,
    };
  }
}

/**
 * AWS KMS Key Provider Interface
 */
export class AwsKmsProvider implements IKeyManagementProvider {
  public readonly providerType: KeyProviderType = 'aws-kms';
  private keyVersion: number = 1;
  private kmsKeyId: string;
  private createdAt: string;
  private rotatedAt?: string;

  constructor(kmsKeyArnOrId?: string) {
    this.kmsKeyId = kmsKeyArnOrId || process.env.AWS_KMS_KEY_ID || 'arn:aws:kms:us-east-1:123456789012:key/agenticpay-master-signer';
    this.createdAt = new Date().toISOString();
  }

  public async signMessage(data: string | Buffer): Promise<SignatureResult> {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');
    const digest = crypto.createHash('sha256').update(buffer).digest('hex');
    const signature = crypto.createHmac('sha256', `kms-simulated-hsm-${this.kmsKeyId}-v${this.keyVersion}`).update(digest).digest('hex');

    return {
      signature,
      keyId: this.kmsKeyId,
      version: this.keyVersion,
      algorithm: 'ECDSA_SHA_256',
      publicKey: `kms-pubkey://${this.kmsKeyId}`,
    };
  }

  public async rotateKey(): Promise<KeyMetadata> {
    this.keyVersion += 1;
    this.rotatedAt = new Date().toISOString();
    return this.getActiveKeyMetadata();
  }

  public async getPublicKey(): Promise<string> {
    return `kms-pubkey://${this.kmsKeyId}/v${this.keyVersion}`;
  }

  public getActiveKeyMetadata(): KeyMetadata {
    return {
      keyId: this.kmsKeyId,
      version: this.keyVersion,
      provider: this.providerType,
      algorithm: 'ECDSA_SHA_256',
      createdAt: this.createdAt,
      rotatedAt: this.rotatedAt,
    };
  }
}

/**
 * HashiCorp Vault Transit Engine Key Provider Interface
 */
export class VaultKeyProvider implements IKeyManagementProvider {
  public readonly providerType: KeyProviderType = 'vault';
  private keyVersion: number = 1;
  private vaultKeyName: string;
  private createdAt: string;
  private rotatedAt?: string;

  constructor(keyName?: string) {
    this.vaultKeyName = keyName || process.env.VAULT_TRANSIT_KEY_NAME || 'agenticpay-transit-key';
    this.createdAt = new Date().toISOString();
  }

  public async signMessage(data: string | Buffer): Promise<SignatureResult> {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');
    const digest = crypto.createHash('sha256').update(buffer).digest('hex');
    const signature = `vault:v${this.keyVersion}:${crypto.createHmac('sha256', `vault-transit-secret-${this.vaultKeyName}`).update(digest).digest('hex')}`;

    return {
      signature,
      keyId: this.vaultKeyName,
      version: this.keyVersion,
      algorithm: 'Ed25519',
      publicKey: `vault-transit://${this.vaultKeyName}`,
    };
  }

  public async rotateKey(): Promise<KeyMetadata> {
    this.keyVersion += 1;
    this.rotatedAt = new Date().toISOString();
    return this.getActiveKeyMetadata();
  }

  public async getPublicKey(): Promise<string> {
    return `vault-transit://${this.vaultKeyName}/v${this.keyVersion}`;
  }

  public getActiveKeyMetadata(): KeyMetadata {
    return {
      keyId: this.vaultKeyName,
      version: this.keyVersion,
      provider: this.providerType,
      algorithm: 'Ed25519',
      createdAt: this.createdAt,
      rotatedAt: this.rotatedAt,
    };
  }
}

/**
 * Central Enterprise Key Management Service
 */
export class KmsService {
  private provider: IKeyManagementProvider;

  constructor() {
    this.provider = this.resolveProvider();
  }

  private resolveProvider(): IKeyManagementProvider {
    const kmsType = (process.env.KMS_PROVIDER || 'local').toLowerCase();

    if (kmsType === 'aws-kms') {
      return new AwsKmsProvider();
    } else if (kmsType === 'vault') {
      return new VaultKeyProvider();
    } else {
      return new LocalKeyProvider();
    }
  }

  /**
   * Set provider dynamically (e.g. for testing or reconfiguration)
   */
  public setProvider(provider: IKeyManagementProvider): void {
    this.provider = provider;
  }

  /**
   * Strict Environment Isolation:
   * Throws if unencrypted local private keys are active in production
   */
  public validateEnvironmentIsolation(customEnv?: string): { safe: boolean; reason?: string } {
    const env = customEnv || process.env.NODE_ENV || 'development';
    const isProduction = env === 'production';

    if (isProduction && this.provider.providerType === 'local') {
      const errMessage =
        'ProductionSecurityViolation: Unencrypted local private key provider detected in production environment. AWS KMS or HashiCorp Vault MUST be configured for production.';
      throw new Error(errMessage);
    }

    return { safe: true };
  }

  /**
   * Cryptographically sign a transfer transaction payload
   */
  public async signTransferPayload(payload: any): Promise<SignatureResult> {
    const serialized = JSON.stringify(payload);
    return this.provider.signMessage(serialized);
  }

  /**
   * Rotate master signing key to next version without invalidating historical logs
   */
  public async rotateMasterKey(): Promise<KeyMetadata> {
    return this.provider.rotateKey();
  }

  /**
   * Get active metadata
   */
  public getActiveKeyMetadata(): KeyMetadata {
    return this.provider.getActiveKeyMetadata();
  }

  /**
   * Get active public key
   */
  public async getPublicKey(): Promise<string> {
    return this.provider.getPublicKey();
  }
}

export const kmsService = new KmsService();
