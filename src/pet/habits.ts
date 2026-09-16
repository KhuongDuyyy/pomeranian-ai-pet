import { keepMemory, type Memory } from './memory.js';

// Use one explicit timezone for calendar memories, independent of server location.
const calendar = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' });
function localTime(at: string) {
  const parts = calendar.formatToParts(new Date(at));
  const value = (type: string) => parts.find(part => part.type === type)!.value;
  return { day: `${value('year')}-${value('month')}-${value('day')}`, hour: Number(value('hour')) };
}
const periods = ['ban đêm', 'buổi sáng', 'buổi chiều', 'buổi tối'] as const;
const labels: Record<string, string> = { headScratch: 'Được vuốt đầu', play: 'Chơi cùng bạn' };
export function currentHabitActions(memory: Memory, now: string): Array<'bringToy' | 'requestAttention'> {
  if (!Number.isFinite(Date.parse(now))) return [];
  const period = Math.floor(localTime(now).hour / 6);
  return learnedHabits(memory, now).filter(habit => habit.period === period).map(habit => habit.action === 'play' ? 'bringToy' : 'requestAttention');
}
export function learnedHabits(memory: Memory, now = new Date().toISOString()) {
  const end = Date.parse(now);
  const groups = new Map<string, { action: string; period: number; days: Set<string> }>();
  for (const event of memory.episodic) {
    const time = Date.parse(event.at);
    if (!labels[event.action] || !Number.isFinite(time) || time > end || time < end - 28 * 86400000) continue;
    const local = localTime(event.at);
    const period = Math.floor(local.hour / 6);
    const key = `${event.action}:${period}`;
    const group = groups.get(key) ?? { action: event.action, period, days: new Set<string>() };
    group.days.add(local.day);
    groups.set(key, group);
  }
  return [...groups.entries()].filter(([, group]) => group.days.size >= 3).map(([key, group]) => ({ key, action: group.action, period: group.period, days: group.days.size, description: `${labels[group.action]} vào ${periods[group.period]}` })).sort((a, b) => b.days - a.days || a.key.localeCompare(b.key));
}

export function recordCalendarMemories(memory: Memory, now: string): void {
  const first = Date.parse(memory.profile.firstMet);
  const current = Date.parse(now);
  if (!Number.isFinite(first) || !Number.isFinite(current) || current < first) return;
  const today = localTime(now).day;
  const firstDay = localTime(memory.profile.firstMet).day;
  const days = Math.round((Date.parse(today) - Date.parse(firstDay)) / 86400000);
  const title = days === 7 ? 'Một tuần kể từ ngày gặp nhau' : days === 30 ? '30 ngày kể từ ngày gặp nhau' : days === 100 ? '100 ngày kể từ ngày gặp nhau' : null;
  // Only record a day actually experienced together, never fabricate missed dates.
  if (title) keepMemory(memory, { key: `calendar:days:${days}`, title, at: now, importance: 100 });
}
