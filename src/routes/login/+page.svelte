<script lang="ts">
	import { goto } from '$app/navigation';

	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function submit() {
		error = '';
		loading = true;
		try {
			const res = await fetch('/api/auth', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password })
			});
			if (res.ok) {
				goto('/');
			} else {
				error = 'Wrong password';
				password = '';
			}
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Baby Tracker - Login</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex items-center justify-center px-6">
	<div class="w-full max-w-sm">
		<div class="text-center mb-8">
			<p class="text-6xl mb-3">👶</p>
			<h1 class="text-2xl font-bold text-gray-800">Baby Tracker</h1>
			<p class="text-gray-400 mt-1">Enter password to continue</p>
		</div>

		<form
			class="rounded-2xl bg-white shadow-sm border border-gray-100 p-6 space-y-4"
			onsubmit={(e) => { e.preventDefault(); submit(); }}
		>
			<input
				type="password"
				bind:value={password}
				placeholder="Password"
				autocomplete="current-password"
				class="w-full px-4 py-4 rounded-xl bg-gray-50 text-lg text-gray-800
					placeholder:text-gray-300 border border-gray-200
					focus:outline-none focus:ring-2 focus:ring-baby-blue focus:border-transparent
					text-center"
			/>

			{#if error}
				<p class="text-center text-sm text-red-400 font-medium">{error}</p>
			{/if}

			<button
				type="submit"
				disabled={loading || !password}
				class="w-full py-4 rounded-xl bg-baby-blue text-white text-lg font-semibold
					active:scale-95 transition-transform shadow-md hover:shadow-lg
					disabled:opacity-50 disabled:active:scale-100"
			>
				{loading ? 'Checking...' : 'Enter'}
			</button>
		</form>
	</div>
</div>
