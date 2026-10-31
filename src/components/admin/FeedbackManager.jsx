// ═══════════════════════════════════════════════════════
// Admin: ziyarətçilərin "Səhv bildir" bildirişləri (server/feedback.js)
//   GET /api/admin/feedback · PATCH …/:id { status } · DELETE …/:id
// Yeni bildirişlər yuxarıda; "Həll edildi" ilə arxivə keçir.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLang } from '../../contexts/LangContext'
import { AdminHeader, AdminEmpty, AdminAlert } from './AdminUi'
import Icon from '../Icon'
import { apiFetch } from '../../api/http'

const LABELS = {
  az: { title: 'Səhv bildirişləri', sub: 'Ziyarətçilərin məzmun səhvi barədə yazdıqları', open: 'Yeni', done: 'Həll edilib', all: 'Hamısı', none: 'Bildiriş yoxdur', page: 'Səhifə', about: 'Aid olduğu', contact: 'Əlaqə', markDone: 'Həll edildi', reopen: 'Yenidən aç', del: 'Sil', confirmDel: 'Bu bildiriş silinsin?', error: 'Yükləmək alınmadı', refresh: 'Yenilə',
    kinds: { text: 'Mətn', translation: 'Tərcümə', source: 'Mənbə', hadith: 'Hədis', design: 'Texniki', other: 'Digər' } },
  en: { title: 'Error reports', sub: 'Content errors reported by visitors', open: 'New', done: 'Resolved', all: 'All', none: 'No reports', page: 'Page', about: 'About', contact: 'Contact', markDone: 'Mark resolved', reopen: 'Reopen', del: 'Delete', confirmDel: 'Delete this report?', error: 'Could not load', refresh: 'Refresh',
    kinds: { text: 'Text', translation: 'Translation', source: 'Source', hadith: 'Hadith', design: 'Technical', other: 'Other' } },
  ru: { title: 'Сообщения об ошибках', sub: 'Ошибки в содержании, о которых сообщили посетители', open: 'Новые', done: 'Решённые', all: 'Все', none: 'Сообщений нет', page: 'Страница', about: 'К чему', contact: 'Контакт', markDone: 'Решено', reopen: 'Открыть снова', del: 'Удалить', confirmDel: 'Удалить это сообщение?', error: 'Не удалось загрузить', refresh: 'Обновить',
    kinds: { text: 'Текст', translation: 'Перевод', source: 'Источник', hadith: 'Хадис', design: 'Техника', other: 'Другое' } },
  ar: { title: 'بلاغات الأخطاء', sub: 'أخطاء المحتوى التي أبلغ عنها الزوار', open: 'جديدة', done: 'محلولة', all: 'الكل', none: 'لا توجد بلاغات', page: 'الصفحة', about: 'يتعلق بـ', contact: 'التواصل', markDone: 'تم الحل', reopen: 'إعادة فتح', del: 'حذف', confirmDel: 'حذف هذا البلاغ؟', error: 'تعذّر التحميل', refresh: 'تحديث',
    kinds: { text: 'النص', translation: 'الترجمة', source: 'المصدر', hadith: 'الحديث', design: 'تقني', other: 'أخرى' } },
  tr: { title: 'Hata bildirimleri', sub: 'Ziyaretçilerin bildirdiği içerik hataları', open: 'Yeni', done: 'Çözüldü', all: 'Tümü', none: 'Bildirim yok', page: 'Sayfa', about: 'İlgili', contact: 'İletişim', markDone: 'Çözüldü olarak işaretle', reopen: 'Yeniden aç', del: 'Sil', confirmDel: 'Bu bildirim silinsin mi?', error: 'Yüklenemedi', refresh: 'Yenile',
    kinds: { text: 'Metin', translation: 'Çeviri', source: 'Kaynak', hadith: 'Hadis', design: 'Teknik', other: 'Diğer' } },
}

export default function FeedbackManager() {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az
  const [items, setItems] = useState(null)
  const [err, setErr] = useState(false)
  const [filter, setFilter] = useState('new')

  const load = useCallback(async () => {
    setErr(false)
    try { setItems(await apiFetch('/api/admin/feedback', { admin: true })) } catch { setErr(true); setItems([]) }
  }, [])
  useEffect(() => { load() }, [load])

  const list = useMemo(() => (items || [])
    .filter(x => filter === 'all' || (x.status || 'new') === filter)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)), [items, filter])

  const setStatus = async (x, status) => {
    await apiFetch(`/api/admin/feedback/${encodeURIComponent(x.id)}`, { method: 'PATCH', admin: true, body: { status } }).catch(() => {})
    load()
  }
  const remove = async (x) => {
    if (!window.confirm(l.confirmDel)) return
    await apiFetch(`/api/admin/feedback/${encodeURIComponent(x.id)}`, { method: 'DELETE', admin: true }).catch(() => {})
    load()
  }
  const fmt = (ms) => { try { return new Date(ms).toLocaleString(lang === 'az' ? 'az-Latn-AZ' : lang) } catch { return '' } }
  const count = (s) => (items || []).filter(x => (x.status || 'new') === s).length

  return (
    <div>
      <AdminHeader icon="alert" title={l.title} sub={l.sub}>
        <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={load}><Icon name="refresh" className="ui-btn__icon" /> {l.refresh}</button>
      </AdminHeader>
      <div role="group" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '16px 0' }}>
        {[['new', l.open, count('new')], ['done', l.done, count('done')], ['all', l.all, (items || []).length]].map(([k, t, n]) => (
          <button key={k} type="button" className="ui-chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>{t} <span className="ui-num">{n}</span></button>
        ))}
      </div>
      {err && <AdminAlert>{l.error}</AdminAlert>}
      {items === null ? <AdminEmpty busy /> : list.length === 0 ? <AdminEmpty icon="check">{l.none}</AdminEmpty> : (
        <div style={{ display: 'grid', gap: 12 }}>
          {list.map(x => (
            <article key={x.id} className="ui-card" style={{ padding: 16, display: 'grid', gap: 8, opacity: x.status === 'done' ? 0.7 : 1 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <span className="ui-badge ui-badge--brand">{l.kinds[x.kind] || x.kind}</span>
                <span className="ui-badge">{String(x.lang || '').toUpperCase()}</span>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>{fmt(x.createdAt)}</span>
              </div>
              <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-strong)', lineHeight: 1.6 }} dir="auto">{x.text}</p>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                {l.page}: <a href={x.page} target="_blank" rel="noopener noreferrer" className="ui-link">{x.page}</a>
                {x.ref && <> · {l.about}: <bdi>{x.ref}</bdi></>}
                {x.contact && <> · {l.contact}: <bdi>{x.contact}</bdi></>}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {x.status === 'done'
                  ? <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setStatus(x, 'new')}><Icon name="refresh" className="ui-btn__icon" /> {l.reopen}</button>
                  : <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => setStatus(x, 'done')}><Icon name="check" className="ui-btn__icon" /> {l.markDone}</button>}
                <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => remove(x)}><Icon name="trash" className="ui-btn__icon" /> {l.del}</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
