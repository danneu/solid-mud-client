// Type-safe localStorage wrapper with predefined keys and value types

type LocalStorageSchema = {
  "mud:proxy-url": string;
  // Add more keys here as needed with their types
  // "mud:theme": "light" | "dark";
  // "mud:settings": { volume: number; notifications: boolean };
};

type LocalStorageKey = keyof LocalStorageSchema;

export const LocalStorage = {
  save<K extends LocalStorageKey>(key: K, value: LocalStorageSchema[K]): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Failed to save to localStorage key "${key}":`, error);
    }
  },

  load<K extends LocalStorageKey>(key: K): LocalStorageSchema[K] | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return null;
      }
      return JSON.parse(item) as LocalStorageSchema[K];
    } catch (error) {
      console.error(`Failed to load from localStorage key "${key}":`, error);
      return null;
    }
  },

  remove<K extends LocalStorageKey>(key: K): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove localStorage key "${key}":`, error);
    }
  },

  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }
  },
};
