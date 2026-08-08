import Redis from 'ioredis';

let client: Redis | null = null;
let disabled = false;

function getClient(): Redis | null {
  if (disabled) return null;
  if (!process.env.CACHE_URL) return null;
  if (!client) {
    try {
      const redisUrl = process.env.CACHE_URL;
      client = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });
      client.on('error', (err: Error) => {
        // Cache is an accelerator; never let it break the API.
        console.warn('cache error:', err.message);
      });
    } catch {
      disabled = true;
      return null;
    }
  }
  return client;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getClient();
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // ignore
  }
}

export async function cacheIncr(key: string): Promise<number | null> {
  const redis = getClient();
  if (!redis) return null;
  try {
    return await redis.incr(key);
  } catch {
    return null;
  }
}

export async function cacheClose(): Promise<void> {
  try {
    await client?.quit();
  } catch {
    // ignore
  }
  client = null;
}