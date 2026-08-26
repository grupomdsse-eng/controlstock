import { openDB } from 'idb';

const dbPromise = openDB('mds-bajas-internas', 1, {
  upgrade(db) {
    const products = db.createObjectStore('products', { keyPath: 'barcode' });
    products.createIndex('name', 'name');
    const movements = db.createObjectStore('movements', { keyPath: 'id', autoIncrement: true });
    movements.createIndex('createdAt', 'createdAt');
    movements.createIndex('barcode', 'barcode');
  }
});

export async function getProduct(barcode) {
  return (await dbPromise).get('products', barcode);
}

export async function saveProduct(product) {
  return (await dbPromise).put('products', product);
}

export async function getProducts() {
  return (await dbPromise).getAll('products');
}

export async function getMovements() {
  const all = await (await dbPromise).getAll('movements');
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addMovement(movement) {
  return (await dbPromise).add('movements', movement);
}

export async function clearAllData() {
  const db = await dbPromise;
  const tx = db.transaction(['products', 'movements'], 'readwrite');
  await Promise.all([tx.objectStore('products').clear(), tx.objectStore('movements').clear(), tx.done]);
}

export async function replaceAll(products, movements) {
  const db = await dbPromise;
  const tx = db.transaction(['products', 'movements'], 'readwrite');
  await tx.objectStore('products').clear();
  await tx.objectStore('movements').clear();
  for (const p of products) await tx.objectStore('products').put(p);
  for (const m of movements) await tx.objectStore('movements').put(m);
  await tx.done;
}
