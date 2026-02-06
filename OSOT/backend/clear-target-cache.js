/**
 * Manual Redis Cache Clearance Script
 * Clears stale audience target cache for T-Shirt product
 * 
 * Usage: npm run clear-cache
 */

const { createClient } = require('redis');

async function clearCache() {
  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  try {
    await client.connect();
    console.log('🔌 Connected to Redis');

    // First, scan for ALL keys to see what's actually stored
    console.log('\n🔍 Listing ALL Redis keys...');
    const allKeys = await client.keys('*');
    console.log(`\n   Total: ${allKeys.length} keys in Redis`);
    allKeys.slice(0, 20).forEach((key, i) => {
      console.log(`   ${i + 1}. ${key}`);
    });
    if (allKeys.length > 20) {
      console.log(`   ... and ${allKeys.length - 20} more`);
    }

    // Now scan for audience-target keys
    console.log('\n🔍 Scanning for audience-target keys...');
    const keys = await client.keys('audience-target:*');
    console.log(`\n   Total: ${keys.length} audience-target keys`);
    keys.forEach((key, i) => {
      console.log(`   ${i + 1}. ${key}`);
    });

    // Clear T-Shirt product cache
    const productId = '6802a231-0fe0-f011-8406-7ced8d663da9';
    const cacheKey = `audience-target:product:${productId}`;

    console.log(`\n🗑️  Attempting to delete: ${cacheKey}`);
    const result = await client.del(cacheKey);
    console.log(`   Keys deleted: ${result}`);

    // Also clear any target ID caches
    const targetId = 'osot-tgt-0000007';
    const targetCacheKeys = [
      `audience-target:id:${targetId}`,
      `audience-target:guid:${targetId}`,
    ];

    for (const key of targetCacheKeys) {
      const deleted = await client.del(key);
      if (deleted > 0) {
        console.log(`✅ Cleared cache key: ${key}`);
      }
    }

    // Scan again to verify
    console.log('\n🔍 Scanning again after deletion...');
    const remainingKeys = [];
    for await (const key of client.scanIterator({ MATCH: 'audience-target:*' })) {
      remainingKeys.push(key);
    }
    console.log(`   Remaining: ${remainingKeys.length} audience-target keys`);

    console.log('\n✨ Cache clear operation completed!');
    console.log('🔄 Now test the product listing again - T-Shirt should appear for all users');
  } catch (error) {
    console.error('❌ Error clearing cache:', error.message);
    process.exit(1);
  } finally {
    await client.quit();
  }
}

clearCache();
