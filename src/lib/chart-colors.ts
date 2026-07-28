/**
 * Chart color references. These read the validated categorical/sequential
 * tokens defined in `globals.css` (fixed order — never reassign per chart)
 * rather than hard-coding hex values here.
 */
export const CHART_SERIES = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
  'var(--chart-8)',
] as const;

export const CHART_CHROME = {
  grid: 'var(--chart-grid)',
  axis: 'var(--chart-axis)',
  label: 'var(--chart-label)',
  surface: 'var(--chart-surface)',
} as const;
