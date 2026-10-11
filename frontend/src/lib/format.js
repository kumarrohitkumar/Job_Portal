export const JOB_TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Remote'];

/** Annual CTC in lakh rupees, e.g. 14 → "₹14 LPA", 3.5 → "₹3.5 LPA". */
export const formatSalary = (lpa) => `₹${Number(lpa).toLocaleString('en-IN', { maximumFractionDigits: 1 })} LPA`;

export const formatExperience = (years) => (years === 0 ? 'Freshers welcome' : `${years}+ ${years === 1 ? 'year' : 'years'}`);

export function timeAgo(iso, now = Date.now()) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [name, secs] of units) {
    const n = Math.floor(s / secs);
    if (n >= 1) return `${n} ${name}${n > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

export const formatDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';
