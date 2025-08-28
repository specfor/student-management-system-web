import { defineStore } from "pinia";
import { ref } from "vue";

export const useCacheStore = defineStore("cache", () => {
  const caches = ref({} as { [key: string]: string });
  const expireTime = ref({} as { [key: string]: number });

  /**
   * Return true if created new cache, false if cache with given id already exists
   * @param {number} [expireAfter=60] Number of minutes to expire. Default is 60 minutes. Check for expired is done every 5 minutes
   */
  function createNew(id: string, value: string, expireAfter: number = 60) {
    if (caches.value[id]) return false;

    caches.value[id] = value;
    expireTime.value[id] = Date.now() + expireAfter * 60000;
    return true;
  }

  let expireCheckerCreated = false;

  if (!expireCheckerCreated) {
    setInterval(() => {
      const now = Date.now();
      for (const [key, expTime] of Object.entries(expireTime.value)) {
        if (expTime < now) delete expireTime.value[key];
      }
    }, 300000);
    expireCheckerCreated = true;
  }

  return {
    caches,
    createNew,
  };
});
