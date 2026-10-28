// ═══════════════════════════════════════════════════════
// Admin siyahılarında çoxdilli məzmunun göstərilməsi
//
// Admin paneli də seçilmiş dildə saf olmalıdır: elementin cari dildə mətni
// yoxdursa, BAŞQA DİLİN mətni göstərilmir — yerinə cari dildə solğun
// "(bu dildə mətn yoxdur)" qeydi çıxır ki, admin tərcüməni əlavə etsin.
// ═══════════════════════════════════════════════════════
import { pickLang } from '../../utils/pickLang'

// Siyahıda yer tutucu göstərilir — konsol xəbərdarlığı lazım deyil
const NOWARN = { warn: false }

export const NO_TEXT = {
  az: '(bu dildə mətn yoxdur)',
  en: '(no text in this language)',
  ru: '(нет текста на этом языке)',
  ar: '(لا يوجد نص بهذه اللغة)',
  tr: '(bu dilde metin yok)',
}

/** Cari dildəki mətn və ya '' — başqa dilə düşmür. */
export const adminPick = (v, lang) => pickLang(v, lang, NOWARN)

/** Mətn varsa onu, yoxdursa solğun "bu dildə mətn yoxdur" qeydini göstərir. */
export function AdminText({ value, lang }) {
  const text = adminPick(value, lang)
  if (text) return text
  return <span className="admin-notext">{NO_TEXT[lang]}</span>
}
