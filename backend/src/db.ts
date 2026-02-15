import Database from 'better-sqlite3';
import path from 'path';

// Путь к базе данных
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/cpg.db');

let db: Database.Database | null = null;

/**
 * Получить подключение к базе данных (singleton)
 */
export function getDB(): Database.Database {
  if (db === null) {
    console.log(`Подключение к базе данных: ${DB_PATH}`);
    db = new Database(DB_PATH, { readonly: true });
    
    // Оптимизация для read-only доступа
    db.pragma('journal_mode = WAL');
    db.pragma('cache_size = -64000'); // 64MB кэш
    db.pragma('mmap_size = 268435456'); // 256MB mmap
    
    console.log('База данных подключена успешно');
  }
  return db;
}

/**
 * Выполнить SQL запрос с параметрами
 */
export function query<T = unknown>(sql: string, params: unknown[] = []): T[] {
  const database = getDB();
  const stmt = database.prepare(sql);
  return stmt.all(...params) as T[];
}

/**
 * Выполнить SQL запрос и вернуть одну строку
 */
export function queryOne<T = unknown>(sql: string, params: unknown[] = []): T | null {
  const database = getDB();
  const stmt = database.prepare(sql);
  const result = stmt.get(...params) as T | undefined;
  return result || null;
}

/**
 * Получить prepared statement для переиспользования
 */
export function prepare(sql: string): Database.Statement {
  const database = getDB();
  return database.prepare(sql);
}

/**
 * Закрыть подключение к базе данных
 */
export function closeDB(): void {
  if (db !== null) {
    db.close();
    db = null;
    console.log('Подключение к базе данных закрыто');
  }
}

