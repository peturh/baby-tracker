<script lang="ts">
	import TrackerCard from './TrackerCard.svelte';
	import type { TrackerEvent, PumpingMeta } from '$lib/types';

	interface Props {
		lastEvent: TrackerEvent | null;
		todaySessions: TrackerEvent[];
		onLogged: () => void | Promise<void>;
	}

	let { lastEvent, todaySessions, onLogged }: Props = $props();

	let loading = $state(false);
	let undoing = $state(false);
	let showInput = $state(false);

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
	let pendingId = $state<number | null>(null);
	let leftMl = $state(30);
	let rightMl = $state(30);

	let totalMl = $derived(leftMl + rightMl);

	let todayTotals = $derived.by(() => {
		let left = 0, right = 0;
		for (const s of todaySessions) {
			try {
				const meta = JSON.parse(s.metadata);
				if ('left_ml' in meta) {
					left += meta.left_ml ?? 0;
					right += meta.right_ml ?? 0;
				} else if ('amount_ml' in meta) {
					left += Math.round((meta.amount_ml ?? 0) / 2);
					right += Math.round((meta.amount_ml ?? 0) / 2);
				}
			} catch { /* ignore */ }
		}
		return { left, right, total: left + right, count: todaySessions.length };
	});

	function lastLabel(): string {
		if (!lastEvent) return '';
		try {
			const meta = JSON.parse(lastEvent.metadata);
			if ('left_ml' in meta) {
				return `${meta.left_ml + meta.right_ml} ml (L${meta.left_ml} / R${meta.right_ml})`;
			} else if ('amount_ml' in meta) {
				return `${meta.amount_ml} ml`;
			}
			return '';
		} catch {
			return '';
		}
	}

	async function logPumping() {
		loading = true;
		try {
			const res = await fetch('/api/events', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'pumping', metadata: { left_ml: leftMl, right_ml: rightMl } })
			});
			const event = await res.json();
			pendingId = event.id;
			showInput = true;
			onLogged();
		} finally {
			loading = false;
		}
	}

	async function save() {
		if (pendingId) {
			await fetch(`/api/events/${pendingId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ metadata: { left_ml: leftMl, right_ml: rightMl } })
			});
			onLogged();
		}
		showInput = false;
		pendingId = null;
	}

	function adjust(side: 'left' | 'right', delta: number) {
		if (side === 'left') leftMl = Math.max(0, leftMl + delta);
		else rightMl = Math.max(0, rightMl + delta);
	}
</script>

<TrackerCard title="Pumping" icon="🥛" color="#7bc67e" {lastEvent} lastEventLabel={lastLabel()}>
	{#if todayTotals.count > 0}
		<div class="mb-3 px-1 space-y-1">
			<div class="flex items-center justify-between">
				<span class="text-xs text-gray-400 dark:text-gray-500">Today ({todayTotals.count} session{todayTotals.count !== 1 ? 's' : ''})</span>
				<span class="text-sm font-bold text-baby-green">{todayTotals.total} ml</span>
			</div>
			<div class="flex gap-3 text-xs text-gray-400 dark:text-gray-500">
				<span>L: {todayTotals.left} ml</span>
				<span>R: {todayTotals.right} ml</span>
			</div>
		</div>
	{/if}
	{#if showInput}
		<div class="space-y-3">
			<div class="flex gap-3">
				{#each ['left', 'right'] as side}
					{@const val = side === 'left' ? leftMl : rightMl}
					<div class="flex-1">
						<p class="text-xs text-gray-400 dark:text-gray-500 font-medium text-center mb-1">
							{side === 'left' ? '⬅️ Left' : '➡️ Right'}
						</p>
						<div class="flex items-center justify-center gap-2">
							<button
								class="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 text-base font-bold text-gray-600 dark:text-gray-300
									active:bg-gray-200 dark:active:bg-gray-600 transition-colors"
								onclick={() => adjust(side as 'left' | 'right', -10)}
							>−</button>
							<input
								type="number"
								value={val}
								oninput={(e) => {
									const v = Math.max(0, parseInt(e.currentTarget.value) || 0);
									if (side === 'left') leftMl = v; else rightMl = v;
								}}
								class="w-14 text-center text-xl font-bold text-gray-800 dark:text-gray-100 border-b-2 border-baby-green
									focus:outline-none bg-transparent"
								min="0"
								step="5"
							/>
							<button
								class="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 text-base font-bold text-gray-600 dark:text-gray-300
									active:bg-gray-200 dark:active:bg-gray-600 transition-colors"
								onclick={() => adjust(side as 'left' | 'right', 10)}
							>+</button>
						</div>
						<p class="text-xs text-gray-400 dark:text-gray-500 text-center mt-0.5">ml</p>
					</div>
				{/each}
			</div>
			<p class="text-center text-sm font-semibold text-gray-500 dark:text-gray-400">Total: {totalMl} ml</p>
			<button
				class="w-full py-3 rounded-xl bg-baby-green text-white font-semibold
					active:scale-95 transition-transform"
				onclick={save}
			>
				Save
			</button>
		</div>
	{:else}
		<div class="flex gap-2">
			<button
				class="flex-1 py-4 rounded-xl bg-baby-green text-white text-lg font-semibold
					active:scale-95 transition-transform shadow-md hover:shadow-lg disabled:opacity-50"
				onclick={logPumping}
				disabled={loading}
			>
				{loading ? 'Logging...' : 'Used Pump'}
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
