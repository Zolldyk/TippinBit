import type { Handler } from '@netlify/functions';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const CACHE_KEY = 'btc:price';
const CACHE_TTL = 300; // 5 minutes
const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd';

interface CachedPrice {
  price: number;
  timestamp: number;
}

interface BTCPriceResponse {
  price: number;
  timestamp: number;
  source: 'CoinGecko' | 'Cache';
  cached: boolean;
}

export const handler: Handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Check cache first
    const cached = await redis.get<CachedPrice>(CACHE_KEY);
    if (cached && typeof cached === 'object' && cached.price) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          price: cached.price,
          timestamp: cached.timestamp,
          source: 'Cache',
          cached: true,
        } as BTCPriceResponse),
      };
    }

    // Fetch from CoinGecko with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(COINGECKO_URL, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const price = data.bitcoin.usd;
    const timestamp = Date.now();

    // Cache result
    await redis.set(CACHE_KEY, { price, timestamp }, { ex: CACHE_TTL });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        price,
        timestamp,
        source: 'CoinGecko',
        cached: false,
      } as BTCPriceResponse),
    };
  } catch (error) {
    console.error('BTC price fetch error:', error);
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({
        error: 'Unable to fetch BTC price',
        code: 'PRICE_FEED_UNAVAILABLE',
      }),
    };
  }
};
