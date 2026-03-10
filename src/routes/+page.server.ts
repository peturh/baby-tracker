import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const types = ['diaper', 'nursing', 'pumping', 'sleep'] as const;

	const results = await Promise.all(
		types.map((type) =>
			db.execute({
				sql: 'SELECT * FROM events WHERE type = ? ORDER BY created_at DESC LIMIT 1',
				args: [type]
			})
		)
	);

	const latest: Record<string, ReturnType<typeof serialize> | null> = {};
	types.forEach((type, i) => {
		const row = results[i].rows[0];
		latest[type] = row ? serialize(row) : null;
	});

	return { latest };
};

function serialize(row: Record<string, unknown>) {
	return {
		id: row.id as number,
		type: row.type as string,
		created_at: row.created_at as string,
		metadata: row.metadata as string
	};
}
