<script lang="ts">
	import TrackerCard from './TrackerCard.svelte';
	import type { TrackerEvent, SleepMeta } from '$lib/types';

	interface Props {
		lastEvent: TrackerEvent | null;
		onLogged: () => void;
	}

	let { lastEvent, onLogged }: Props = $props();

	let loading = $state(false);
	let showForm = $state(false);
	let startTime = $state('');
	let endTime = $state('');
	let period = $state<SleepMeta['period']>('day');

	function lastLabel(): string {
		if (!lastEvent) return '';
		try {
			const meta: SleepMeta = JSON.parse(lastEvent.metadata);
			return `${meta.start}–${meta.end} (${meta.period})`;
		} catch {
			return '';
		}
	}

	function initTimes() {
		const now = new Date();
		const hours = now.getHours();
		endTime = `${String(hours).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
		const startHour = Math.max(0, hours - 1);
		startTime = `${String(startHour).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
		period = hours >= 6 && hours < 20 ? 'day' : 'night';
		showForm = true;
	}

	async function logSleep() {
		if (!startTime || !endTime) return;
		loading = true;
		try {
			await fetch('/api/events', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: 'sleep',
					metadata: { start: startTime, end: endTime, period }
				})
			});
			showForm = false;
			onLogged();
		} finally {
			loading = false;
		}
	}
</script>

<TrackerCard title="Sleep" icon="😴" color="#b8a0d8" {lastEvent} lastEventLabel={lastLabel()}>
	{#if showForm}
		<div class="space-y-3">
			<div class="flex gap-3">
				<label class="flex-1">
					<span class="block text-xs text-gray-400 mb-1 font-medium">From</span>
					<input
						type="time"
						bind:value={startTime}
						class="w-full px-3 py-2.5 rounded-xl bg-gray-100 text-gray-800 text-center
							text-lg font-medium focus:outline-none focus:ring-2 focus:ring-baby-purple"
					/>
				</label>
				<label class="flex-1">
					<span class="block text-xs text-gray-400 mb-1 font-medium">To</span>
					<input
						type="time"
						bind:value={endTime}
						class="w-full px-3 py-2.5 rounded-xl bg-gray-100 text-gray-800 text-center
							text-lg font-medium focus:outline-none focus:ring-2 focus:ring-baby-purple"
					/>
				</label>
			</div>
			<div class="flex gap-2">
				<button
					class="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all {period === 'day'
						? 'bg-baby-yellow text-white shadow-md'
						: 'bg-gray-100 text-gray-600'}"
					onclick={() => (period = 'day')}
				>
					☀️ Day nap
				</button>
				<button
					class="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all {period === 'night'
						? 'bg-baby-purple text-white shadow-md'
						: 'bg-gray-100 text-gray-600'}"
					onclick={() => (period = 'night')}
				>
					🌙 Night
				</button>
			</div>
			<div class="flex gap-2">
				<button
					class="flex-1 py-3 rounded-xl bg-baby-purple text-white font-semibold
						active:scale-95 transition-transform disabled:opacity-50"
					onclick={logSleep}
					disabled={loading}
				>
					{loading ? 'Saving...' : 'Save'}
				</button>
				<button
					class="py-3 px-4 rounded-xl text-sm text-gray-400 hover:text-gray-600"
					onclick={() => (showForm = false)}
				>
					Cancel
				</button>
			</div>
		</div>
	{:else}
		<button
			class="w-full py-4 rounded-xl bg-baby-purple text-white text-lg font-semibold
				active:scale-95 transition-transform shadow-md hover:shadow-lg"
			onclick={initTimes}
		>
			Log Sleep
		</button>
	{/if}
</TrackerCard>
