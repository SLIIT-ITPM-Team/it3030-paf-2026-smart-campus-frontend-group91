export const SLA_LIMITS = {
  LOW:      { firstResponse: 60,  resolution: 480 },
  MEDIUM:   { firstResponse: 30,  resolution: 240 },
  HIGH:     { firstResponse: 10,  resolution: 60  },
  CRITICAL: { firstResponse: 5,   resolution: 30  },
};

export const minutesSince = (dateStr) => {
  if (!dateStr) return 0;
  return (Date.now() - new Date(dateStr).getTime()) / 60000;
};

export const formatCountdown = (remainingMinutes) => {
  if (remainingMinutes <= 0) return null;
  const totalSeconds = Math.floor(remainingMinutes * 60);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};
