import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek } from 'date-fns';

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(d)) {
    return formatDistanceToNow(d, { addSuffix: true });
  }
  
  if (isYesterday(d)) {
    return 'Yesterday at ' + format(d, 'h:mm a');
  }
  
  if (isThisWeek(d)) {
    return format(d, 'EEEE') + ' at ' + format(d, 'h:mm a');
  }
  
  return format(d, 'MMM d, yyyy');
}

export function formatFullDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMM d, yyyy • h:mm a');
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  
  return format(d, 'MMM d');
}
