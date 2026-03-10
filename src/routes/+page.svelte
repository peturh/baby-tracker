<script lang="ts">
	import DiaperTracker from '$lib/components/DiaperTracker.svelte';
	import NursingTracker from '$lib/components/NursingTracker.svelte';
	import PumpingTracker from '$lib/components/PumpingTracker.svelte';
	import SleepTracker from '$lib/components/SleepTracker.svelte';
	import type { TrackerEvent } from '$lib/types';

	let { data } = $props();

	let localLatest = $state<Record<string, TrackerEvent | null> | null>(null);
	let latest = $derived(localLatest ?? (data.latest as Record<string, TrackerEvent | null>));

	async function refresh() {
		const res = await fetch('/api/events?limit=50');
		const events: TrackerEvent[] = await res.json();

		const byType: Record<string, TrackerEvent | null> = {
			diaper: null,
			nursing: null,
			pumping: null,
			sleep: null
		};

		for (const event of events) {
			if (!byType[event.type]) {
				byType[event.type] = event;
			}
		}

		localLatest = byType;
	}
</script>

<svelte:head>
	<title>Baby Tracker</title>
	<meta name="description" content="Track baby activities" />
</svelte:head>

<div class="min-h-screen bg-gray-50 pb-8">
	<header class="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-5 py-3">
		<h1 class="text-xl font-bold text-gray-800 text-center">
			👶 Baby Tracker
		</h1>
	</header>

	<main class="max-w-lg mx-auto px-4 pt-4 space-y-4">
		<DiaperTracker lastEvent={latest.diaper} onLogged={refresh} />
		<NursingTracker lastEvent={latest.nursing} onLogged={refresh} />
		<PumpingTracker lastEvent={latest.pumping} onLogged={refresh} />
		<SleepTracker lastEvent={latest.sleep} onLogged={refresh} />
	</main>
</div>
