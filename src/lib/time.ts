export function timeAgo(dateStr: string): string {
	const now = Date.now();
	const then = new Date(dateStr).getTime();
	const diffMs = now - then;

	const minutes = Math.floor(diffMs / 60_000);
	if (minutes < 1) return 'just now';
	if (minutes < 60) return `${minutes}m ago`;

	const hours = Math.floor(minutes / 60);
	if (hours < 24) {
		const remainMin = minutes % 60;
		return remainMin > 0 ? `${hours}h ${remainMin}m ago` : `${hours}h ago`;
	}

	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

export function formatTime(dateStr: string): string {
	return new Date(dateStr).toLocaleTimeString([], {
		hour: '2-digit',
		minute: '2-digit'
	});
}
