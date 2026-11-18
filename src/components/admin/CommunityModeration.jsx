// ═══════════════════════════════════════════════════════
// Admin: icma moderasiyası (K mərhələsi) — panel rolu editor / admin / superadmin (hamısı)
//   Dua divarı (server/duaWall.js):   GET /api/admin/dua-wall?status=, POST /api/admin/dua-wall/:id
//   Qadağan sözlər:                    GET/POST /api/admin/dua-wall/banned, DELETE …/banned/:word
//   Açıq profil şikayətləri:           GET /api/admin/moderation/profiles, POST …/profiles/:handle
//   Məscid nümayəndələri (mosqueRep):  GET /api/admin/mosques, DELETE …/:id, DELETE …/:id/announcements/:aid
// Moderator yalnız məzmunu görür — müəllifin e-poçtu / hesabı göstərilmir (server onları göndərmir).
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useId, useState } from 'react'
import { useLang } from '../../contexts/LangContext'
import { pickUi } from '../../utils/uiText'
import Icon from '../Icon'
import { AdminHeader, AdminEmpty, AdminAlert, AdminToast, SectionTitle } from './AdminUi'
import {
  adminDuaWall, adminDecideDua, adminBannedWords, adminAddBanned, adminRemoveBanned,
  adminProfileReports, adminModerateProfile, adminMosques, adminDeleteMosque, adminDeleteMosqueAnnouncement,
} from '../../api/community'
import '../../styles/ReadTogether.css'
import '../../styles/Community.css'

const LABELS = {
  az: {
    title: 'Dua divarına nəzarət', sub: 'Dua istəkləri, qadağan sözlər, açıq profil şikayətləri və məscid nümayəndələri',
    tabs: { wall: 'Dua divarı', banned: 'Qadağan sözlər', profiles: 'Profil şikayətləri', mosques: 'Məscidlər' },
    status: { pending: 'Gözləyən', approved: 'Təsdiqlənmiş', rejected: 'Rədd edilmiş' },
    reported: 'şikayət', prayed: 'dua', anon: 'Anonim', approve: 'Təsdiqlə', reject: 'Rədd et', del: 'Sil', reason: 'Səbəb',
    reasons: { personal_info: 'Şəxsi məlumat', not_dua: 'Dua istəyi deyil', inappropriate: 'Uyğunsuz', duplicate: 'Təkrar', commercial: 'Reklam', other: 'Başqa' },
    none: 'Burada heç nə yoxdur', expired: 'müddəti bitib', done: 'Yadda saxlanıldı', failed: 'Alınmadı',
    word: 'Söz və ya ifadə', add: 'Əlavə et', bannedLead: 'Bu sözləri ehtiva edən istək avtomatik qəbul olunmur (söz üzrə, böyük-kiçik hərf fərqi yoxdur).',
    hide: 'Gizlət (mətnlər silinir)', dismiss: 'Şikayəti rədd et', reports: 'Şikayətlər', reps: 'aktiv nümayəndə',
    clear: 'Məscidin məlumatını sil', iqama: 'İqamə', jumuah: 'Cümə', ann: 'Elanlar', forbidden: 'Bu bölmə üçün panelə e-poçt və şifrə ilə yenidən daxil olun',
    confirm: 'Əminsiniz?', yes: 'Bəli', cancel: 'Ləğv et',
  },
  en: {
    title: 'Dua wall moderation', sub: 'Dua requests, banned words, public profile reports and mosque representatives',
    tabs: { wall: 'Dua wall', banned: 'Banned words', profiles: 'Profile reports', mosques: 'Mosques' },
    status: { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' },
    reported: 'reports', prayed: 'duas', anon: 'Anonymous', approve: 'Approve', reject: 'Reject', del: 'Delete', reason: 'Reason',
    reasons: { personal_info: 'Personal details', not_dua: 'Not a dua request', inappropriate: 'Inappropriate', duplicate: 'Duplicate', commercial: 'Advertising', other: 'Other' },
    none: 'Nothing here', expired: 'expired', done: 'Saved', failed: 'Failed',
    word: 'Word or phrase', add: 'Add', bannedLead: 'Requests containing these words are rejected automatically (whole words, case-insensitive).',
    hide: 'Hide (texts are removed)', dismiss: 'Dismiss reports', reports: 'Reports', reps: 'active representatives',
    clear: 'Delete mosque data', iqama: 'Iqamah', jumuah: 'Friday', ann: 'Announcements', forbidden: 'Sign in to the panel again with email and password to use this section',
    confirm: 'Are you sure?', yes: 'Yes', cancel: 'Cancel',
  },
  ru: {
    title: 'Модерация стены дуа', sub: 'Просьбы о дуа, запрещённые слова, жалобы на открытые профили и представители мечетей',
    tabs: { wall: 'Стена дуа', banned: 'Запрещённые слова', profiles: 'Жалобы на профили', mosques: 'Мечети' },
    status: { pending: 'Ожидают', approved: 'Одобрены', rejected: 'Отклонены' },
    reported: 'жалоб', prayed: 'дуа', anon: 'Аноним', approve: 'Одобрить', reject: 'Отклонить', del: 'Удалить', reason: 'Причина',
    reasons: { personal_info: 'Личные данные', not_dua: 'Не просьба о дуа', inappropriate: 'Неуместно', duplicate: 'Повтор', commercial: 'Реклама', other: 'Другое' },
    none: 'Здесь ничего нет', expired: 'срок истёк', done: 'Сохранено', failed: 'Не удалось',
    word: 'Слово или фраза', add: 'Добавить', bannedLead: 'Просьбы с этими словами отклоняются автоматически (целые слова, без учёта регистра).',
    hide: 'Скрыть (тексты удаляются)', dismiss: 'Отклонить жалобы', reports: 'Жалобы', reps: 'активных представителей',
    clear: 'Удалить данные мечети', iqama: 'Икама', jumuah: 'Джума', ann: 'Объявления', forbidden: 'Чтобы открыть раздел, войдите в панель заново по почте и паролю',
    confirm: 'Вы уверены?', yes: 'Да', cancel: 'Отмена',
  },
  ar: {
    title: 'الإشراف على جدار الدعاء', sub: 'طلبات الدعاء، والكلمات المحظورة، وبلاغات الملفات العامة، وممثّلو المساجد',
    tabs: { wall: 'جدار الدعاء', banned: 'كلمات محظورة', profiles: 'بلاغات الملفات', mosques: 'المساجد' },
    status: { pending: 'بانتظار المراجعة', approved: 'مقبولة', rejected: 'مرفوضة' },
    reported: 'بلاغات', prayed: 'دعاء', anon: 'مجهول', approve: 'اقبل', reject: 'ارفض', del: 'حذف', reason: 'السبب',
    reasons: { personal_info: 'بيانات شخصية', not_dua: 'ليس طلب دعاء', inappropriate: 'غير لائق', duplicate: 'مكرّر', commercial: 'إعلان', other: 'أخرى' },
    none: 'لا شيء هنا', expired: 'انتهت مدّته', done: 'تم الحفظ', failed: 'تعذّر ذلك',
    word: 'كلمة أو عبارة', add: 'إضافة', bannedLead: 'تُرفض تلقائيًا الطلبات التي تحتوي هذه الكلمات (كلمات كاملة، دون تمييز حالة الأحرف).',
    hide: 'إخفاء (تُحذف النصوص)', dismiss: 'رفض البلاغات', reports: 'البلاغات', reps: 'ممثّلون نشطون',
    clear: 'حذف بيانات المسجد', iqama: 'الإقامة', jumuah: 'الجمعة', ann: 'الإعلانات', forbidden: 'لاستخدام هذا القسم سجّل الدخول إلى اللوحة مجددًا بالبريد وكلمة المرور',
    confirm: 'هل أنت متأكد؟', yes: 'نعم', cancel: 'إلغاء',
  },
  tr: {
    title: 'Dua duvarı moderasyonu', sub: 'Dua istekleri, yasaklı kelimeler, açık profil şikâyetleri ve cami temsilcileri',
    tabs: { wall: 'Dua duvarı', banned: 'Yasaklı kelimeler', profiles: 'Profil şikâyetleri', mosques: 'Camiler' },
    status: { pending: 'Bekleyen', approved: 'Onaylanan', rejected: 'Reddedilen' },
    reported: 'şikâyet', prayed: 'dua', anon: 'Anonim', approve: 'Onayla', reject: 'Reddet', del: 'Sil', reason: 'Sebep',
    reasons: { personal_info: 'Kişisel bilgi', not_dua: 'Dua isteği değil', inappropriate: 'Uygunsuz', duplicate: 'Tekrar', commercial: 'Reklam', other: 'Diğer' },
    none: 'Burada bir şey yok', expired: 'süresi doldu', done: 'Kaydedildi', failed: 'Olmadı',
    word: 'Kelime veya ifade', add: 'Ekle', bannedLead: 'Bu kelimeleri içeren istekler kendiliğinden reddedilir (tam kelime, büyük-küçük harf farkı yok).',
    hide: 'Gizle (metinler silinir)', dismiss: 'Şikâyetleri reddet', reports: 'Şikâyetler', reps: 'etkin temsilci',
    clear: 'Cami verisini sil', iqama: 'İkamet', jumuah: 'Cuma', ann: 'Duyurular', forbidden: 'Bu bölüm için panele e-posta ve şifreyle yeniden giriş yapın',
    confirm: 'Emin misiniz?', yes: 'Evet', cancel: 'Vazgeç',
  },
}

const TABS = ['wall', 'banned', 'profiles', 'mosques']
const fmtDate = (ms, lang) => { try { return new Date(ms).toLocaleString(lang === 'az' ? 'az-Latn-AZ' : lang, { dateStyle: 'medium', timeStyle: 'short' }) } catch { return new Date(ms).toISOString() } }

function Confirm({ l, label, onYes, disabled }) {
  const [ask, setAsk] = useState(false)
  if (!ask) return <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={disabled} onClick={() => setAsk(true)}><Icon name="trash" size={14} /> {label}</button>
  return (
    <span className="rt-confirm">
      <span>{l.confirm}</span>
      <button type="button" className="ui-btn ui-btn--sm acc-btn-danger" onClick={() => { setAsk(false); onYes() }}>{l.yes}</button>
      <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setAsk(false)}>{l.cancel}</button>
    </span>
  )
}

export default function CommunityModeration() {
  const { lang } = useLang()
  const l = pickUi(LABELS, lang)
  const [tab, setTab] = useState('wall')
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  useEffect(() => { if (!toast) return undefined; const id = setTimeout(() => setToast(''), 2500); return () => clearTimeout(id) }, [toast])
  const onErr = useCallback((e) => setError(e && (e.code === 'session_required' || e.status === 403) ? l.forbidden : l.failed), [l])
  const ok = useCallback(() => { setError(''); setToast(l.done) }, [l])
  return (
    <div className="admin-section-wrap" data-testid="admin-moderation">
      <AdminHeader icon="shield" title={l.title} sub={l.sub} />
      <div className="admin-lang-tabs" role="tablist" aria-label={l.title}>
        {TABS.map((k) => (
          <button key={k} type="button" role="tab" id={`mod-tab-${k}`} aria-selected={tab === k} aria-controls={`mod-panel-${k}`}
            className={`admin-lang-tab${tab === k ? ' active' : ''}`} onClick={() => setTab(k)} data-testid={`mod-tab-${k}`}>{l.tabs[k]}</button>
        ))}
      </div>
      {error && <AdminAlert>{error}</AdminAlert>}
      <div role="tabpanel" id={`mod-panel-${tab}`} aria-labelledby={`mod-tab-${tab}`}>
        {tab === 'wall' && <WallQueue l={l} lang={lang} onOk={ok} onErr={onErr} />}
        {tab === 'banned' && <Banned l={l} onOk={ok} onErr={onErr} />}
        {tab === 'profiles' && <Profiles l={l} lang={lang} onOk={ok} onErr={onErr} />}
        {tab === 'mosques' && <Mosques l={l} onOk={ok} onErr={onErr} />}
      </div>
      <AdminToast message={toast} />
    </div>
  )
}

function WallQueue({ l, lang, onOk, onErr }) {
  const [status, setStatus] = useState('pending')
  const [data, setData] = useState(null)
  const load = useCallback(() => adminDuaWall(status).then(setData).catch((e) => { onErr(e); setData({ items: [], counts: {} }) }), [status, onErr])
  useEffect(() => { load() }, [load])
  const act = (id, action, reason) => adminDecideDua(id, action, reason).then(() => { onOk(); load() }).catch(onErr)
  return (
    <section className="admin-section">
      <div className="rt-row" role="group" aria-label={l.tabs.wall}>
        {['pending', 'approved', 'rejected'].map((s) => (
          <button key={s} type="button" className="ui-chip" aria-pressed={status === s} onClick={() => setStatus(s)} data-testid={`mod-status-${s}`}>
            {l.status[s]}{data?.counts?.[s] ? ` (${data.counts[s]})` : ''}
          </button>
        ))}
      </div>
      {!data ? <AdminEmpty busy>…</AdminEmpty> : data.items.length === 0 ? <AdminEmpty icon="duas">{l.none}</AdminEmpty> : (
        <ul className="rt-list" data-testid="mod-wall-list">
          {data.items.map((it) => <WallItem key={it.id} it={it} l={l} lang={lang} reasons={data.reasons || []} act={act} />)}
        </ul>
      )}
    </section>
  )
}

function WallItem({ it, l, lang, reasons, act }) {
  const uid = useId()
  const [reason, setReason] = useState(reasons[0] || 'other')
  return (
    <li className="ui-card admin-user" data-testid="mod-wall-item">
      <div className="admin-user__who">
        <p className="cm-pre" lang={it.lang} dir="auto" style={{ margin: 0 }}>{it.body}</p>
        <span className="admin-user__meta">
          <bdi>{it.name || l.anon}</bdi> · {it.lang.toUpperCase()} · {fmtDate(it.createdAt, lang)} · {it.prayed} {l.prayed}
          {it.expired && <> · {l.expired}</>}
        </span>
        {it.reported > 0 && (
          <span className="admin-user__badges">
            <span className="ui-badge ui-badge--bad">{it.reported} {l.reported}</span>
            {it.reports.map((r, i) => <span key={i} className="ui-badge">{l.reasons[r.reason] || r.reason}</span>)}
          </span>
        )}
        {it.status === 'rejected' && it.reason && <span className="ui-badge ui-badge--warn">{l.reasons[it.reason] || it.reason}</span>}
      </div>
      <div className="admin-user__controls">
        {it.status !== 'approved' || it.reported > 0 ? (
          <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => act(it.id, 'approve')} data-testid="mod-approve"><Icon name="check" className="ui-btn__icon" /> {l.approve}</button>
        ) : null}
        {it.status !== 'rejected' && (
          <>
            <label className="ui-field">
              <span className="ui-field__label" id={`${uid}-r`}>{l.reason}</span>
              <select className="ui-select ui-select--sm" aria-labelledby={`${uid}-r`} value={reason} onChange={(e) => setReason(e.target.value)}>
                {reasons.map((r) => <option key={r} value={r}>{l.reasons[r] || r}</option>)}
              </select>
            </label>
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => act(it.id, 'reject', reason)} data-testid="mod-reject"><Icon name="close" className="ui-btn__icon" /> {l.reject}</button>
          </>
        )}
        <Confirm l={l} label={l.del} onYes={() => act(it.id, 'delete')} />
      </div>
    </li>
  )
}

function Banned({ l, onOk, onErr }) {
  const uid = useId()
  const [words, setWords] = useState(null)
  const [word, setWord] = useState('')
  useEffect(() => { adminBannedWords().then((r) => setWords(r.words)).catch((e) => { onErr(e); setWords([]) }) }, [onErr])
  const add = (e) => {
    e.preventDefault()
    if (!word.trim()) return
    adminAddBanned(word.trim()).then((r) => { setWords(r.words); setWord(''); onOk() }).catch(onErr)
  }
  return (
    <section className="admin-section">
      <SectionTitle icon="shield">{l.tabs.banned}</SectionTitle>
      <p className="admin-user__meta">{l.bannedLead}</p>
      <form className="rt-row" onSubmit={add}>
        <label className="ui-field">
          <span className="ui-field__label" id={`${uid}-w`}>{l.word}</span>
          <input className="ui-input ui-input--sm" aria-labelledby={`${uid}-w`} value={word} maxLength={40} onChange={(e) => setWord(e.target.value)} data-testid="mod-banned-input" />
        </label>
        <button type="submit" className="ui-btn ui-btn--primary ui-btn--sm" data-testid="mod-banned-add"><Icon name="plus" className="ui-btn__icon" /> {l.add}</button>
      </form>
      {words && (
        <ul className="pub-stamps" style={{ marginTop: 12 }} data-testid="mod-banned-list">
          {words.map((w) => (
            <li key={w} className="ui-badge">
              <bdi>{w}</bdi>
              <button type="button" className="ui-icon-btn" aria-label={`${l.del}: ${w}`} onClick={() => adminRemoveBanned(w).then((r) => { setWords(r.words); onOk() }).catch(onErr)}><Icon name="close" size={12} /></button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Profiles({ l, lang, onOk, onErr }) {
  const [items, setItems] = useState(null)
  const load = useCallback(() => adminProfileReports().then((r) => setItems(r.items)).catch((e) => { onErr(e); setItems([]) }), [onErr])
  useEffect(() => { load() }, [load])
  const act = (h, action) => adminModerateProfile(h, action).then(() => { onOk(); load() }).catch(onErr)
  if (!items) return <AdminEmpty busy>…</AdminEmpty>
  if (!items.length) return <AdminEmpty icon="user">{l.none}</AdminEmpty>
  return (
    <ul className="rt-list" data-testid="mod-profiles">
      {items.map((p) => (
        <li key={p.handle} className="ui-card admin-user">
          <div className="admin-user__who">
            <strong dir="ltr">@{p.handle}</strong>
            {p.data.displayName && <span className="admin-user__name"><bdi>{p.data.displayName}</bdi></span>}
            {p.data.kunya && <span className="admin-user__name"><bdi>{p.data.kunya}</bdi></span>}
            {p.data.bio && <p className="cm-pre" dir="auto" style={{ margin: 0 }}>{p.data.bio}</p>}
            <span className="admin-user__badges">
              <span className="ui-badge ui-badge--bad">{p.count} {l.reported}</span>
              {p.reports.map((r, i) => <span key={i} className="ui-badge" title={fmtDate(r.at, lang)}>{r.reason}</span>)}
            </span>
          </div>
          <div className="admin-user__controls">
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => act(p.handle, 'hide')}>{l.hide}</button>
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => act(p.handle, 'dismiss')}>{l.dismiss}</button>
          </div>
        </li>
      ))}
    </ul>
  )
}

function Mosques({ l, onOk, onErr }) {
  const [items, setItems] = useState(null)
  const load = useCallback(() => adminMosques().then((r) => setItems(r.items)).catch((e) => { onErr(e); setItems([]) }), [onErr])
  useEffect(() => { load() }, [load])
  if (!items) return <AdminEmpty busy>…</AdminEmpty>
  if (!items.length) return <AdminEmpty icon="mosques">{l.none}</AdminEmpty>
  return (
    <ul className="rt-list" data-testid="mod-mosques">
      {items.map((m) => (
        <li key={m.mosqueId} className="ui-card admin-user">
          <div className="admin-user__who">
            <strong><bdi>{m.name || m.mosqueId}</bdi></strong>
            <span className="admin-user__meta" dir="ltr">{m.mosqueId} · {m.reps} {l.reps}</span>
            <span className="admin-user__meta">{l.iqama}: {Object.entries(m.iqama || {}).map(([k, v]) => `${k} ${v}`).join(', ') || '—'}{m.jumuah?.time ? ` · ${l.jumuah} ${m.jumuah.time}` : ''}</span>
            {m.jumuah?.topic && <span className="admin-user__meta"><bdi>{m.jumuah.topic}</bdi></span>}
            {m.ramadanNote && <p className="cm-pre" dir="auto" style={{ margin: 0 }}>{m.ramadanNote}</p>}
            {m.announcements.length > 0 && (
              <ul className="rt-list">
                {m.announcements.map((a) => (
                  <li key={a.id} className="rt-list__item">
                    <span className="cm-pre" dir="auto">{a.body} <span className="admin-user__meta">({a.expiresOn})</span></span>
                    <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" aria-label={`${l.del}: ${a.body.slice(0, 40)}`}
                      onClick={() => adminDeleteMosqueAnnouncement(m.mosqueId, a.id).then(() => { onOk(); load() }).catch(onErr)}><Icon name="trash" size={14} /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="admin-user__controls">
            <Confirm l={l} label={l.clear} onYes={() => adminDeleteMosque(m.mosqueId).then(() => { onOk(); load() }).catch(onErr)} />
          </div>
        </li>
      ))}
    </ul>
  )
}
