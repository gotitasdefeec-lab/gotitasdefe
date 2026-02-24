export interface StoreScheduleDay {
  day: string; // Ej: 'Lunes'
  open: string; // '08:00'
  close: string; // '18:00'
  closed: boolean;
}

export interface StoreSchedule {
  days: StoreScheduleDay[];
}
