export function formatClock(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function formatRelative(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  const deltaSeconds = Math.max(0, Math.round((now - then) / 1000));

  if (deltaSeconds < 15) return "Just now";
  if (deltaSeconds < 60) return `${deltaSeconds} sec ago`;

  const minutes = Math.round(deltaSeconds / 60);
  if (minutes === 1) return "1 min ago";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours === 1) return "1 hr ago";
  return `${hours} hr ago`;
}
