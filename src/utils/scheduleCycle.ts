export const SCHEDULE_WEEK_MEMORY_KEY = 'akademi_takip_firebase_v1_schedule_week_memory';

export interface CalendarWeekBounds {
  mondayKey: string;
  weekEpochIndex: number;
  dateRangeLabel: string;
  nextMondayLabel: string;
}

export interface ScheduleWeekMemory {
  mondayKey: string;
  weekEpochIndex: number;
  activeWeek: 1 | 2;
  selectedWeek: 1 | 2;
  pendingResetMondayKey?: string | null;
  lastResetMondayKey?: string | null;
}

export interface ResolvedScheduleWeekState {
  selectedWeek: 1 | 2;
  activeCycleWeek: 1 | 2;
  pendingResetMondayKey: string | null;
  justTransitionedFromWeek2ToWeek1: boolean;
}

/**
 * Local timezone YYYY-MM-DD key (avoids UTC midnight drift).
 */
export function getLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getYesterdayDateKey(date: Date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - 1);
  return getLocalDateKey(d);
}

/**
 * Exact calendar day difference between two YYYY-MM-DD strings (toDateKey - fromDateKey).
 */
export function diffCalendarDays(fromDateKey: string, toDateKey: string): number {
  if (!fromDateKey || !toDateKey) return 0;
  const fromParts = fromDateKey.split('-').map(Number);
  const toParts = toDateKey.split('-').map(Number);
  if (fromParts.length !== 3 || toParts.length !== 3) return 0;
  if (fromParts.some(Number.isNaN) || toParts.some(Number.isNaN)) return 0;

  const fromUtc = Date.UTC(fromParts[0], fromParts[1] - 1, fromParts[2]);
  const toUtc = Date.UTC(toParts[0], toParts[1] - 1, toParts[2]);
  return Math.round((toUtc - fromUtc) / 86400000);
}

/**
 * Computes Monday 00:00 - Sunday 23:59 week bounds in local time.
 */
export function getCalendarWeekBounds(now: Date = new Date()): CalendarWeekBounds {
  const localNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = localNow.getDay() === 0 ? 7 : localNow.getDay(); // 1 = Pazartesi ... 7 = Pazar
  const mondayDate = new Date(localNow);
  mondayDate.setDate(localNow.getDate() - (dayOfWeek - 1));
  mondayDate.setHours(0, 0, 0, 0);

  const sundayDate = new Date(mondayDate);
  sundayDate.setDate(mondayDate.getDate() + 6);

  const nextMondayDate = new Date(mondayDate);
  nextMondayDate.setDate(mondayDate.getDate() + 7);

  const mondayKey = getLocalDateKey(mondayDate);

  // Epoch Monday: 2024-01-01 00:00 local
  const epochMonday = new Date(2024, 0, 1, 0, 0, 0, 0);
  const weekEpochIndex = Math.round((mondayDate.getTime() - epochMonday.getTime()) / (7 * 86400000));

  const fmtShort = (dt: Date) =>
    dt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });

  return {
    mondayKey,
    weekEpochIndex,
    dateRangeLabel: `${fmtShort(mondayDate)} Pzt – ${fmtShort(sundayDate)} Paz`,
    nextMondayLabel: `${fmtShort(sundayDate)} Pazar 23:59 → ${fmtShort(nextMondayDate)} Pazartesi 00:00`,
  };
}

function readStoredMemory(): ScheduleWeekMemory | null {
  try {
    const raw = localStorage.getItem(SCHEDULE_WEEK_MEMORY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ScheduleWeekMemory>;
    if (!parsed || (parsed.activeWeek !== 1 && parsed.activeWeek !== 2)) return null;
    return {
      mondayKey: parsed.mondayKey || '',
      weekEpochIndex: typeof parsed.weekEpochIndex === 'number' ? parsed.weekEpochIndex : 0,
      activeWeek: parsed.activeWeek,
      selectedWeek: parsed.selectedWeek === 1 || parsed.selectedWeek === 2 ? parsed.selectedWeek : parsed.activeWeek,
      pendingResetMondayKey: parsed.pendingResetMondayKey ?? null,
      lastResetMondayKey: parsed.lastResetMondayKey ?? null,
    };
  } catch {
    return null;
  }
}

function writeStoredMemory(mem: ScheduleWeekMemory): void {
  try {
    localStorage.setItem(SCHEDULE_WEEK_MEMORY_KEY, JSON.stringify(mem));
  } catch {}
}

/**
 * Resolves the active/remembered week (1 or 2) and automatically flags a 2-week completion reset
 * whenever Sunday 23:59 -> Monday 00:00 transitions from 2. Hafta into 1. Hafta (or skips >= 2 weeks).
 */
export function resolveScheduleWeekState(bounds: CalendarWeekBounds = getCalendarWeekBounds()): ResolvedScheduleWeekState {
  const stored = readStoredMemory();

  if (stored) {
    if (stored.mondayKey === bounds.mondayKey) {
      const remembered = stored.selectedWeek;
      const pending =
        stored.pendingResetMondayKey && stored.pendingResetMondayKey !== stored.lastResetMondayKey
          ? stored.pendingResetMondayKey
          : null;
      return {
        selectedWeek: remembered,
        activeCycleWeek: remembered,
        pendingResetMondayKey: pending,
        justTransitionedFromWeek2ToWeek1: false,
      };
    }

    // A new calendar week (Monday 00:00) has started!
    const prevIdx = stored.weekEpochIndex || bounds.weekEpochIndex - 1;
    const diffWeeks = bounds.weekEpochIndex - prevIdx;
    const absDiff = Math.abs(diffWeeks);
    const baseWeek = stored.selectedWeek || stored.activeWeek;
    const nextWeek: 1 | 2 = absDiff % 2 === 1 ? (baseWeek === 1 ? 2 : 1) : baseWeek;

    // 2. Hafta Pazar -> 1. Hafta Pazartesi (or >= 2 full weeks elapsed forward)
    const crossedWeek2ToWeek1 =
      diffWeeks > 0 && ((baseWeek === 2 && nextWeek === 1) || diffWeeks >= 2);

    const nextPendingReset =
      crossedWeek2ToWeek1 && stored.lastResetMondayKey !== bounds.mondayKey
        ? bounds.mondayKey
        : stored.pendingResetMondayKey && stored.pendingResetMondayKey !== stored.lastResetMondayKey
        ? stored.pendingResetMondayKey
        : null;

    writeStoredMemory({
      mondayKey: bounds.mondayKey,
      weekEpochIndex: bounds.weekEpochIndex,
      activeWeek: nextWeek,
      selectedWeek: nextWeek,
      pendingResetMondayKey: nextPendingReset,
      lastResetMondayKey: stored.lastResetMondayKey ?? null,
    });

    return {
      selectedWeek: nextWeek,
      activeCycleWeek: nextWeek,
      pendingResetMondayKey: nextPendingReset,
      justTransitionedFromWeek2ToWeek1: crossedWeek2ToWeek1,
    };
  }

  // First initialization
  const autoWeek: 1 | 2 = Math.abs(bounds.weekEpochIndex) % 2 === 0 ? 1 : 2;
  writeStoredMemory({
    mondayKey: bounds.mondayKey,
    weekEpochIndex: bounds.weekEpochIndex,
    activeWeek: autoWeek,
    selectedWeek: autoWeek,
    pendingResetMondayKey: null,
    lastResetMondayKey: null,
  });

  return {
    selectedWeek: autoWeek,
    activeCycleWeek: autoWeek,
    pendingResetMondayKey: null,
    justTransitionedFromWeek2ToWeek1: false,
  };
}

export function saveSelectedScheduleWeek(week: 1 | 2, bounds: CalendarWeekBounds = getCalendarWeekBounds()): void {
  const stored = readStoredMemory();
  writeStoredMemory({
    mondayKey: bounds.mondayKey,
    weekEpochIndex: bounds.weekEpochIndex,
    activeWeek: week,
    selectedWeek: week,
    pendingResetMondayKey: stored?.pendingResetMondayKey ?? null,
    lastResetMondayKey: stored?.lastResetMondayKey ?? null,
  });
}

export function markScheduleResetCompleted(mondayKey: string): void {
  const stored = readStoredMemory();
  const bounds = getCalendarWeekBounds();
  writeStoredMemory({
    mondayKey: stored?.mondayKey || bounds.mondayKey,
    weekEpochIndex: stored?.weekEpochIndex ?? bounds.weekEpochIndex,
    activeWeek: stored?.activeWeek || 1,
    selectedWeek: stored?.selectedWeek || 1,
    pendingResetMondayKey: null,
    lastResetMondayKey: mondayKey,
  });
}
