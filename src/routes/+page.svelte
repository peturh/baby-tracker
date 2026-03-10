<script lang="ts">
	import { browser } from '$app/environment';
	import DiaperTracker from '$lib/components/DiaperTracker.svelte';
	import NursingTracker from '$lib/components/NursingTracker.svelte';
	import PumpingTracker from '$lib/components/PumpingTracker.svelte';
	import BottleTracker from '$lib/components/BottleTracker.svelte';
	import SleepTracker from '$lib/components/SleepTracker.svelte';
	import VitaminDTracker from '$lib/components/VitaminDTracker.svelte';
	import TummyTimeTracker from '$lib/components/TummyTimeTracker.svelte';
	import AppointmentsList from '$lib/components/AppointmentsList.svelte';
	import type { TrackerEvent, Appointment } from '$lib/types';

	let { data } = $props();

	let localLatest = $state<Record<string, TrackerEvent | null> | null>(null);
	let latest = $derived(localLatest ?? (data.latest as Record<string, TrackerEvent | null>));

	let localAppointments = $state<Appointment[] | null>(null);
	let appointments = $derived(localAppointments ?? (data.appointments as Appointment[]));

	let localTodayEvents = $state<Record<string, TrackerEvent[]> | null>(null);
	let todayEvents = $derived(localTodayEvents ?? (data.todayEvents as Record<string, TrackerEvent[]>));

	const ORDER_KEY = 'baby-tracker-section-order';
	const HIDDEN_KEY = 'baby-tracker-hidden-sections';
	const DEFAULT_ORDER = ['diaper', 'nursing', 'bottle', 'pumping', 'sleep', 'vitamind', 'tummytime', 'appointments'];

	let sectionOrder = $state<string[]>(DEFAULT_ORDER);
	let hiddenSections = $state<Set<string>>(new Set());
	let editingOrder = $state(false);
	let dragIndex = $state<number | null>(null);

	if (browser) {
		try {
			const stored = localStorage.getItem(ORDER_KEY);
			if (stored) {
				const parsed: string[] = JSON.parse(stored);
				const allPresent = DEFAULT_ORDER.every((s) => parsed.includes(s));
				const noExtras = parsed.every((s) => DEFAULT_ORDER.includes(s));
				if (allPresent && noExtras) sectionOrder = parsed;
			}
		} catch {
			// ignore
		}
		try {
			const stored = localStorage.getItem(HIDDEN_KEY);
			if (stored) {
				hiddenSections = new Set(JSON.parse(stored));
			}
		} catch {
			// ignore
		}
	}

	function saveOrder() {
		if (browser) localStorage.setItem(ORDER_KEY, JSON.stringify(sectionOrder));
	}

	function saveHidden() {
		if (browser) localStorage.setItem(HIDDEN_KEY, JSON.stringify([...hiddenSections]));
	}

	function toggleVisibility(section: string) {
		const next = new Set(hiddenSections);
		if (next.has(section)) next.delete(section);
		else next.add(section);
		hiddenSections = next;
		saveHidden();
	}

	function moveUp(i: number) {
		if (i <= 0) return;
		const arr = [...sectionOrder];
		[arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
		sectionOrder = arr;
		saveOrder();
	}

	function moveDown(i: number) {
		if (i >= sectionOrder.length - 1) return;
		const arr = [...sectionOrder];
		[arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
		sectionOrder = arr;
		saveOrder();
	}

	function handleDragStart(i: number) {
		dragIndex = i;
	}

	function handleDragOver(e: DragEvent, i: number) {
		e.preventDefault();
		if (dragIndex === null || dragIndex === i) return;
		const arr = [...sectionOrder];
		const [moved] = arr.splice(dragIndex, 1);
		arr.splice(i, 0, moved);
		sectionOrder = arr;
		dragIndex = i;
	}

	function handleDragEnd() {
		dragIndex = null;
		saveOrder();
	}


	const sectionLabels: Record<string, string> = {
		diaper: '🧷 Diaper',
		nursing: '🍼 Nursing',
		bottle: '🍼 Bottle',
		pumping: '🥛 Pumping',
		sleep: '😴 Sleep',
		vitamind: '☀️ Vitamin D',
		tummytime: '👣 Tummy Time',
		appointments: '📅 Appointments'
	};

	async function refresh() {
		const res = await fetch('/api/events?limit=50');
		const events: TrackerEvent[] = await res.json();

		const byType: Record<string, TrackerEvent | null> = {
			diaper: null,
			nursing: null,
			pumping: null,
			sleep: null,
			bottle: null,
			vitamind: null,
			tummytime: null
		};

		const todayStart = new Date();
		todayStart.setHours(0, 0, 0, 0);
		const todayByType: Record<string, TrackerEvent[]> = {
			tummytime: [],
			diaper: [],
			nursing: [],
			pumping: [],
			bottle: []
		};

		for (const event of events) {
			if (!byType[event.type]) {
				byType[event.type] = event;
			}
			if (event.type in todayByType && new Date(event.created_at) >= todayStart) {
				todayByType[event.type].push(event);
			}
		}

		localLatest = byType;
		localTodayEvents = todayByType;
	}

	async function refreshAppointments() {
		const res = await fetch('/api/appointments');
		localAppointments = await res.json();
	}
</script>

<svelte:head>
	<title>Baby Tracker</title>
	<meta name="description" content="Track baby activities" />
</svelte:head>

<div class="min-h-screen bg-gray-50 pb-8">
	<header class="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-5 py-3 flex items-center justify-center">
		<h1 class="text-xl font-bold text-gray-800">
			👶 Baby Tracker
		</h1>
		<button
			class="absolute right-4 w-9 h-9 flex items-center justify-center rounded-lg
				transition-colors {editingOrder ? 'bg-baby-blue text-white' : 'text-gray-400 hover:text-gray-600'}"
			onclick={() => (editingOrder = !editingOrder)}
			aria-label="Reorder sections"
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
				stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
				<polyline points="7 4 5 6 7 8" /><polyline points="17 10 19 12 17 14" /><polyline points="7 16 5 18 7 20" />
			</svg>
		</button>
	</header>

	{#if editingOrder}
		<div class="max-w-lg mx-auto px-4 pt-4 pb-2">
			<div class="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
				<div class="px-5 pt-4 pb-2">
					<p class="text-sm font-medium text-gray-500">Reorder or hide sections</p>
				</div>
				<div class="px-3 pb-3 space-y-1" role="list">
					{#each sectionOrder as section, i (section)}
						<div
							class="flex items-center gap-2 px-3 py-3 rounded-xl transition-colors
								{dragIndex === i ? 'bg-baby-blue/10 scale-[1.02]' : 'bg-gray-50'}"
							draggable="true"
							data-reorder-index={i}
							ondragstart={() => handleDragStart(i)}
							ondragover={(e) => handleDragOver(e, i)}
							ondragend={handleDragEnd}
							role="listitem"
						>
						<span class="text-gray-300 cursor-grab active:cursor-grabbing select-none text-lg">⠿</span>
						<span class="flex-1 text-sm font-medium {hiddenSections.has(section) ? 'text-gray-300 line-through' : 'text-gray-700'}">
							{sectionLabels[section]}
						</span>
						<button
							class="w-8 h-8 flex items-center justify-center rounded-lg transition-colors
								{hiddenSections.has(section) ? 'text-gray-300 hover:text-gray-500' : 'text-baby-blue hover:bg-blue-50'}"
							onclick={() => toggleVisibility(section)}
							aria-label="{hiddenSections.has(section) ? 'Show' : 'Hide'} {section}"
						>
							{#if hiddenSections.has(section)}
								<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
									stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
									<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
									<line x1="1" y1="1" x2="23" y2="23" />
								</svg>
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
									stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
									<circle cx="12" cy="12" r="3" />
								</svg>
							{/if}
						</button>
						<button
							class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
								hover:text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-20"
							onclick={() => moveUp(i)}
							disabled={i === 0}
							aria-label="Move up"
						>&#9650;</button>
						<button
							class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
								hover:text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-20"
							onclick={() => moveDown(i)}
							disabled={i === sectionOrder.length - 1}
							aria-label="Move down"
						>&#9660;</button>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<main class="max-w-lg mx-auto px-4 pt-4 space-y-4">
		{#each sectionOrder.filter((s) => !hiddenSections.has(s)) as section (section)}
			{#if section === 'diaper'}
				<DiaperTracker lastEvent={latest.diaper} todayCount={todayEvents.diaper?.length ?? 0} onLogged={refresh} />
			{:else if section === 'nursing'}
				<NursingTracker lastEvent={latest.nursing} todayCount={todayEvents.nursing?.length ?? 0} onLogged={refresh} />
			{:else if section === 'bottle'}
				<BottleTracker lastEvent={latest.bottle} todaySessions={todayEvents.bottle ?? []} onLogged={refresh} />
			{:else if section === 'pumping'}
				<PumpingTracker lastEvent={latest.pumping} todaySessions={todayEvents.pumping ?? []} onLogged={refresh} />
			{:else if section === 'sleep'}
				<SleepTracker lastEvent={latest.sleep} onLogged={refresh} />
			{:else if section === 'vitamind'}
				<VitaminDTracker lastEvent={latest.vitamind} onLogged={refresh} />
			{:else if section === 'tummytime'}
				<TummyTimeTracker lastEvent={latest.tummytime} todaySessions={todayEvents.tummytime ?? []} onLogged={refresh} />
			{:else if section === 'appointments'}
				<AppointmentsList {appointments} onChanged={refreshAppointments} />
			{/if}
		{/each}
	</main>
</div>
