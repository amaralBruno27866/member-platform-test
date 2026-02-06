import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;

  async onModuleInit() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async set(key: string, value: string, options?: { EX?: number }) {
    if (!this.client) {
      return; // Client not ready yet - skip caching
    }
    if (options?.EX) {
      await this.client.set(key, value, { EX: options.EX });
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) {
      return null; // Client not ready yet - return null (cache miss)
    }
    const result = await this.client.get(key);
    return result as string | null;
  }

  async del(key: string): Promise<void> {
    if (!this.client) {
      return; // Client not ready yet - skip deletion
    }
    await this.client.del(key);
  }
  /**
   * Salva um código temporário (ex: verificação de e-mail, reset de senha) no Redis.
   * @param keyPrefix Prefixo da chave (ex: 'registration:code', 'password-reset:code')
   * @param identifier Identificador único (ex: email)
   * @param code Código a ser salvo
   * @param expiresIn Expiração em segundos (ex: 300 para 5 min)
   */
  async setTempCode(
    keyPrefix: string,
    identifier: string,
    code: string,
    expiresIn: number,
  ): Promise<void> {
    const key = `${keyPrefix}:${identifier}`;
    await this.set(key, code, { EX: expiresIn });
  }

  /**
   * Busca um código temporário salvo no Redis.
   * @param keyPrefix Prefixo da chave
   * @param identifier Identificador único
   * @returns Código salvo ou null
   */
  async getTempCode(
    keyPrefix: string,
    identifier: string,
  ): Promise<string | null> {
    const key = `${keyPrefix}:${identifier}`;
    return this.get(key);
  }

  /**
   * Remove um código temporário do Redis (após uso ou expiração manual).
   * @param keyPrefix Prefixo da chave
   * @param identifier Identificador único
   */
  async delTempCode(keyPrefix: string, identifier: string): Promise<void> {
    const key = `${keyPrefix}:${identifier}`;
    await this.del(key);
  }

  /**
   * Get all keys matching a pattern
   * @param pattern Pattern to match (supports wildcards)
   * @returns Array of matching keys
   */
  async getKeys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  /**
   * Delete keys matching a pattern
   * @param pattern Pattern to match (supports wildcards)
   * @returns Number of deleted keys
   */
  async deletePattern(pattern: string): Promise<number> {
    const keys = await this.getKeys(pattern);
    if (keys.length > 0) {
      await this.client.del(keys);
      return keys.length;
    }
    return 0;
  }

  /**
   * Delete a single key (alias for del)
   * @param key Key to delete
   */
  async delete(key: string): Promise<void> {
    await this.del(key);
  }
}
