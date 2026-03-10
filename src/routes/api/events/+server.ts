import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const type = url.searchParams.get('type');
	const limit = parseInt(url.searchParams.get('limit') ?? '10');

	let result;
	if (type) {
		result = await db.execute({
			sql: 'SELECT * FROM events WHERE type = ? ORDER BY created_at DESC LIMIT ?',
			args: [type, limit]
		});
	} else {
		result = await db.execute({
			sql: 'SELECT * FROM events ORDER BY created_at DESC LIMIT ?',
			args: [limit]
		});
	}

	return json(result.rows);
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { type, metadata } = body;

	if (!type || !['diaper', 'nursing', 'pumping', 'sleep'].includes(type)) {
		return json({ error: 'Invalid event type' }, { status: 400 });
	}

	const created_at = new Date().toISOString();

	const result = await db.execute({
		sql: 'INSERT INTO events (type, created_at, metadata) VALUES (?, ?, ?) RETURNING *',
		args: [type, created_at, JSON.stringify(metadata ?? {})]
	});

	return json(result.rows[0], { status: 201 });
};
