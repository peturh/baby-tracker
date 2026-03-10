import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params }) => {
	const id = parseInt(params.id);
	if (isNaN(id)) {
		return json({ error: 'Invalid ID' }, { status: 400 });
	}

	await db.execute({
		sql: 'DELETE FROM events WHERE id = ?',
		args: [id]
	});

	return json({ ok: true });
};

export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = parseInt(params.id);
	if (isNaN(id)) {
		return json({ error: 'Invalid ID' }, { status: 400 });
	}

	const body = await request.json();
	const { metadata } = body;

	const result = await db.execute({
		sql: 'UPDATE events SET metadata = ? WHERE id = ? RETURNING *',
		args: [JSON.stringify(metadata), id]
	});

	if (result.rows.length === 0) {
		return json({ error: 'Event not found' }, { status: 404 });
	}

	return json(result.rows[0]);
};
