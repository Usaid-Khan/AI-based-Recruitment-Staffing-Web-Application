package com.smartstaff.intellirecruit.redis;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class AiCacheService {
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Value("${app.redis.ai-cache-ttl}")
    private long aiCacheTtl;

    // Key pattern: "ai:{featureType}:{entityId}"
    // e.g. "ai:BIO:42", "ai:RECOMMENDATION:vacancyId:7"

    public void cacheResponse(String featureType, Long entityId, String content) {
        try {
            String key = buildKey(featureType, entityId);
            redisTemplate.opsForValue().set(key, content, aiCacheTtl, TimeUnit.SECONDS);
            log.info("Cached AI response — key: {}", key);
        } catch (Exception e) {
            log.warn("Failed to cache AI response in Redis: {}", e.getMessage());
        }
    }

    public String getCachedResponse(String featureType, Long entityId) {
        try {
            String key = buildKey(featureType, entityId);
            Object cached = redisTemplate.opsForValue().get(key);

            if (cached != null) {
                log.info("Cache HIT — key: {}", key);
                return cached.toString();
            }
            log.info("Cache MISS — key: {}", key);
        } catch (Exception e) {
            log.warn("Failed to retrieve from Redis cache: {}", e.getMessage());
        }

        return null;
    }

    public void evictCache(String featureType, Long entityId) {
        try {
            String key = buildKey(featureType, entityId);
            redisTemplate.delete(key);
            log.info("Evicted AI cache — key: {}", key);
        } catch (Exception e) {
            log.warn("Failed to evict Redis cache: {}", e.getMessage());
        }
    }

    private String buildKey(String featureType, Long entityId) {
        return "ai:" + featureType + ":" + entityId;
    }
}
