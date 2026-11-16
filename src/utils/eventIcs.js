// ═══════════════════════════════════════════════════════
// Tək hadisə üçün .ics faylı (telefon təqvimi xatırladır — sayt bağlı olsa da)
// RasdQibla: "Günəş Kəbənin üstündə" anı, 10 dəqiqə əvvəl xəbərdarlıq.
// ═══════════════════════════════════════════════════════
const stamp = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1')

/** @returns {string} iCalendar mətni (UTC vaxtı, VALARM — alarmMin dəqiqə əvvəl) */
export function eventIcs({ uid, start, minutes = 5, title, description = '', alarmMin = 10, now = Date.now() }) {
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//muslims.cc//rasd//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}@muslims.cc`, `DTSTAMP:${stamp(now)}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(start + minutes * 60000)}`,
    `SUMMARY:${esc(title)}`, `DESCRIPTION:${esc(description)}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(title)}`, `TRIGGER:-PT${alarmMin}M`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR', '',
  ].join('\r\n')
}
