import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const types = ['diaper', 'nursing', 'pumping', 'sleep', 'bottle', 'vitamind', 'tummytime'] as const;

	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);

	const todayTypes = ['tummytime', 'diaper', 'nursing', 'pumping'] as const;

	const [eventResults, appointmentsResult, ...todayResults] = await Promise.all([
		Promise.all(
			types.map((type) =>
				db.execute({
					sql: 'SELECT * FROM events WHERE type = ? ORDER BY created_at DESC LIMIT 1',
					args: [type]
				})
			)
		),
		db.execute(
			`SELECT * FROM appointments WHERE datetime >= datetime('now') ORDER BY datetime ASC`
		),
		...todayTypes.map((type) =>
			db.execute({
				sql: `SELECT * FROM events WHERE type = ? AND created_at >= ? ORDER BY created_at DESC`,
				args: [type, todayStart.toISOString()]
			})
		)
	]);

	const latest: Record<string, ReturnType<typeof serialize> | null> = {};
	types.forEach((type, i) => {
		const row = eventResults[i].rows[0];
		latest[type] = row ? serialize(row) : null;
	});

	const appointments = appointmentsResult.rows.map((row) => ({
		id: row.id as number,
		datetime: row.datetime as string,
		location: row.location as string,
		purpose: row.purpose as string
	}));

	const todayEvents: Record<string, ReturnType<typeof serialize>[]> = {};
	todayTypes.forEach((type, i) => {
		todayEvents[type] = todayResults[i].rows.map(serialize);
	});

	return { latest, appointments, todayEvents };
};

function serialize(row: Record<string, unknown>) {
	return {
		id: row.id as number,
		type: row.type as string,
		created_at: row.created_at as string,
		metadata: row.metadata as string
	};
}
