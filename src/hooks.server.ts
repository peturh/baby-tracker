import { initDb } from '$lib/server/db';
import { redirect, type Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

await initDb();

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	if (pathname === '/login' || pathname.startsWith('/api/auth')) {
		return resolve(event);
	}

	const token = event.cookies.get('baby_auth');
	const password = env.APP_PASSWORD ?? 'thorunniris';

	if (token !== password) {
		throw redirect(303, '/login');
	}

	return resolve(event);
};
