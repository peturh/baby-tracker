<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { TrackerEvent } from '$lib/types';
	import { timeAgo, formatTime } from '$lib/time';

	interface Props {
		title: string;
		icon: string;
		color: string;
		lastEvent: TrackerEvent | null;
		lastEventLabel?: string;
		children: Snippet;
	}

	let { title, icon, color, lastEvent, lastEventLabel = '', children }: Props = $props();

	let relativeTime = $state('');

	$effect(() => {
		if (!lastEvent) return;
		const update = () => {
			relativeTime = timeAgo(lastEvent.created_at);
		};
		update();
		const interval = setInterval(update, 30_000);
		return () => clearInterval(interval);
	});
</script>

<div class="rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
	<div class="px-5 pt-4 pb-3 flex items-center justify-between">
		<div class="flex items-center gap-2.5">
			<span class="text-2xl">{icon}</span>
			<h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
		</div>
		{#if lastEvent}
			<div class="text-right">
				<p class="text-sm font-medium" style="color: {color}">{relativeTime}</p>
				<p class="text-xs text-gray-400 dark:text-gray-500">
					{formatTime(lastEvent.created_at)}
					{#if lastEventLabel}
						&middot; {lastEventLabel}
					{/if}
				</p>
			</div>
		{:else}
			<p class="text-sm text-gray-400 dark:text-gray-500">No entries yet</p>
		{/if}
	</div>
	<div class="px-5 pb-5">
		{@render children()}
	</div>
</div>
