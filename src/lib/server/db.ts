import { createClient } from '@libsql/client';
import { env } from '$env/dynamic/private';

export const db = createClient({
	url: env.TURSO_DATABASE_URL ?? 'file:local.db',
	authToken: env.TURSO_AUTH_TOKEN
});

export async function initDb() {
	await db.execute(`
		CREATE TABLE IF NOT EXISTS events (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			type TEXT NOT NULL,
			created_at TEXT NOT NULL,
			metadata TEXT NOT NULL DEFAULT '{}'
		)
	`);
	await db.execute(`
		CREATE INDEX IF NOT EXISTS idx_events_type_created
		ON events (type, created_at DESC)
	`);
	await db.execute(`
		CREATE TABLE IF NOT EXISTS appointments (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			datetime TEXT NOT NULL,
			location TEXT NOT NULL,
			purpose TEXT NOT NULL DEFAULT ''
		)
	`);
}
