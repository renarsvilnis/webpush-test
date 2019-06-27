const DB_NAME = "community";
const DB_VERSION = 1;

const ACCESS_TOKEN_STORE_NAME = "credentials";

// Cached connection instance
let cachedDb: IDBDatabase | undefined;

interface Credentials {
  accessToken?: string;
  refreshToken?: string;
}

let supportsIndexDBCache: boolean | undefined = undefined;
export function isIndexDBSupported(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    // Try to read the cached value
    if (supportsIndexDBCache !== undefined) {
      resolve(supportsIndexDBCache);
      return;
    }

    const request = indexedDB.open("dummy", 1);
    request.onerror = ev => {
      supportsIndexDBCache = false;
      resolve(supportsIndexDBCache);
    };

    request.onsuccess = ev => {
      supportsIndexDBCache = true;
      resolve(supportsIndexDBCache);
    };
  });
}

function getDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (cachedDb) {
      resolve(cachedDb);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase
    request.onupgradeneeded = ev => {
      const db = request.result;

      // Version 1 is the first version of the database.
      if (ev.oldVersion < 1) {
        db.createObjectStore(ACCESS_TOKEN_STORE_NAME);
      }
      // Other migrations go here
    };

    request.onerror = ev => {
      const req: any = ev.srcElement;
      reject(new Error(req.error));
    };

    request.onsuccess = ev => {
      cachedDb = request.result;

      cachedDb.onclose = () => {
        cachedDb = undefined;
      };

      resolve(cachedDb);
    };
  });
}

export function setCredentials(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    // Fallback for firefox in incognito mode as it doesn't support IndexDB
    const supportsIndexDB = await isIndexDBSupported();
    if (!supportsIndexDB) {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      return;
    }

    const db = await getDatabase();
    const transaction = db.transaction([ACCESS_TOKEN_STORE_NAME], "readwrite");
    const objectStore = transaction.objectStore(ACCESS_TOKEN_STORE_NAME);

    objectStore.put(accessToken, "accessToken");
    objectStore.put(refreshToken, "refreshToken");

    transaction.onerror = ev => {
      const req: any = ev.srcElement;
      reject(new Error(req.error));
    };
    transaction.oncomplete = () => {
      resolve();
    };
  });
}

export function getCredentials(): Promise<Credentials> {
  return new Promise(async (resolve, reject) => {
    // Fallback for firefox in incognito mode as it doesn't support IndexDB
    const supportsIndexDB = await isIndexDBSupported();
    if (!supportsIndexDB) {
      resolve({
        accessToken: localStorage.getItem("accessToken") || undefined,
        refreshToken: localStorage.getItem("refreshToken") || undefined
      });
      return;
    }

    const db = await getDatabase();
    const transaction = db.transaction([ACCESS_TOKEN_STORE_NAME], "readonly");
    const objectStore = transaction.objectStore(ACCESS_TOKEN_STORE_NAME);
    const request = objectStore.getAll();

    transaction.onerror = ev => {
      const req: any = ev.srcElement;
      reject(new Error(req.error));
    };
    transaction.oncomplete = ev => {
      const results = request.result;
      resolve({
        accessToken: results[0] as string,
        refreshToken: results[1] as string
      });
    };
  });
}

export function clearCredentials() {
  return new Promise(async (resolve, reject) => {
    // Fallback for firefox in incognito mode as it doesn't support IndexDB
    const supportsIndexDB = await isIndexDBSupported();
    if (!supportsIndexDB) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      return;
    }

    const db = await getDatabase();
    const transaction = db.transaction([ACCESS_TOKEN_STORE_NAME], "readwrite");
    const objectStore = transaction.objectStore(ACCESS_TOKEN_STORE_NAME);
    objectStore.clear();

    transaction.onerror = ev => {
      const req: any = ev.srcElement;
      reject(new Error(req.error));
    };
    transaction.oncomplete = ev => {
      resolve();
    };
  });
}
