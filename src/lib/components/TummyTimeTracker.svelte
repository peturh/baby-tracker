<script lang="ts">
	import TrackerCard from './TrackerCard.svelte';
	import type { TrackerEvent, TummyTimeMeta } from '$lib/types';
	import { formatTime } from '$lib/time';

	interface Props {
		lastEvent: TrackerEvent | null;
		todaySessions: TrackerEvent[];
		onLogged: () => void;
	}

	let { lastEvent, todaySessions, onLogged }: Props = $props();

	let running = $state(false);
	let elapsed = $state(0);
	let saving = $state(false);
	let timerRef: ReturnType<typeof setInterval> | null = null;

	let todayTotal = $derived(
		todaySessions.reduce((sum, s) => {
			try {
				const meta: TummyTimeMeta = JSON.parse(s.metadata);
				return sum + meta.duration_seconds;
			} catch {
				return sum;
			}
		}, 0)
	);

	function lastLabel(): string {
		if (!lastEvent) return '';
		try {
			const meta: TummyTimeMeta = JSON.parse(lastEvent.metadata);
			return formatDuration(meta.duration_seconds);
		} catch {
			return '';
		}
	}

	function formatDuration(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		if (m === 0) return `${s}s`;
		return `${m}m ${s}s`;
	}

	function sessionDuration(event: TrackerEvent): string {
		try {
			const meta: TummyTimeMeta = JSON.parse(event.metadata);
			return formatDuration(meta.duration_seconds);
		} catch {
			return '?';
		}
	}

	function start() {
		elapsed = 0;
		running = true;
		timerRef = setInterval(() => {
			elapsed++;
		}, 1000);
	}

	async function stop() {
		running = false;
		if (timerRef) {
			clearInterval(timerRef);
			timerRef = null;
		}
		if (elapsed < 1) return;

		saving = true;
		try {
			await fetch('/api/events', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: 'tummytime',
					metadata: { duration_seconds: elapsed }
				})
			});
			onLogged();
		} finally {
			saving = false;
			elapsed = 0;
		}
	}
</script>

<TrackerCard title="Tummy Time" icon="👣" color="#5bb5a6" {lastEvent} lastEventLabel={lastLabel()}>
	{#if running}
		<div class="space-y-3">
			<div class="text-center">
				<p class="text-4xl font-bold text-gray-800 tabular-nums">
					{formatDuration(elapsed)}
				</p>
				<p class="text-sm text-gray-400 mt-1">Timer running</p>
			</div>
			<button
				class="w-full py-4 rounded-xl bg-red-400 text-white text-lg font-semibold
					active:scale-95 transition-transform shadow-md"
				onclick={stop}
			>
				{saving ? 'Saving...' : 'Stop & Save'}
			</button>
		</div>
	{:else}
		{#if todaySessions.length > 0}
			<div class="mb-3 flex flex-wrap gap-1.5">
				{#each todaySessions as session (session.id)}
					<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-baby-teal/10 text-xs font-medium text-baby-teal">
						{sessionDuration(session)}
						<span class="text-baby-teal/50">{formatTime(session.created_at)}</span>
					</span>
				{/each}
			</div>
			<div class="flex items-center justify-between mb-3 px-1">
				<span class="text-xs text-gray-400">Today's total</span>
				<span class="text-sm font-bold text-baby-teal">{formatDuration(todayTotal)}</span>
			</div>
		{/if}
		<button
			class="w-full py-4 rounded-xl bg-baby-teal text-white text-lg font-semibold
				active:scale-95 transition-transform shadow-md hover:shadow-lg"
			onclick={start}
		>
			Start Tummy Time
		</button>
	{/if}
</TrackerCard>
