<script lang="ts">
	import TrackerCard from './TrackerCard.svelte';
	import type { TrackerEvent, BottleMeta } from '$lib/types';

	interface Props {
		lastEvent: TrackerEvent | null;
		todaySessions: TrackerEvent[];
		onLogged: () => void | Promise<void>;
	}

	let { lastEvent, todaySessions, onLogged }: Props = $props();

	let loading = $state(false);
	let undoing = $state(false);

	async function undoLast() {
		if (!lastEvent) return;
		undoing = true;
		try {
			await fetch(`/api/events/${lastEvent.id}`, { method: 'DELETE' });
			await onLogged();
		} finally {
			undoing = false;
		}
	}

	let todayTotals = $derived.by(() => {
		let total = 0;
		for (const s of todaySessions) {
			try {
				const meta: BottleMeta = JSON.parse(s.metadata);
				total += meta.amount_ml;
			} catch { /* ignore */ }
		}
		return { total, count: todaySessions.length };
	});
	let showInput = $state(false);
	let pendingId = $state<number | null>(null);
	let amountMl = $state(60);

	function lastLabel(): string {
		if (!lastEvent) return '';
		try {
			const meta: BottleMeta = JSON.parse(lastEvent.metadata);
			return `${meta.amount_ml} ml`;
		} catch {
			return '';
		}
	}

	async function logBottle() {
		loading = true;
		try {
			const res = await fetch('/api/events', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'bottle', metadata: { amount_ml: amountMl } })
			});
			const event = await res.json();
			pendingId = event.id;
			showInput = true;
			onLogged();
		} finally {
			loading = false;
		}
	}

	async function updateAmount() {
		if (pendingId) {
			await fetch(`/api/events/${pendingId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ metadata: { amount_ml: amountMl } })
			});
			onLogged();
		}
		showInput = false;
		pendingId = null;
	}

	function adjustAmount(delta: number) {
		amountMl = Math.max(0, amountMl + delta);
	}
</script>

<TrackerCard title="Bottle" icon="🍼" color="#f0a060" {lastEvent} lastEventLabel={lastLabel()}>
	{#if todayTotals.count > 0}
		<div class="flex items-center justify-between mb-3 px-1">
			<span class="text-xs text-gray-400 dark:text-gray-500">Today ({todayTotals.count} bottle{todayTotals.count !== 1 ? 's' : ''})</span>
			<span class="text-sm font-bold text-baby-orange">{todayTotals.total} ml</span>
		</div>
	{/if}
	{#if showInput}
		<div class="space-y-3">
			<div class="flex items-center justify-center gap-4">
				<button
					class="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 text-xl font-bold text-gray-600 dark:text-gray-300
						active:bg-gray-200 dark:active:bg-gray-600 transition-colors"
					onclick={() => adjustAmount(-10)}
				>
					−
				</button>
				<div class="text-center">
					<input
						type="number"
						bind:value={amountMl}
						class="w-20 text-center text-3xl font-bold text-gray-800 dark:text-gray-100 border-b-2 border-baby-orange
							focus:outline-none bg-transparent"
						min="0"
						step="5"
					/>
					<p class="text-sm text-gray-400 dark:text-gray-500 mt-1">ml</p>
				</div>
				<button
					class="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 text-xl font-bold text-gray-600 dark:text-gray-300
						active:bg-gray-200 dark:active:bg-gray-600 transition-colors"
					onclick={() => adjustAmount(10)}
				>
					+
				</button>
			</div>
			<button
				class="w-full py-3 rounded-xl bg-baby-orange text-white font-semibold
					active:scale-95 transition-transform"
				onclick={updateAmount}
			>
				Save
			</button>
		</div>
	{:else}
		<div class="flex gap-2">
			<button
				class="flex-1 py-4 rounded-xl bg-baby-orange text-white text-lg font-semibold
					active:scale-95 transition-transform shadow-md hover:shadow-lg disabled:opacity-50"
				onclick={logBottle}
				disabled={loading}
			>
				{loading ? 'Logging...' : 'Fed Bottle'}
			</button>
			{#if lastEvent}
				<button
					class="px-4 py-4 rounded-xl bg-gray-100 dark:bg-gray-700 text-sm text-gray-400 dark:text-gray-500 font-medium
						hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
					onclick={undoLast}
					disabled={undoing}
				>
					{undoing ? '...' : 'Undo'}
				</button>
			{/if}
		</div>
	{/if}
</TrackerCard>
