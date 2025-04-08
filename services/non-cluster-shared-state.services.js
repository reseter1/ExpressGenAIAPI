const initializeSharedServices = () => {
    const locksMap = new Map();
    const lockTimeouts = new Map();

    global.contextLockService = {
        acquireLock: async (contextId) => {
            if (locksMap.has(contextId)) {
                throw new Error('Context is locked');
            }

            locksMap.set(contextId, Date.now());

            const timeoutId = setTimeout(() => {
                if (locksMap.has(contextId)) {
                    locksMap.delete(contextId);
                }
            }, 5 * 60 * 1000);

            lockTimeouts.set(contextId, timeoutId);
            return true;
        },

        releaseLock: async (contextId) => {
            if (lockTimeouts.has(contextId)) {
                clearTimeout(lockTimeouts.get(contextId));
                lockTimeouts.delete(contextId);
            }

            const result = locksMap.delete(contextId);
            if (!result) {
                throw new Error('Unable to release lock for contextId: ' + contextId);
            }
            return result;
        },

        isLocked: async (contextId) => {
            return locksMap.has(contextId);
        }
    };

    const cacheStore = new Map();
    global.responseCacheService = {
        get: async (key) => {
            return cacheStore.get(key);
        },

        set: async (key, value, ttl = 300) => {
            if (ttl) {
                setTimeout(() => {
                    cacheStore.delete(key);
                }, ttl * 1000);
            }
            cacheStore.set(key, value);
            return true;
        }
    };
}

module.exports = { initializeSharedServices };