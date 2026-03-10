import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const { password } = await request.json();
	const expected = env.APP_PASSWORD ?? 'thorunniris';

	if (password !== expected) {
		return json({ error: 'Wrong password' }, { status: 401 });
	}

	cookies.set('baby_auth', password, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: env.NODE_ENV === 'production',
		maxAge: 60 * 60 * 24 * 365
	});

	return json({ ok: true });
};
