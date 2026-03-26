import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('clienttracker.db');

// ─── TYPES ─────────────────────────────────────────────

export interface Client {
  id: number;
  name: string;
  phone: string | null;
  age: number | null;
  height: string | null;
  created_at: string;
}

export interface BaselineStat {
  id: number;
  client_id: number;
  weight: number | null;
  height: number | null;
  body_fat: number | null;
  recorded_at: string;
}

export interface Lift {
  id: number;
  name: string;
}

export interface LiftEntry {
  id: number;
  client_id: number;
  lift_id: number;
  weight: number | null;
  reps: number | null;
  sets: number | null;
  recorded_at: string;
  lift_name: string;
}

// ─── INIT ──────────────────────────────────────────────

export function initDB(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      age INTEGER,
      height TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS baseline_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      weight REAL,
      height REAL,
      muscle REAL,
      body_fat REAL,
      recorded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );
    CREATE TABLE IF NOT EXISTS workout_sessions(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      notes TEXT,
      performed_at TEXT DEFAULT CURRENT_TIMESTRAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );
    CREATE TABLE IF NOT EXISTS lifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS lift_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      lift_id INTEGER,
      weight REAL,
      reps INTEGER,
      sets INTEGER,
      recorded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (lift_id) REFERENCES lifts(id)
    );
  `);
}

// ─── CLIENTS ───────────────────────────────────────────

export function addClient(name: string, phone: string, age: number, height: string): SQLite.SQLiteRunResult {
  return db.runSync(
    `INSERT INTO clients (name, phone, age, height) VALUES (?, ?, ?, ?)`,
    [name, phone, age, height]
  );
}

export function getClients(): Client[] {
  return db.getAllSync<Client>(`SELECT * FROM clients`);
}

// export function deleteClient(id: number): void {
//   db.runSync(`DELETE FROM clients WHERE id = ?`, [id]);
// }
db.execSync('BEGIN TRANSACTION');
  export function removeClient(id: number): void {
    db.runSync(`DELETE FROM lift_entries WHERE client_id = ?`, [id]);
    db.runSync(`DELETE FROM baseline_stats WHERE client_id = ?`, [id]);
    db.runSync(`DELETE FROM clients WHERE id = ?`, [id]);
  }
db.execSync('COMMIT');

// ─── BASELINE STATS ────────────────────────────────────

export function addBaselineStat(client_id: number, weight: number, height: number, body_fat: number): SQLite.SQLiteRunResult {
  return db.runSync(
    `INSERT INTO baseline_stats (client_id, weight, height, body_fat) VALUES (?, ?, ?, ?)`,
    [client_id, weight, height, body_fat]
  );
}

export function getBaselineStats(client_id: number): BaselineStat[] {
  return db.getAllSync<BaselineStat>(
    `SELECT * FROM baseline_stats WHERE client_id = ?`,
    [client_id]
  );
}

export function deleteBaselineStat(id: number): void {
  db.runSync(`DELETE FROM baseline_stats WHERE id = ?`, [id]);
}

// ─── LIFTS ─────────────────────────────────────────────

export function addLift(name: string): SQLite.SQLiteRunResult {
  return db.runSync(
    `INSERT INTO lifts (name) VALUES (?)`,
    [name]
  );
}

export function getLifts(): Lift[] {
  return db.getAllSync<Lift>(`SELECT * FROM lifts`);
}

export function deleteLift(id: number): void {
  db.runSync(`DELETE FROM lifts WHERE id = ?`, [id]);
}

// ─── LIFT ENTRIES ──────────────────────────────────────

export function addLiftEntry(client_id: number, lift_id: number, weight: number, reps: number, sets: number): SQLite.SQLiteRunResult {
  return db.runSync(
    `INSERT INTO lift_entries (client_id, lift_id, weight, reps, sets) VALUES (?, ?, ?, ?, ?)`,
    [client_id, lift_id, weight, reps, sets]
  );
}

export function getLiftEntries(client_id: number): LiftEntry[] {
  return db.getAllSync<LiftEntry>(
    `SELECT lift_entries.*, lifts.name as lift_name 
     FROM lift_entries 
     JOIN lifts ON lift_entries.lift_id = lifts.id
     WHERE lift_entries.client_id = ?`,
    [client_id]
  );
}

export function deleteLiftEntry(id: number): void {
  db.runSync(`DELETE FROM lift_entries WHERE id = ?`, [id]);
}
