<script lang="ts">
	import type { Appointment } from '$lib/types';

	interface Props {
		appointments: Appointment[];
		onChanged: () => void;
	}

	let { appointments, onChanged }: Props = $props();

	let showForm = $state(false);
	let loading = $state(false);
	let datetime = $state('');
	let location = $state('');
	let purpose = $state('');

	function initForm() {
		const now = new Date();
		now.setDate(now.getDate() + 1);
		now.setHours(10, 0, 0, 0);
		datetime = now.toISOString().slice(0, 16);
		location = '';
		purpose = '';
		showForm = true;
	}

	async function addAppointment() {
		if (!datetime || !location) return;
		loading = true;
		try {
			await fetch('/api/appointments', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ datetime, location, purpose })
			});
			showForm = false;
			onChanged();
		} finally {
			loading = false;
		}
	}

	async function deleteAppointment(id: number) {
		await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
		onChanged();
	}

	function formatDate(dt: string): string {
		const d = new Date(dt);
		const now = new Date();
		const diffDays = Math.floor((d.getTime() - now.getTime()) / 86_400_000);

		const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		const date = d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

		if (diffDays === 0) return `Today ${time}`;
		if (diffDays === 1) return `Tomorrow ${time}`;
		return `${date} ${time}`;
	}
</script>

<div class="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
	<div class="px-5 pt-4 pb-3 flex items-center justify-between">
		<div class="flex items-center gap-2.5">
			<span class="text-2xl">📅</span>
			<h2 class="text-lg font-semibold text-gray-800">Appointments</h2>
		</div>
		{#if appointments.length > 0}
			<p class="text-sm font-medium text-baby-orange">
				{appointments.length} upcoming
			</p>
		{:else}
			<p class="text-sm text-gray-400">None scheduled</p>
		{/if}
	</div>

	<div class="px-5 pb-5 space-y-3">
		{#if appointments.length > 0}
			<div class="space-y-2">
				{#each appointments as apt (apt.id)}
					<div class="flex items-start justify-between gap-3 p-3 rounded-xl bg-gray-50">
						<div class="min-w-0 flex-1">
							<p class="text-sm font-semibold text-gray-700">{formatDate(apt.datetime)}</p>
							<p class="text-sm text-gray-500">{apt.location}</p>
							{#if apt.purpose}
								<p class="text-xs text-gray-400 mt-0.5">{apt.purpose}</p>
							{/if}
						</div>
						<button
							class="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg
								text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
							onclick={() => deleteAppointment(apt.id)}
							aria-label="Delete appointment"
						>
							&times;
						</button>
					</div>
				{/each}
			</div>
		{/if}

		{#if showForm}
			<form class="space-y-2" onsubmit={(e) => { e.preventDefault(); addAppointment(); }}>
				<input
					type="datetime-local"
					bind:value={datetime}
					class="w-full px-3 py-2.5 rounded-xl bg-gray-50 text-gray-800
						text-sm focus:outline-none focus:ring-2 focus:ring-baby-orange border border-gray-200"
				/>
				<input
					type="text"
					bind:value={location}
					placeholder="Location"
					class="w-full px-3 py-2.5 rounded-xl bg-gray-50 text-gray-800
						text-sm placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-baby-orange border border-gray-200"
				/>
				<input
					type="text"
					bind:value={purpose}
					placeholder="Purpose (optional)"
					class="w-full px-3 py-2.5 rounded-xl bg-gray-50 text-gray-800
						text-sm placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-baby-orange border border-gray-200"
				/>
				<div class="flex gap-2">
					<button
						type="submit"
						disabled={loading || !datetime || !location}
						class="flex-1 py-3 rounded-xl bg-baby-orange text-white font-semibold
							active:scale-95 transition-transform disabled:opacity-50"
					>
						{loading ? 'Adding...' : 'Add'}
					</button>
					<button
						type="button"
						class="py-3 px-4 rounded-xl text-sm text-gray-400 hover:text-gray-600"
						onclick={() => (showForm = false)}
					>
						Cancel
					</button>
				</div>
			</form>
		{:else}
			<button
				class="w-full py-4 rounded-xl bg-baby-orange text-white text-lg font-semibold
					active:scale-95 transition-transform shadow-md hover:shadow-lg"
				onclick={initForm}
			>
				New Appointment
			</button>
		{/if}
	</div>
</div>
