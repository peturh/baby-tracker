import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const result = await db.execute(
		`SELECT * FROM appointments WHERE datetime >= datetime('now') ORDER BY datetime ASC`
	);
	return json(result.rows);
};

export const POST: RequestHandler = async ({ request }) => {
	const { datetime, location, purpose } = await request.json();

	if (!datetime || !location) {
		return json({ error: 'datetime and location are required' }, { status: 400 });
	}

	const result = await db.execute({
		sql: 'INSERT INTO appointments (datetime, location, purpose) VALUES (?, ?, ?) RETURNING *',
		args: [datetime, location, purpose ?? '']
	});

	return json(result.rows[0], { status: 201 });
};
