<script lang="ts">
	import TrackerCard from './TrackerCard.svelte';
	import type { TrackerEvent, NursingMeta } from '$lib/types';

	interface Props {
		lastEvent: TrackerEvent | null;
		todayCount: number;
		onLogged: () => void | Promise<void>;
	}

	let { lastEvent, todayCount, onLogged }: Props = $props();

	let loading = $state(false);
	let undoing = $state(false);
	let showOptions = $state(false);
	let pendingId = $state<number | null>(null);
	let selectedSide = $state<NursingMeta['side']>('equal');

	function lastLabel(): string {
		if (!lastEvent) return '';
		try {
			const meta: NursingMeta = JSON.parse(lastEvent.metadata);
			return meta.side === 'left' ? 'Left' : meta.side === 'right' ? 'Right' : 'Equal';
		} catch {
			return '';
		}
	}

	async function logNursing() {
		loading = true;
		try {
			const res = await fetch('/api/events', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'nursing', metadata: { side: selectedSide } })
			});
			const event = await res.json();
			pendingId = event.id;
			showOptions = true;
			onLogged();
		} finally {
			loading = false;
		}
	}

	async function updateSide(side: NursingMeta['side']) {
		selectedSide = side;
		if (pendingId) {
			await fetch(`/api/events/${pendingId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ metadata: { side } })
			});
			onLogged();
		}
	}

	function dismiss() {
		showOptions = false;
		pendingId = null;
		selectedSide = 'equal';
	}

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
</script>

<TrackerCard title="Nursing" icon="🍼" color="#f0a0b0" {lastEvent} lastEventLabel={lastLabel()}>
	{#if todayCount > 0}
		<div class="flex items-center justify-between mb-3 px-1">
			<span class="text-xs text-gray-400">Today</span>
			<span class="text-sm font-bold text-baby-pink">{todayCount} feeding{todayCount !== 1 ? 's' : ''}</span>
		</div>
	{/if}
	{#if showOptions}
		<div class="space-y-3">
			<div class="flex gap-2">
				{#each ['left', 'right', 'equal'] as side}
					<button
						class="flex-1 py-3 rounded-xl text-sm font-semibold transition-all {selectedSide === side
							? 'bg-baby-pink text-white shadow-md scale-105'
							: 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
						onclick={() => updateSide(side as NursingMeta['side'])}
					>
						{side === 'left' ? '⬅️ Left' : side === 'right' ? '➡️ Right' : '⚖️ Equal'}
					</button>
				{/each}
			</div>
			<button
				class="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
				onclick={dismiss}
			>
				Done
			</button>
		</div>
	{:else}
		<div class="flex gap-2">
			<button
				class="flex-1 py-4 rounded-xl bg-baby-pink text-white text-lg font-semibold
					active:scale-95 transition-transform shadow-md hover:shadow-lg disabled:opacity-50"
				onclick={logNursing}
				disabled={loading}
			>
				{loading ? 'Logging...' : 'Nursed Baby'}
			</button>
			{#if lastEvent}
				<button
					class="px-4 py-4 rounded-xl bg-gray-100 text-sm text-gray-400 font-medium
						hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-50"
					onclick={undoLast}
					disabled={undoing}
				>
					{undoing ? '...' : 'Undo'}
				</button>
			{/if}
		</div>
	{/if}
</TrackerCard>
