import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('clienttracker.db');

// ─── TYPES ─────────────────────────────────────────────

function localISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime()-offset).toISOString().slice(0,19);
}

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
  muscle: number | null;
  recorded_at: string;
}

export interface Lift {
  id: number;
  name: string;
}

export interface WorkoutSession {
  id: number;
  client_id: number;
  notes: string | null;
  performed_at: string;
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
  rpe:  number | null;
}

export interface SessionLiftEntry {
  id: number,
  session_id: number,
  client_id: number,
  lift_id: number,
  lift_name: string,
  weight: number | null;
  reps: number | null;
  rpe: number | null;
}

export interface LiftHistoryEntry {
  lift_id: number;
  id: number,
  lift_name: string;
  recorded_at: string;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
}

export function resetDB(): void {
  db.execSync(`DROP TABLE IF EXISTS lift_entries;`);
  db.execSync(`DROP TABLE IF EXISTS workout_sessions;`);
  db.execSync(`DROP TABLE IF EXISTS baseline_stats;`);
  db.execSync(`DROP TABLE IF EXISTS lifts;`);
  db.execSync(`DROP TABLE IF EXISTS clients;`);
  initDB();
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
    `);
    db.execSync(`
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
    `);
    db.execSync(`
    CREATE TABLE IF NOT EXISTS workout_sessions(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      notes TEXT,
      performed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
      );
    `);
    db.execSync(`
    CREATE TABLE IF NOT EXISTS lifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
      );
    `);
    db.execSync(`
    CREATE TABLE IF NOT EXISTS lift_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      lift_id INTEGER,
      session_id INTEGER,
      weight REAL,
      rpe REAL,
      reps INTEGER,
      sets INTEGER,
      recorded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (lift_id) REFERENCES lifts(id),
      FOREIGN KEY (session_id) REFERENCES workout_sessions(id)
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
  return db.getAllSync<Client>(`SELECT * FROM clients ORDER BY name ASC`);
}

// export function deleteClient(id: number): void {
//   db.runSync(`DELETE FROM clients WHERE id = ?`, [id]);
// }

export function removeClient(id: number): void {
  db.execSync('BEGIN TRANSACTION');
  db.runSync(`DELETE FROM lift_entries WHERE client_id = ?`, [id]);
  db.runSync('DELETE FROM workout_sessions WHERE client_id = ?', [id])
  db.runSync(`DELETE FROM baseline_stats WHERE client_id = ?`, [id]);
  db.runSync(`DELETE FROM clients WHERE id = ?`, [id]);
  db.execSync('COMMIT');
}

// ─── WORKOUTS ────────────────────────────────────

export function getWorkoutSessions(client_id: number): WorkoutSession[] {
  return db.getAllSync<WorkoutSession>(
    `SELECT * FROM workout_sessions WHERE client_id = ? ORDER BY performed_at DESC`,
    [client_id]
  );
}

export function deleteWorkoutSession(id: number): void {
  db.runSync(`DELETE FROM lift_entries WHERE session_id = ?`, [id]);
  db.runSync(`DELETE FROM workout_sessions WHERE id = ?`, [id]);
}

export function addWorkoutSession(client_id: number, notes: string, date?: string): SQLite.SQLiteRunResult {
  let performed_at: string;
  if (date) {
    performed_at = `${date}T12:00:00`;
  } else {
    performed_at = localISO();
  }
  return db.runSync(
    `INSERT INTO workout_sessions (client_id, notes, performed_at) VALUES (?, ?, ?)`,
    [client_id, notes || null, performed_at]
  );
}

export function getSessionEntries(session_id: number): SessionLiftEntry[] {
  return db.getAllSync<SessionLiftEntry>(
    `SELECT lift_entries.*, lifts.name as lift_name
    FROM lift_entries
    JOIN lifts ON lift_entries.lift_id = lifts.id
    WHERE lift_entries.session_id=?
    ORDER BY lifts.name, lift_entries.id`,
    [session_id]
  );
}
export function addSessionEntry(
  session_id: number,
  client_id: number,
  lift_id: number,
  weight: number | null,
  reps: number | null,
  rpe: number | null
): SQLite.SQLiteRunResult {
  return db.runSync(
    `INSERT INTO lift_entries (session_id, client_id, lift_id, weight, reps, rpe) VALUES (?, ?, ?, ?, ?, ?)`,
    [session_id, client_id, lift_id, weight, reps, rpe]
  );
}

  export function deleteSessionEntry(id: number): void {
    db.runSync(`DELETE FROM lift_entries WHERE id = ?`, [id]);
  }


// ─── BASELINE STATS ────────────────────────────────────

export function addBaselineStat(
  client_id: number,
  weight: number | null,
  muscle: number | null,
  body_fat: number | null,
  date?: string
): SQLite.SQLiteRunResult {
  let recorded_at: string;
  if (date) {
    recorded_at = `${date}T12:00:00`;
  } else {
    recorded_at = localISO();
  }
  return db.runSync(
    `INSERT INTO baseline_stats (client_id, weight, muscle, body_fat, recorded_at) VALUES (?, ?, ?, ?, ?)`,
    [client_id, weight, muscle, body_fat, recorded_at]
  );
}

export function getBaselineStats(client_id: number): BaselineStat[] {
  return db.getAllSync<BaselineStat>(
    `SELECT * FROM baseline_stats WHERE client_id = ? ORDER BY recorded_at DESC`,
    [client_id]
  );
}

export function deleteBaselineStat(id: number): void {
  db.runSync(`DELETE FROM baseline_stats WHERE id = ?`, [id]);
}

// ─── LIFTS ─────────────────────────────────────────────

export function addLift(name: string): SQLite.SQLiteRunResult {
  return db.runSync(
    `INSERT OR IGNORE INTO lifts (name) VALUES (?)`,
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

export function getClientLifts(client_id: number): {lift_id: number; lift_name: string } [] {
  return db.getAllSync(
    `SELECT DISTINCT lift_entries.lift_id, lifts.name as lift_name
    FROM lift_entries
    JOIN lifts ON lift_entries.lift_id = lifts.id
    WHERE lift_entries.client_id = ?
    ORDER BY lifts.name ASC`,
    [client_id]
  );
}

export function getLiftHistory(client_id: number, lift_id: number): LiftHistoryEntry[] {
  return db.getAllSync<LiftHistoryEntry>(
    `SELECT lift_entries.*, lifts.name as lift_name
     FROM lift_entries
     JOIN lifts ON lift_entries.lift_id = lifts.id
     WHERE lift_entries.client_id = ? AND lift_entries.lift_id = ?
     ORDER BY lift_entries.recorded_at DESC`,
    [client_id, lift_id]
  );
}