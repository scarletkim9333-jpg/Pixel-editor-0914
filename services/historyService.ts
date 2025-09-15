import type { HistoryItem } from '../types';

const DB_NAME = 'NanoBananaHistoryDB';
const DB_VERSION = 1;
const STORE_NAME = 'generations';

let db: IDBDatabase;

function getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Database error:', request.error);
            reject('Error opening database');
        };

        request.onsuccess = (event) => {
            db = (event.target as IDBOpenDBRequest).result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const tempDb = (event.target as IDBOpenDBRequest).result;
            if (!tempDb.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = tempDb.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                objectStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
}

export async function addGeneration(item: Omit<HistoryItem, 'id'>): Promise<number> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(item);

        request.onsuccess = () => {
            resolve(request.result as number);
        };

        request.onerror = () => {
            console.error('Error adding generation:', request.error);
            reject('Could not add generation to history.');
        };
    });
}

export async function getAllGenerations(): Promise<HistoryItem[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('timestamp');
        
        const cursorRequest = index.openCursor(null, 'prev'); // 'prev' for descending order
        const results: HistoryItem[] = [];

        cursorRequest.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
                results.push(cursor.value);
                cursor.continue();
            } else {
                resolve(results);
            }
        };

        cursorRequest.onerror = () => {
            console.error('Error getting generations:', cursorRequest.error);
            reject('Could not retrieve generation history.');
        };
    });
}

export async function deleteGeneration(id: number): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            console.error('Error deleting generation:', request.error);
            reject('Could not delete generation from history.');
        };
    });
}
