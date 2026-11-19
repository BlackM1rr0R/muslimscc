// ═══════════════════════════════════════════════════════
// "Ayə fasiləsi" kartı (/focus) — bir ayə: ərəbcə + tərcümə, surə:ayə istinadı, keçid, dinlə
//
// Mətn saytın Quran mənbəyindəndir (components/quote/content → fetchAyah: alquran.cloud,
// QuranPage ilə eyni nəşrlər; tərcümənin nəşr adı göstərilir). Heç nə yaddaşdan yazılmır.
// Səs — həqiqi qiraət (AyahAudio: sevimli qari). fetchAyah sessionStorage-da keşləyir —
// səhifə ayəni diqqət mərhələsinin əvvəlində əvvəlcədən gətirir (fasilədə şəbəkə olmasa da görünsün).
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { pickUi } from '../../utils/uiText'
import { fetchAyah } from '../quote/content'
import AyahAudio from '../AyahAudio'
import { pathFor } from '../../seo/routes'
import { isPlainClick } from '../PageLink'

const T = {
  az: { loading: 'Ayə yüklənir…', failed: 'Ayə yüklənmədi. İnternet bağlantısını yoxlayın.', read: 'Kontekstdə oxu', translation: 'Tərcümə' },
  en: { loading: 'Loading the ayah…', failed: 'The ayah could not be loaded. Check your connection.', read: 'Read in context', translation: 'Translation' },
  ru: { loading: 'Загрузка аята…', failed: 'Не удалось загрузить аят. Проверьте подключение.', read: 'Читать в контексте', translation: 'Перевод' },
  ar: { loading: 'جارٍ تحميل الآية…', failed: 'تعذّر تحميل الآية. تحقّق من الاتصال.', read: 'اقرأ في سياقها', translation: 'الترجمة' },
  tr: { loading: 'Ayet yükleniyor…', failed: 'Ayet yüklenemedi. Bağlantınızı kontrol edin.', read: 'Bağlamında oku', translation: 'Meal' },
}

export default function FocusBreakAyah({ refAyah, lang, onNavigate }) {
  const t = pickUi(T, lang, 'en')
  const [st, setSt] = useState({ key: '', data: null, err: false })
  const key = refAyah ? `${refAyah.s}:${refAyah.a}|${lang}` : ''
  useEffect(() => {
    if (!refAyah) return undefined
    const ctrl = new AbortController()
    let alive = true
    fetchAyah(refAyah.s, refAyah.a, lang, ctrl.signal)
      .then((data) => { if (alive) setSt({ key, data, err: false }) })
      .catch(() => { if (alive) setSt({ key, data: null, err: true }) })
    return () => { alive = false; ctrl.abort() }
  }, [refAyah, lang, key])
  if (!refAyah) return null
  const cur = st.key === key ? st : { data: null, err: false }
  const href = `${pathFor('quran', lang, refAyah.s)}?a=${refAyah.a}`
  const go = (e) => { if (!isPlainClick(e) || !onNavigate) return; e.preventDefault(); onNavigate(href) }

  return (
    <figure className="fx-ayah" data-testid="focus-ayah" data-ref={`${refAyah.s}:${refAyah.a}`}>
      {!cur.data && !cur.err && <p className="fx-ayah__note" role="status">{t.loading}</p>}
      {cur.err && <p className="fx-ayah__note">{t.failed}</p>}
      {cur.data && (
        <>
          <blockquote className="fx-ayah__body">
            <p className="fx-ayah__ar" lang="ar" dir="rtl">{cur.data.ar}</p>
            {lang !== 'ar' && cur.data.text && <p className="fx-ayah__tr">{cur.data.text}</p>}
          </blockquote>
          <figcaption className="fx-ayah__cap">
            <span className="fx-ayah__ref ui-num">{cur.data.ref}</span>
            {lang !== 'ar' && cur.data.tname && <span className="fx-ayah__src">{t.translation}: {cur.data.tname}</span>}
          </figcaption>
        </>
      )}
      <div className="fx-ayah__actions">
        <AyahAudio s={refAyah.s} a={refAyah.a} size="lg" />
        <a className="ui-btn ui-btn--ghost ui-btn--sm" href={href} onClick={go}>{t.read}</a>
      </div>
    </figure>
  )
}
