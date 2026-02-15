import Database from 'better-sqlite3';
import path from 'path';

// Database path
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/cpg.db');

let db: Database.Database | null = null;

/**
 * Get database connection (singleton)
 */
export function getDB(): Database.Database {
  if (db === null) {
    console.log(`Connecting to database: ${DB_PATH}`);
    db = new Database(DB_PATH, { readonly: true });
    
    // Optimization for read-only access
    db.pragma('journal_mode = WAL');
    db.pragma('cache_size = -64000'); // 64MB cache
    db.pragma('mmap_size = 268435456'); // 256MB mmap
    
    console.log('Database connected successfully');
  }
  return db;
}

/**
 * Execute SQL query with parameters
 */
export function query<T = unknown>(sql: string, params: unknown[] = []): T[] {
  const database = getDB();
  const stmt = database.prepare(sql);
  return stmt.all(...params) as T[];
}

/**
 * Execute SQL query and return one row
 */
export function queryOne<T = unknown>(sql: string, params: unknown[] = []): T | null {
  const database = getDB();
  const stmt = database.prepare(sql);
  const result = stmt.get(...params) as T | undefined;
  return result || null;
}

/**
 * Get prepared statement for reuse
 */
export function prepare(sql: string): Database.Statement {
  const database = getDB();
  return database.prepare(sql);
}

/**
 * Close database connection
 */
export function closeDB(): void {
  if (db !== null) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}

