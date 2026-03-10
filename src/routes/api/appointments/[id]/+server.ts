import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params }) => {
	const id = parseInt(params.id);
	if (isNaN(id)) {
		return json({ error: 'Invalid ID' }, { status: 400 });
	}

	await db.execute({
		sql: 'DELETE FROM appointments WHERE id = ?',
		args: [id]
	});

	return json({ ok: true });
};
