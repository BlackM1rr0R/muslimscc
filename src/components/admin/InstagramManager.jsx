// ═══════════════════════════════════════════════════════
// Admin: Instagram avtoposteri (server/instagram.js, docs/INSTAGRAM.md) — oxumaq üçün bölmə
//   GET  /api/admin/instagram          — vəziyyət, yuvalar, növbəti yuva, son dərclər (admin / superadmin)
//   POST /api/admin/instagram/preview  — kartın önizləməsi (JPEG), DƏRC ETMİR (yalnız superadmin)
//   POST /api/admin/instagram/publish  — bu günün yuvasını indi dərc et, təsdiqlə (yalnız superadmin)
// Token və hesab açarları heç vaxt brauzerə gəlmir.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useState } from 'react'
import { useLang } from '../../contexts/LangContext'
import { pickUi } from '../../utils/uiText'
import { apiFetch } from '../../api/http'
import { AdminHeader, AdminEmpty, AdminAlert, SectionTitle } from './AdminUi'
import { Confirm } from '../community/CommunityUi'
import '../../styles/ReadTogether.css'

const T = {
  az: {
    title: 'Instagram', lead: 'Gündə 3 dəfə avtomatik post və story: günün ayəsi, hədisi, duası və ya Allahın adı — yalnız saytın mətnləri, mənbəsi ilə.',
    loading: 'Yüklənir...', loadErr: 'Məlumatı yükləmək olmadı.', status: 'Vəziyyət', on: 'Açıqdır', off: 'Sönülüdür',
    reasons: { disabled: 'IG_ENABLED=1 təyin edilməyib', missing_credentials: 'IG_ACCESS_TOKEN və ya IG_USER_ID yoxdur', bad_format: 'Giriş açarı və ya hesab ID-si yararsızdır', auth_error: 'Instagram giriş açarını qəbul etmədi — yeni açar lazımdır' },
    lang: 'Dil', stories: 'Story', yes: 'Bəli', no: 'Xeyr', slots: 'Yuvalar', next: 'Növbəti yuva', token: 'Giriş açarı', tokenEnv: 'api.env-dən', tokenRefreshed: 'avtomatik yenilənib', expires: 'bitir',
    kinds: { ayah: 'Ayə', hadith: 'Hədis', extra: 'Dua / Allahın adı', dua: 'Dua', name: 'Allahın adı' },
    posts: 'Son dərclər', none: 'Hələ dərc yoxdur.', st: { published: 'Dərc olunub', claimed: 'Gedir', retry: 'Təkrar gözləyir', failed: 'Alınmadı' },
    preview: 'Kartın önizləməsi', previewLead: 'Kart çəkilir və burada göstərilir — Instagram-a heç nə göndərilmir.', slot: 'Yuva', format: 'Format', feed: 'Post (4:5)', story: 'Story (9:16)',
    show: 'Kartı göstər', busy: 'Hazırlanır...', previewErr: 'Kartı hazırlamaq olmadı.', noItem: 'Kartda sığan mətn tapılmadı.', caption: 'Mətn (caption)', alt: 'Instagram kartının önizləməsi',
    publish: 'İndi dərc et', publishLead: 'Bu günün seçilmiş yuvası dərhal Instagram-a göndərilir (post + story). Hər yuva üçün gündə bir dəfə.',
    confirm: 'Həqiqətən Instagram-a dərc edilsin?', cancel: 'Ləğv et', sent: 'Göndərildi — nəticə bir neçə dəqiqəyə "Son dərclər"də görünəcək.', publishErr: 'Dərc başlamadı.',
  },
  en: {
    title: 'Instagram', lead: 'Automatic post and story 3 times a day: verse, hadith, dua or a name of Allah of the day — only the site’s own texts, with their source.',
    loading: 'Loading...', loadErr: 'Could not load the data.', status: 'Status', on: 'On', off: 'Off',
    reasons: { disabled: 'IG_ENABLED=1 is not set', missing_credentials: 'IG_ACCESS_TOKEN or IG_USER_ID is missing', bad_format: 'The token or account ID is invalid', auth_error: 'Instagram rejected the token — a new token is needed' },
    lang: 'Language', stories: 'Story', yes: 'Yes', no: 'No', slots: 'Slots', next: 'Next slot', token: 'Token', tokenEnv: 'from api.env', tokenRefreshed: 'refreshed automatically', expires: 'expires',
    kinds: { ayah: 'Verse', hadith: 'Hadith', extra: 'Dua / Name of Allah', dua: 'Dua', name: 'Name of Allah' },
    posts: 'Recent posts', none: 'Nothing has been published yet.', st: { published: 'Published', claimed: 'In progress', retry: 'Waiting to retry', failed: 'Failed' },
    preview: 'Card preview', previewLead: 'The card is rendered and shown here — nothing is sent to Instagram.', slot: 'Slot', format: 'Format', feed: 'Post (4:5)', story: 'Story (9:16)',
    show: 'Show card', busy: 'Preparing...', previewErr: 'Could not prepare the card.', noItem: 'No text fits on the card.', caption: 'Caption', alt: 'Instagram card preview',
    publish: 'Publish now', publishLead: 'Today’s chosen slot is sent to Instagram right away (post + story). Once per slot per day.',
    confirm: 'Really publish to Instagram?', cancel: 'Cancel', sent: 'Sent — the result will appear under “Recent posts” in a few minutes.', publishErr: 'Publishing did not start.',
  },
  ru: {
    title: 'Instagram', lead: 'Автоматический пост и история 3 раза в день: аят, хадис, дуа или имя Аллаха дня — только тексты сайта, с источником.',
    loading: 'Загрузка...', loadErr: 'Не удалось загрузить данные.', status: 'Состояние', on: 'Включено', off: 'Выключено',
    // lang-ok: api.env dəyişənlərinin adları (IG_ENABLED, api.env) tərcümə olunmur
    reasons: { disabled: 'IG_ENABLED=1 не задан', missing_credentials: 'Нет IG_ACCESS_TOKEN или IG_USER_ID', bad_format: 'Токен или ID аккаунта недействительны', auth_error: 'Instagram не принял токен — нужен новый токен' },
    // lang-ok: api.env dəyişənlərinin adları (IG_ENABLED, api.env) tərcümə olunmur
    lang: 'Язык', stories: 'История', yes: 'Да', no: 'Нет', slots: 'Время публикаций', next: 'Следующая публикация', token: 'Токен', tokenEnv: 'из api.env', tokenRefreshed: 'обновлён автоматически', expires: 'истекает',
    kinds: { ayah: 'Аят', hadith: 'Хадис', extra: 'Дуа / имя Аллаха', dua: 'Дуа', name: 'Имя Аллаха' },
    posts: 'Последние публикации', none: 'Публикаций пока нет.', st: { published: 'Опубликовано', claimed: 'Выполняется', retry: 'Ждёт повтора', failed: 'Не удалось' },
    preview: 'Предпросмотр карточки', previewLead: 'Карточка создаётся и показывается здесь — в Instagram ничего не отправляется.', slot: 'Публикация', format: 'Формат', feed: 'Пост (4:5)', story: 'История (9:16)',
    show: 'Показать карточку', busy: 'Готовится...', previewErr: 'Не удалось подготовить карточку.', noItem: 'Не найден текст, который помещается на карточку.', caption: 'Подпись', alt: 'Предпросмотр карточки Instagram',
    publish: 'Опубликовать сейчас', publishLead: 'Выбранная публикация сегодняшнего дня сразу отправляется в Instagram (пост + история). Один раз в день для каждой.',
    confirm: 'Точно опубликовать в Instagram?', cancel: 'Отмена', sent: 'Отправлено — результат появится в «Последних публикациях» через несколько минут.', publishErr: 'Публикация не началась.',
  },
  ar: {
    title: 'إنستغرام', lead: 'منشور وقصة تلقائيًا 3 مرات يوميًا: آية اليوم أو حديثه أو دعاؤه أو اسم من أسماء الله — من نصوص الموقع فقط مع مصدرها.',
    loading: 'جارٍ التحميل...', loadErr: 'تعذّر تحميل البيانات.', status: 'الحالة', on: 'مفعّل', off: 'متوقف',
    // lang-ok: api.env dəyişənlərinin adları (IG_ENABLED, api.env) tərcümə olunmur
    reasons: { disabled: 'لم يُضبط IG_ENABLED=1', missing_credentials: 'IG_ACCESS_TOKEN أو IG_USER_ID غير موجود', bad_format: 'الرمز أو معرّف الحساب غير صالح', auth_error: 'رفض إنستغرام الرمز — يلزم رمز جديد' },
    // lang-ok: api.env dəyişənlərinin adları (IG_ENABLED, api.env) tərcümə olunmur
    lang: 'اللغة', stories: 'القصة', yes: 'نعم', no: 'لا', slots: 'أوقات النشر', next: 'النشر التالي', token: 'الرمز', tokenEnv: 'من api.env', tokenRefreshed: 'جُدّد تلقائيًا', expires: 'ينتهي',
    kinds: { ayah: 'آية', hadith: 'حديث', extra: 'دعاء / اسم من أسماء الله', dua: 'دعاء', name: 'اسم من أسماء الله' },
    posts: 'آخر المنشورات', none: 'لم يُنشر شيء بعد.', st: { published: 'نُشر', claimed: 'قيد التنفيذ', retry: 'بانتظار إعادة المحاولة', failed: 'تعذّر' },
    preview: 'معاينة البطاقة', previewLead: 'تُنشأ البطاقة وتُعرض هنا — لا يُرسل شيء إلى إنستغرام.', slot: 'وقت النشر', format: 'الشكل', feed: 'منشور (4:5)', story: 'قصة (9:16)',
    show: 'اعرض البطاقة', busy: 'جارٍ التحضير...', previewErr: 'تعذّر تحضير البطاقة.', noItem: 'لم يُعثر على نص يتسع في البطاقة.', caption: 'نص المنشور', alt: 'معاينة بطاقة إنستغرام',
    publish: 'انشر الآن', publishLead: 'يُرسل وقت النشر المختار لهذا اليوم إلى إنستغرام فورًا (منشور + قصة). مرة واحدة يوميًا لكل وقت.',
    confirm: 'هل تريد النشر على إنستغرام فعلًا؟', cancel: 'إلغاء', sent: 'أُرسل — ستظهر النتيجة في «آخر المنشورات» خلال دقائق.', publishErr: 'لم يبدأ النشر.',
  },
  tr: {
    title: 'Instagram', lead: 'Günde 3 kez otomatik gönderi ve hikâye: günün ayeti, hadisi, duası veya Allah’ın bir ismi — yalnızca sitenin metinleri, kaynağıyla.',
    loading: 'Yükleniyor...', loadErr: 'Veriler yüklenemedi.', status: 'Durum', on: 'Açık', off: 'Kapalı',
    reasons: { disabled: 'IG_ENABLED=1 ayarlanmamış', missing_credentials: 'IG_ACCESS_TOKEN veya IG_USER_ID yok', bad_format: 'Token veya hesap kimliği geçersiz', auth_error: 'Instagram token’ı kabul etmedi — yeni token gerekli' },
    lang: 'Dil', stories: 'Hikâye', yes: 'Evet', no: 'Hayır', slots: 'Paylaşım saatleri', next: 'Sonraki paylaşım', token: 'Token', tokenEnv: 'api.env’den', tokenRefreshed: 'otomatik yenilendi', expires: 'bitiş',
    kinds: { ayah: 'Ayet', hadith: 'Hadis', extra: 'Dua / Allah’ın ismi', dua: 'Dua', name: 'Allah’ın ismi' },
    posts: 'Son paylaşımlar', none: 'Henüz paylaşım yok.', st: { published: 'Paylaşıldı', claimed: 'Sürüyor', retry: 'Yeniden deneme bekliyor', failed: 'Olmadı' },
    preview: 'Kart önizlemesi', previewLead: 'Kart hazırlanır ve burada gösterilir — Instagram’a hiçbir şey gönderilmez.', slot: 'Paylaşım', format: 'Biçim', feed: 'Gönderi (4:5)', story: 'Hikâye (9:16)',
    show: 'Kartı göster', busy: 'Hazırlanıyor...', previewErr: 'Kart hazırlanamadı.', noItem: 'Karta sığan metin bulunamadı.', caption: 'Açıklama', alt: 'Instagram kartı önizlemesi',
    publish: 'Şimdi paylaş', publishLead: 'Bugünün seçilen paylaşımı hemen Instagram’a gönderilir (gönderi + hikâye). Her paylaşım için günde bir kez.',
    confirm: 'Gerçekten Instagram’da paylaşılsın mı?', cancel: 'İptal', sent: 'Gönderildi — sonuç birkaç dakika içinde “Son paylaşımlar”da görünecek.', publishErr: 'Paylaşım başlamadı.',
  },
}

const fmtTime = (ms, lang) => {
  if (!ms) return ''
  try { return new Date(ms).toLocaleString(lang === 'az' ? 'az-Latn-AZ' : lang, { dateStyle: 'medium', timeStyle: 'short' }) } catch { return new Date(ms).toISOString().slice(0, 16) }
}

export default function InstagramManager({ superAdmin = false }) {
  const { lang } = useLang()
  const l = pickUi(T, lang, 'en')
  const [data, setData] = useState(null)
  const [failed, setFailed] = useState(false)
  const load = useCallback(() => {
    setFailed(false)
    return apiFetch('/api/admin/instagram', { admin: true }).then(setData).catch(() => { setFailed(true); setData(null) })
  }, [])
  useEffect(() => { load() }, [load])

  return (
    <div data-testid="admin-instagram">
      <AdminHeader icon="instagram" title={l.title} sub={l.lead} />
      {failed && <AdminAlert>{l.loadErr}</AdminAlert>}
      {!data && !failed && <AdminEmpty icon="instagram" busy>{l.loading}</AdminEmpty>}
      {data && <Status l={l} lang={lang} data={data} />}
      {data && superAdmin && <Preview l={l} slots={data.slots} />}
      {data && superAdmin && data.enabled && data.reason !== 'auth_error' && <PublishNow l={l} slots={data.slots} onDone={load} />}
      {data && <Posts l={l} lang={lang} posts={data.posts} />}
    </div>
  )
}

function Status({ l, lang, data }) {
  const on = data.enabled && data.reason !== 'auth_error'
  return (
    <section className="admin-section" aria-label={l.status}>
      <SectionTitle icon="instagram" tone={on ? undefined : 'neutral'}>{l.status}: {on ? l.on : l.off}</SectionTitle>
      {!on && data.reason && <p className="admin-section-lead" data-testid="ig-reason">{l.reasons[data.reason] || data.reason}</p>}
      <dl className="ig-facts">
        <div><dt>{l.lang}</dt><dd>{String(data.lang || '').toUpperCase()}</dd></div>
        <div><dt>{l.stories}</dt><dd>{data.stories ? l.yes : l.no}</dd></div>
        <div><dt>{l.slots}</dt><dd>{data.slots.map((s) => `${s.time} — ${l.kinds[s.kind] || s.kind}`).join(' · ')} <span className="rt-note">({data.timezone})</span></dd></div>
        {data.next && <div><dt>{l.next}</dt><dd>{data.next.date} {data.next.time} — {l.kinds[data.next.kind] || data.next.kind}</dd></div>}
        {data.token && <div><dt>{l.token}</dt><dd>{data.token.source === 'refreshed' ? l.tokenRefreshed : l.tokenEnv}{data.token.refreshedAt ? ` · ${fmtTime(data.token.refreshedAt, lang)}` : ''}{data.token.expiresAt ? ` · ${l.expires} ${fmtTime(data.token.expiresAt, lang)}` : ''}</dd></div>}
      </dl>
    </section>
  )
}

function SlotPicker({ l, slots, value, onChange, id }) {
  return (
    <label className="ig-field" htmlFor={id}>
      <span>{l.slot}</span>
      <select id={id} className="ui-input" value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {slots.map((s, i) => <option key={s.time} value={i}>{s.time} — {l.kinds[s.kind] || s.kind}</option>)}
      </select>
    </label>
  )
}

function Preview({ l, slots }) {
  const [slot, setSlot] = useState(0)
  const [format, setFormat] = useState('feed')
  const [busy, setBusy] = useState(false)
  const [img, setImg] = useState(null)
  const [caption, setCaption] = useState('')
  const [err, setErr] = useState('')
  useEffect(() => () => { if (img) URL.revokeObjectURL(img) }, [img])
  const show = async () => {
    setBusy(true); setErr('')
    try {
      const r = await fetch('/api/admin/instagram/preview', {
        method: 'POST', credentials: 'include', cache: 'no-store',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({ slot, format }),
      })
      if (!r.ok) {
        const j = await r.json().catch(() => null)
        setErr(j && j.code === 'no_fitting_item' ? l.noItem : l.previewErr)
        return
      }
      const blob = await r.blob()
      let cap = ''
      try { cap = decodeURIComponent(r.headers.get('X-Ig-Caption') || '') } catch { /* */ }
      setCaption(cap)
      setImg(URL.createObjectURL(blob))
    } catch { setErr(l.previewErr) } finally { setBusy(false) }
  }
  return (
    <section className="admin-section" aria-label={l.preview}>
      <SectionTitle icon="eye">{l.preview}</SectionTitle>
      <p className="admin-section-lead">{l.previewLead}</p>
      <div className="ig-row">
        <SlotPicker l={l} slots={slots} value={slot} onChange={setSlot} id="ig-preview-slot" />
        <label className="ig-field" htmlFor="ig-preview-format">
          <span>{l.format}</span>
          <select id="ig-preview-format" className="ui-input" value={format} onChange={(e) => setFormat(e.target.value === 'story' ? 'story' : 'feed')}>
            <option value="feed">{l.feed}</option>
            <option value="story">{l.story}</option>
          </select>
        </label>
        <button type="button" className="ui-btn ui-btn--primary" onClick={show} disabled={busy} data-testid="ig-preview-btn">{busy ? l.busy : l.show}</button>
      </div>
      {err && <AdminAlert>{err}</AdminAlert>}
      {img && (
        <div className="ig-preview">
          <img src={img} alt={l.alt} width={format === 'story' ? 270 : 324} height={format === 'story' ? 480 : 405} data-testid="ig-preview-img" />
          {caption && <div><h3 className="ig-caption-title">{l.caption}</h3><pre className="ig-caption" dir="auto">{caption}</pre></div>}
        </div>
      )}
    </section>
  )
}

function PublishNow({ l, slots, onDone }) {
  const [slot, setSlot] = useState(0)
  const [msg, setMsg] = useState(null)
  const go = () => {
    setMsg(null)
    apiFetch('/api/admin/instagram/publish', { method: 'POST', admin: true, body: { slot, confirm: true } })
      .then(() => { setMsg({ ok: true, text: l.sent }); setTimeout(onDone, 4000) })
      .catch(() => setMsg({ ok: false, text: l.publishErr }))
  }
  return (
    <section className="admin-section" aria-label={l.publish}>
      <SectionTitle icon="send" tone="accent">{l.publish}</SectionTitle>
      <p className="admin-section-lead">{l.publishLead}</p>
      <div className="ig-row">
        <SlotPicker l={l} slots={slots} value={slot} onChange={setSlot} id="ig-publish-slot" />
        <Confirm t={{ confirm: l.confirm, yes: l.yes, cancel: l.cancel }} label={l.publish} icon="send" testId="ig-publish" onYes={go} />
      </div>
      {msg && (msg.ok ? <p className="rt-note" role="status">{msg.text}</p> : <AdminAlert>{msg.text}</AdminAlert>)}
    </section>
  )
}

function Posts({ l, lang, posts }) {
  return (
    <section className="admin-section" aria-label={l.posts}>
      <SectionTitle icon="list">{l.posts}</SectionTitle>
      {!posts.length && <AdminEmpty icon="instagram">{l.none}</AdminEmpty>}
      {posts.length > 0 && (
        <div className="ig-table-wrap">
          <table className="ig-table">
            <tbody>
              {posts.map((p) => (
                <tr key={`${p.day}-${p.slot}-${p.format}`}>
                  <td>{p.day} {p.slot}</td>
                  <td>{p.format === 'story' ? l.story : l.feed}</td>
                  <td>{l.kinds[p.kind] || p.kind}{p.item ? <span className="rt-note"> · {p.item}</span> : null}</td>
                  <td>{l.st[p.status] || p.status}{p.error && p.status !== 'published' ? <span className="rt-note"> · {p.error}</span> : null}</td>
                  <td className="rt-note">{fmtTime(p.updated_at, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
