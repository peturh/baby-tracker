<script lang="ts">
	import TrackerCard from './TrackerCard.svelte';
	import type { TrackerEvent, DiaperMeta } from '$lib/types';

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
	let selectedType = $state<DiaperMeta['subtype']>('mixed');

	function lastLabel(): string {
		if (!lastEvent) return '';
		try {
			const meta: DiaperMeta = JSON.parse(lastEvent.metadata);
			return meta.subtype;
		} catch {
			return '';
		}
	}

	async function logDiaper() {
		loading = true;
		try {
			const res = await fetch('/api/events', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'diaper', metadata: { subtype: selectedType } })
			});
			const event = await res.json();
			pendingId = event.id;
			showOptions = true;
			onLogged();
		} finally {
			loading = false;
		}
	}

	async function updateType(subtype: DiaperMeta['subtype']) {
		selectedType = subtype;
		if (pendingId) {
			await fetch(`/api/events/${pendingId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ metadata: { subtype } })
			});
			onLogged();
		}
	}

	function dismiss() {
		showOptions = false;
		pendingId = null;
		selectedType = 'mixed';
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

<TrackerCard title="Diaper" icon="🧷" color="#6bb7e0" {lastEvent} lastEventLabel={lastLabel()}>
	{#if todayCount > 0}
		<div class="flex items-center justify-between mb-3 px-1">
			<span class="text-xs text-gray-400 dark:text-gray-500">Today</span>
			<span class="text-sm font-bold text-baby-blue">{todayCount} diaper{todayCount !== 1 ? 's' : ''}</span>
		</div>
	{/if}
	{#if showOptions}
		<div class="space-y-3">
			<div class="flex gap-2">
				{#each ['pee', 'poop', 'mixed'] as subtype}
					<button
						class="flex-1 py-3 rounded-xl text-sm font-semibold transition-all {selectedType === subtype
							? 'bg-baby-blue text-white shadow-md scale-105'
							: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}"
						onclick={() => updateType(subtype as DiaperMeta['subtype'])}
					>
						{subtype === 'pee' ? '💧 Pee' : subtype === 'poop' ? '💩 Poop' : '🔄 Mixed'}
					</button>
				{/each}
			</div>
			<button
				class="w-full py-2 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
				onclick={dismiss}
			>
				Done
			</button>
		</div>
	{:else}
		<div class="flex gap-2">
			<button
				class="flex-1 py-4 rounded-xl bg-baby-blue text-white text-lg font-semibold
					active:scale-95 transition-transform shadow-md hover:shadow-lg disabled:opacity-50"
				onclick={logDiaper}
				disabled={loading}
			>
				{loading ? 'Logging...' : 'Changed Diaper'}
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
