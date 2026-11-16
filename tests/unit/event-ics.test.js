import { describe, it, expect } from 'vitest'
import { eventIcs } from '../../src/utils/eventIcs.js'

describe('tək hadisə .ics', () => {
  it('UTC vaxtı, xəbərdarlıq və qaçış simvolları', () => {
    const s = eventIcs({ uid: 'rasd-1', start: Date.UTC(2027, 4, 27, 9, 18), title: 'Günəş Kəbənin üstündə; qiblə', alarmMin: 10, now: 0 })
    expect(s).toContain('DTSTART:20270527T091800Z')
    expect(s).toContain('DTEND:20270527T092300Z')
    expect(s).toContain('TRIGGER:-PT10M')
    expect(s).toContain('SUMMARY:Günəş Kəbənin üstündə\\; qiblə')
    expect(s.split('\r\n')[0]).toBe('BEGIN:VCALENDAR')
  })
})
