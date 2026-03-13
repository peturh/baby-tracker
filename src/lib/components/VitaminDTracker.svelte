<script lang="ts">
	import type { TrackerEvent } from '$lib/types';
	import { formatTime } from '$lib/time';

	interface Props {
		lastEvent: TrackerEvent | null;
		onLogged: () => void | Promise<void>;
	}

	let { lastEvent, onLogged }: Props = $props();

	let loading = $state(false);
	let undoing = $state(false);

	let givenToday = $derived.by(() => {
		if (!lastEvent) return false;
		const eventDate = new Date(lastEvent.created_at).toDateString();
		const today = new Date().toDateString();
		return eventDate === today;
	});

	async function logVitaminD() {
		loading = true;
		try {
			await fetch('/api/events', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'vitamind', metadata: {} })
			});
			onLogged();
		} finally {
			loading = false;
		}
	}

	async function undo() {
		if (!lastEvent) return;
		undoing = true;
		try {
			await fetch(`/api/events/${lastEvent.id}`, { method: 'DELETE' });
			await onLogged();
		} finally {
			undoing = false;
		}
	}
</script>

<div class="rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
	<div class="px-5 pt-4 pb-3 flex items-center justify-between">
		<div class="flex items-center gap-2.5">
			<span class="text-2xl">☀️</span>
			<h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Vitamin D</h2>
		</div>
		{#if givenToday && lastEvent}
			<div class="text-right">
				<p class="text-sm font-medium text-baby-amber">Done today</p>
				<p class="text-xs text-gray-400 dark:text-gray-500">{formatTime(lastEvent.created_at)}</p>
			</div>
		{:else if lastEvent}
			<p class="text-sm text-red-400 font-medium">Not given today</p>
		{:else}
			<p class="text-sm text-gray-400 dark:text-gray-500">No entries yet</p>
		{/if}
	</div>
	<div class="px-5 pb-5">
		{#if givenToday}
			<div class="flex gap-2">
				<div class="flex-1 py-4 rounded-xl bg-baby-amber/15 text-baby-amber text-lg font-semibold
					text-center flex items-center justify-center gap-2">
					<span class="text-2xl">&#10003;</span> Given today
				</div>
				<button
					class="px-4 py-4 rounded-xl bg-gray-100 dark:bg-gray-700 text-sm text-gray-400 dark:text-gray-500 font-medium
						hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
					onclick={undo}
					disabled={undoing}
				>
					{undoing ? '...' : 'Undo'}
				</button>
			</div>
		{:else}
			<button
				class="w-full py-4 rounded-xl bg-baby-amber text-white text-lg font-semibold
					active:scale-95 transition-transform shadow-md hover:shadow-lg disabled:opacity-50"
				onclick={logVitaminD}
				disabled={loading}
			>
				{loading ? 'Logging...' : 'Give Vitamin D'}
			</button>
		{/if}
	</div>
</div>
