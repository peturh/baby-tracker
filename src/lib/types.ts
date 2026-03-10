export interface TrackerEvent {
	id: number;
	type: 'diaper' | 'nursing' | 'pumping' | 'sleep' | 'bottle' | 'vitamind' | 'tummytime';
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
	left_ml: number;
	right_ml: number;
}

export interface SleepMeta {
	start: string;
	end: string;
	period: 'day' | 'night';
}

export interface BottleMeta {
	amount_ml: number;
}

export interface TummyTimeMeta {
	duration_seconds: number;
}

export interface Appointment {
	id: number;
	datetime: string;
	location: string;
	purpose: string;
}
