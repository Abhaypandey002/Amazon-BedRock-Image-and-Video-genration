import Database from 'better-sqlite3';
import { config } from '../config/env.js';
import { SCHEMA, MIGRATIONS } from './schema.js';
import fs from 'fs';
import path from 'path';

let db: Database.Database | null = null;

/**
 * Initialize the database connection and create tables
 */
export function initializeDatabase(): Database.Database {
  if (db) {
    return db;
  }

  // Ensure database directory exists
  const dbDir = path.dirname(config.storage.databasePath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Create database connection
  db = new Database(config.storage.databasePath);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create tables
  db.exec(SCHEMA);

  console.log(`Database initialized at: ${config.storage.databasePath}`);

  // Run migrations
  runMigrations(db);

  return db;
}

/**
 * Run database migrations
 */
function runMigrations(database: Database.Database): void {
  // Create migrations table if it doesn't exist
  database.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Get applied migrations
  const appliedMigrations = database
    .prepare('SELECT name FROM migrations')
    .all()
    .map((row: any) => row.name);

  // Apply pending migrations
  MIGRATIONS.forEach((migration, index) => {
    const migrationName = `migration_${index + 1}`;
    if (!appliedMigrations.includes(migrationName)) {
      console.log(`Applying migration: ${migrationName}`);
      database.exec(migration);
      database.prepare('INSERT INTO migrations (name) VALUES (?)').run(migrationName);
    }
  });
}

/**
 * Get the database connection
 */
export function getDatabase(): Database.Database {
  if (!db) {
    return initializeDatabase();
  }
  return db;
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}

// Handle process termination
process.on('exit', () => {
  closeDatabase();
});

process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});
