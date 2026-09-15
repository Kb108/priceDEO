const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

function ensureDB() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ chats: {} }, null, 2));
  }
}

function readDB() {
  ensureDB();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function addItem(chatId, item) {
  const db = readDB();
  if (!db.chats[chatId]) db.chats[chatId] = [];
  const id = String(Date.now()).slice(-6);
  const newItem = {
    id,
    ...item,
    priceHistory: [{ price: item.lastPrice, date: Date.now() }],
  };
  db.chats[chatId].push(newItem);
  writeDB(db);
  return newItem;
}

function getItems(chatId) {
  const db = readDB();
  return db.chats[chatId] || [];
}

function removeItem(chatId, id) {
  const db = readDB();
  if (!db.chats[chatId]) return false;
  const before = db.chats[chatId].length;
  db.chats[chatId] = db.chats[chatId].filter((i) => i.id !== id);
  writeDB(db);
  return db.chats[chatId].length < before;
}

function updatePrice(chatId, id, newPrice) {
  const db = readDB();
  const items = db.chats[chatId];
  if (!items) return;
  const item = items.find((i) => i.id === id);
  if (item) {
    item.lastPrice = newPrice;
    item.lastChecked = Date.now();
    if (!item.priceHistory) item.priceHistory = [];
    item.priceHistory.push({ price: newPrice, date: Date.now() });
    // keep only the last 100 entries so the file doesn't grow forever
    if (item.priceHistory.length > 100) {
      item.priceHistory = item.priceHistory.slice(-100);
    }
  }
  writeDB(db);
}

function getAllItems() {
  const db = readDB();
  const all = [];
  for (const chatId of Object.keys(db.chats)) {
    for (const item of db.chats[chatId]) {
      all.push({ chatId, item });
    }
  }
  return all;
}

module.exports = { addItem, getItems, removeItem, updatePrice, getAllItems };
