export const BOOKING_STATUS_COLORS = {
  PENDING: 'yellow',
  APPROVED: 'green',
  REJECTED: 'red',
  CANCELLED: 'gray',
};

export const bookingBadgeClass = (status) => {
  const normalized = String(status || 'PENDING').toUpperCase();
  return `booking-badge booking-badge-${BOOKING_STATUS_COLORS[normalized] || 'gray'}`;
};

export const normalizeTime = (value) => {
  if (!value) return '';
  const stringValue = String(value);
  if (stringValue.includes('T')) {
    return stringValue.split('T')[1].slice(0, 5);
  }
  return stringValue.slice(0, 5);
};

export const toDateKey = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const toMonthLabel = (date) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date);

export const startOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const endOfWeek = (date) => {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
};

export const buildMonthGrid = (baseDate) => {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const start = startOfWeek(firstDay);

  return Array.from({ length: 42 }, (_, index) => {
    const cellDate = new Date(start);
    cellDate.setDate(start.getDate() + index);
    return cellDate;
  });
};

export const isPastDateTime = (dateValue, timeValue) => {
  if (!dateValue || !timeValue) return false;
  const candidate = new Date(`${dateValue}T${timeValue}:00`);
  return candidate.getTime() < Date.now();
};

export const compareTime = (startTime, endTime) => {
  if (!startTime || !endTime) return false;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return eh * 60 + em > sh * 60 + sm;
};
