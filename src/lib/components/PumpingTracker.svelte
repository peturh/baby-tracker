<script lang="ts">
	import TrackerCard from './TrackerCard.svelte';
	import type { TrackerEvent, PumpingMeta } from '$lib/types';

	interface Props {
		lastEvent: TrackerEvent | null;
		onLogged: () => void;
	}

	let { lastEvent, onLogged }: Props = $props();

	let loading = $state(false);
	let showInput = $state(false);
	let pendingId = $state<number | null>(null);
	let leftMl = $state(30);
	let rightMl = $state(30);

	let totalMl = $derived(leftMl + rightMl);

	function lastLabel(): string {
		if (!lastEvent) return '';
		try {
			const meta: PumpingMeta = JSON.parse(lastEvent.metadata);
			return `${meta.left_ml + meta.right_ml} ml (L${meta.left_ml} / R${meta.right_ml})`;
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
	{#if showInput}
		<div class="space-y-3">
			<div class="flex gap-3">
				{#each ['left', 'right'] as side}
					{@const val = side === 'left' ? leftMl : rightMl}
					<div class="flex-1">
						<p class="text-xs text-gray-400 font-medium text-center mb-1">
							{side === 'left' ? '⬅️ Left' : '➡️ Right'}
						</p>
						<div class="flex items-center justify-center gap-2">
							<button
								class="w-9 h-9 rounded-full bg-gray-100 text-base font-bold text-gray-600
									active:bg-gray-200 transition-colors"
								onclick={() => adjust(side as 'left' | 'right', -10)}
							>−</button>
							<input
								type="number"
								value={val}
								oninput={(e) => {
									const v = Math.max(0, parseInt(e.currentTarget.value) || 0);
									if (side === 'left') leftMl = v; else rightMl = v;
								}}
								class="w-14 text-center text-xl font-bold text-gray-800 border-b-2 border-baby-green
									focus:outline-none bg-transparent"
								min="0"
								step="5"
							/>
							<button
								class="w-9 h-9 rounded-full bg-gray-100 text-base font-bold text-gray-600
									active:bg-gray-200 transition-colors"
								onclick={() => adjust(side as 'left' | 'right', 10)}
							>+</button>
						</div>
						<p class="text-xs text-gray-400 text-center mt-0.5">ml</p>
					</div>
				{/each}
			</div>
			<p class="text-center text-sm font-semibold text-gray-500">Total: {totalMl} ml</p>
			<button
				class="w-full py-3 rounded-xl bg-baby-green text-white font-semibold
					active:scale-95 transition-transform"
				onclick={save}
			>
				Save
			</button>
		</div>
	{:else}
		<button
			class="w-full py-4 rounded-xl bg-baby-green text-white text-lg font-semibold
				active:scale-95 transition-transform shadow-md hover:shadow-lg disabled:opacity-50"
			onclick={logPumping}
			disabled={loading}
		>
			{loading ? 'Logging...' : 'Used Pump'}
		</button>
	{/if}
</TrackerCard>
