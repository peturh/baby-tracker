export interface TrackerEvent {
	id: number;
	type: 'diaper' | 'nursing' | 'pumping' | 'sleep';
	created_at: string;
	metadata: string;
}

export interface DiaperMeta {
	subtype: 'pee' | 'poop' | 'mixed';
}

export interface NursingMeta {
	side: 'left' | 'right' | 'equal';
}

export interface PumpingMeta {
	amount_ml: number;
}

export interface SleepMeta {
	start: string;
	end: string;
	period: 'day' | 'night';
}
