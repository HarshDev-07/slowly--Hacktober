const DATABASE_NAME = 'slowly-subscriptions';
const STORE_NAME = 'subscriptions';

const database = new Promise((resolve, reject) => {
  const request = indexedDB.open(DATABASE_NAME, 1);
  request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

function runTransaction(mode, operation) {
  return database.then((connection) => new Promise((resolve, reject) => {
    const transaction = connection.transaction(STORE_NAME, mode);
    const request = operation(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }));
}

export const storage = {
  list: () => runTransaction('readonly', (store) => store.getAll()),
  save: (record) => runTransaction('readwrite', (store) => store.put(record)),
  remove: (id) => runTransaction('readwrite', (store) => store.delete(id)),
  importRecords: (records) => Promise.all(records.map((record) => storage.save(record))),
  exportRecords: async () => ({ version: 1, exportedAt: new Date().toISOString(), subscriptions: await storage.list() })
};
