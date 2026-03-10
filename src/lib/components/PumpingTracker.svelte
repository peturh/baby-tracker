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
	let amountMl = $state(60);

	function lastLabel(): string {
		if (!lastEvent) return '';
		try {
			const meta: PumpingMeta = JSON.parse(lastEvent.metadata);
			return `${meta.amount_ml} ml`;
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
				body: JSON.stringify({ type: 'pumping', metadata: { amount_ml: amountMl } })
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

<TrackerCard title="Pumping" icon="🥛" color="#7bc67e" {lastEvent} lastEventLabel={lastLabel()}>
	{#if showInput}
		<div class="space-y-3">
			<div class="flex items-center justify-center gap-4">
				<button
					class="w-12 h-12 rounded-full bg-gray-100 text-xl font-bold text-gray-600
						active:bg-gray-200 transition-colors"
					onclick={() => adjustAmount(-10)}
				>
					−
				</button>
				<div class="text-center">
					<input
						type="number"
						bind:value={amountMl}
						class="w-20 text-center text-3xl font-bold text-gray-800 border-b-2 border-baby-green
							focus:outline-none bg-transparent"
						min="0"
						step="5"
					/>
					<p class="text-sm text-gray-400 mt-1">ml</p>
				</div>
				<button
					class="w-12 h-12 rounded-full bg-gray-100 text-xl font-bold text-gray-600
						active:bg-gray-200 transition-colors"
					onclick={() => adjustAmount(10)}
				>
					+
				</button>
			</div>
			<button
				class="w-full py-3 rounded-xl bg-baby-green text-white font-semibold
					active:scale-95 transition-transform"
				onclick={updateAmount}
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
