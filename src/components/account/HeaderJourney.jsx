// ═══════════════════════════════════════════════════════
// Başlıqdakı avatar (J7 + J3/J5) — yol mərhələsinin çərçivəsi və ildönümü / ad günü işarəsi
// HeaderAccount bunu tənbəl yükləyir (yalnız daxil olmuş istifadəçidə). İşarə — kiçik nöqtə:
// həmin gün /account-da bayram kartı var və hələ bağlanmayıb (mcc_celebrate_v1).
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import JourneyFrame from './JourneyFrame'
import { pickUi } from '../../utils/uiText'
import { anniversaryOf, birthdayToday, readBirthday, readCelebrate, localDay, JOURNEY_EVENT } from '../../utils/journeyStore'

const L = {
  az: { a: 'Bu gün hesabınızın ildönümüdür', b: 'Bu gün ad gününüzdür' },
  en: { a: 'Today is your account’s anniversary', b: 'Today is your birthday' },
  ru: { a: 'Сегодня годовщина вашего аккаунта', b: 'Сегодня ваш день рождения' },
  ar: { a: 'اليوم ذكرى إنشاء حسابك', b: 'اليوم يوم ميلادك' },
  tr: { a: 'Bugün hesabınızın yıl dönümü', b: 'Bugün doğum gününüz' },
}

function dueKind(user) {
  const today = localDay()
  const y = Number(today.slice(0, 4))
  const seen = readCelebrate()
  if (anniversaryOf(user?.createdAt, today) && seen.a !== y) return 'a'
  if (birthdayToday(readBirthday(), today) && seen.b !== y) return 'b'
  return ''
}

export default function HeaderJourney({ user, lang = 'az', children }) {
  const t = pickUi(L, lang, 'en')
  const [due, setDue] = useState(() => dueKind(user))
  useEffect(() => {
    const re = () => setDue(dueKind(user))
    re()
    window.addEventListener(JOURNEY_EVENT, re)
    window.addEventListener('storage', re)
    return () => { window.removeEventListener(JOURNEY_EVENT, re); window.removeEventListener('storage', re) }
  }, [user])
  return (
    <JourneyFrame live size="sm">
      {children}
      {/* Bəzək: düymənin öz adı (aria-label) dəyişmir; kartın özü /account-dadır */}
      {due && <span className="jf__flag" data-testid="hdr-celebrate" aria-hidden="true" title={t[due]} />}
    </JourneyFrame>
  )
}
