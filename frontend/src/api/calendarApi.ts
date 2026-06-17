import { apiClient } from './client';

export interface CalendarEvent {
  date: string;
  title: string;
  type: string;
  sourceId: number;
}

export async function listCalendarEvents(): Promise<CalendarEvent[]> {
  const { data } = await apiClient.get<CalendarEvent[]>('/api/v1/calendar/events');
  return data;
}
