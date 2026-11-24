// ═══════════════════════════════════════════════════════
// Admin: saytın İSTİFADƏÇİLƏRİ (server/users.js, docs/USER-ACCOUNTS.md)
//   GET  /api/admin/users?q=&page=&verified=&lang=&sort=&dir=  — axtarış, filtr, sıralama + səhifələmə (50);
//        hər sətirdə sayt dili, xoş gəldin məktubu, imtina; facets — saylar və dillər
//   Baş admin: istifadəçiləri məktub üçün seçir → onCompose([{ id, email }]) → "E-poçt göndər" bölməsi
//   POST /api/admin/users/:id/role        — { role, mosqueId? }
//   POST /api/admin/users/:id/disable     — { disabled }
//   GET  /api/admin/role-audit?page=      — rol tarixçəsi
// Yalnız admin / superadmin görür (AdminPage → /api/admin/me → role).
// Qaydalar serverdədir; burada yalnız mənasız seçimlər gizlədilir:
//   superadmin heç vaxt təklif olunmur (yalnız skriptlə), admin — yalnız superadmin-ə,
//   öz hesabınız, superadmin və (admin üçün) digər admin — yalnız oxumaq üçün.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLang } from '../../contexts/LangContext'
import { pickUi } from '../../utils/uiText'
import Icon from '../Icon'
import { AdminHeader, AdminEmpty, AdminAlert, AdminToast, SectionTitle } from './AdminUi'
import { AUTH_TEXT } from '../account/authText'
import {
  adminListUsers, adminRoleAudit, adminSetDisabled, adminSetRole, assignableRoles, errorKey, roleRank, validMosqueId,
} from '../../api/userAuth'

const LABELS = {
  az: {
    title: 'İstifadəçilər', sub: 'Saytın istifadəçi hesabları və rolları', search: 'E-poçt və ya ad ilə axtar', find: 'Axtar',
    total: 'Cəmi', none: 'İstifadəçi tapılmadı', role: 'Rol', mosqueId: 'Məscidin ID-si', save: 'Rolu saxla',
    disable: 'Blokla', enable: 'Bloku aç', blocked: 'Bloklanıb', verified: 'E-poçt təsdiqlənib', unverified: 'E-poçt təsdiqlənməyib',
    created: 'Qeydiyyat', lastLogin: 'Son giriş', never: 'heç vaxt', prev: 'Əvvəlki', next: 'Növbəti', page: 'Səhifə',
    readOnly: 'Bu hesabın rolunu buradan dəyişmək olmaz', you: 'Bu sizsiniz',
    saved: 'Yadda saxlanıldı', audit: 'Rol tarixçəsi', auditNone: 'Hələ dəyişiklik yoxdur', script: 'Server skripti',
    actRole: 'Rol dəyişdi', actDisable: 'Bloklandı', actEnable: 'Blok açıldı', adminAccount: 'panel hesabı',
    errMosque: 'Məscidin ID-si: 1–64 simvol, yalnız latın hərfi, rəqəm, «-» və «_»',
    errScriptOnly: 'Baş admin rolu yalnız serverdə skriptlə verilir və alınır',
    errSuperOnly: 'Admin rolunu (və admini bloklamağı) yalnız baş admin edə bilər',
    errSelf: 'Öz rolunuzu və ya hesabınızı buradan dəyişə bilməzsiniz',
    errSessionReq: 'Bu bölmə üçün panelə e-poçt və şifrə ilə yenidən daxil olun',
    errBadRole: 'Naməlum rol',
    errForbidden: 'Bu bölmə yalnız admin və baş admin üçündür',
    filterVerified: 'E-poçt', all: 'Hamısı', onlyVerified: 'Təsdiqlənmiş', onlyUnverified: 'Təsdiqlənməmiş',
    filterLang: 'Sayt dili', anyLang: 'Bütün dillər', noLang: 'məlum deyil', sortLabel: 'Sıralama', sortNew: 'Ən yeni', sortOld: 'Ən köhnə',
    sortLogin: 'Son giriş', sortEmail: 'E-poçt (A–Z)', sortName: 'Ad (A–Z)', sortLang: 'Sayt dili (A–Z)',
    siteLang: 'Sayt dili', welcome: 'Xoş gəldin məktubu', welcomeNo: 'göndərilməyib', optedOut: 'Məktublardan imtina edib',
    stats: 'Təsdiqlənmiş: {v} · Təsdiqlənməmiş: {u} · İmtina edən: {o}',
    select: 'Məktub üçün seç', selectedN: 'Seçilib: {n}', selectPage: 'Bu səhifədəkiləri seç', clearSel: 'Seçimi təmizlə',
    composeSel: 'Seçilənlərə məktub yaz', composeOne: 'Məktub yaz', notEligible: 'Bu hesaba məktub göndərilmir (təsdiqlənməyib, bloklanıb və ya imtina edib)',
  },
  en: {
    title: 'Users', sub: 'Site user accounts and roles', search: 'Search by email or name', find: 'Search',
    total: 'Total', none: 'No users found', role: 'Role', mosqueId: 'Mosque ID', save: 'Save role',
    disable: 'Block', enable: 'Unblock', blocked: 'Blocked', verified: 'Email confirmed', unverified: 'Email not confirmed',
    created: 'Signed up', lastLogin: 'Last sign-in', never: 'never', prev: 'Previous', next: 'Next', page: 'Page',
    readOnly: 'This account’s role cannot be changed here', you: 'This is you',
    saved: 'Saved', audit: 'Role history', auditNone: 'No changes yet', script: 'Server script',
    actRole: 'Role changed', actDisable: 'Blocked', actEnable: 'Unblocked', adminAccount: 'panel account',
    errMosque: 'Mosque ID: 1–64 characters, Latin letters, digits, «-» and «_» only',
    errScriptOnly: 'The superadmin role can only be granted or removed by a server script',
    errSuperOnly: 'Only a superadmin can grant or remove the admin role (or block an admin)',
    errSelf: 'You cannot change your own role or account here',
    errSessionReq: 'Sign in to the panel again with email and password to use this section',
    errBadRole: 'Unknown role',
    errForbidden: 'This section is only for admins and superadmins',
    filterVerified: 'Email', all: 'All', onlyVerified: 'Confirmed', onlyUnverified: 'Not confirmed',
    filterLang: 'Site language', anyLang: 'All languages', noLang: 'unknown', sortLabel: 'Sort', sortNew: 'Newest', sortOld: 'Oldest',
    sortLogin: 'Last sign-in', sortEmail: 'Email (A–Z)', sortName: 'Name (A–Z)', sortLang: 'Site language (A–Z)',
    siteLang: 'Site language', welcome: 'Welcome email', welcomeNo: 'not sent', optedOut: 'Unsubscribed from emails',
    stats: 'Confirmed: {v} · Not confirmed: {u} · Unsubscribed: {o}',
    select: 'Select for email', selectedN: 'Selected: {n}', selectPage: 'Select everyone on this page', clearSel: 'Clear selection',
    composeSel: 'Email the selected users', composeOne: 'Write email', notEligible: 'This account cannot be emailed (not confirmed, blocked or unsubscribed)',
  },
  ru: {
    title: 'Пользователи', sub: 'Аккаунты пользователей сайта и роли', search: 'Поиск по почте или имени', find: 'Найти',
    total: 'Всего', none: 'Пользователи не найдены', role: 'Роль', mosqueId: 'ID мечети', save: 'Сохранить роль',
    disable: 'Заблокировать', enable: 'Разблокировать', blocked: 'Заблокирован', verified: 'Почта подтверждена', unverified: 'Почта не подтверждена',
    created: 'Регистрация', lastLogin: 'Последний вход', never: 'никогда', prev: 'Назад', next: 'Далее', page: 'Страница',
    readOnly: 'Роль этого аккаунта здесь изменить нельзя', you: 'Это вы',
    saved: 'Сохранено', audit: 'История ролей', auditNone: 'Изменений пока нет', script: 'Серверный скрипт',
    actRole: 'Роль изменена', actDisable: 'Заблокирован', actEnable: 'Разблокирован', adminAccount: 'аккаунт панели',
    // lang-ok[ID]: texniki identifikator (latın hərfləri) — mətn yox
    errMosque: 'ID мечети: 1–64 символа, только латинские буквы, цифры, «-» и «_»',
    errScriptOnly: 'Роль суперадминистратора выдаётся и снимается только серверным скриптом',
    errSuperOnly: 'Выдавать и снимать роль администратора (и блокировать администратора) может только суперадминистратор',
    errSelf: 'Здесь нельзя менять собственную роль или аккаунт',
    errSessionReq: 'Чтобы открыть этот раздел, войдите в панель снова по почте и паролю',
    errBadRole: 'Неизвестная роль',
    errForbidden: 'Этот раздел только для администраторов и суперадминистраторов',
    filterVerified: 'Почта', all: 'Все', onlyVerified: 'Подтверждена', onlyUnverified: 'Не подтверждена',
    filterLang: 'Язык сайта', anyLang: 'Все языки', noLang: 'неизвестен', sortLabel: 'Сортировка', sortNew: 'Сначала новые', sortOld: 'Сначала старые',
    sortLogin: 'Последний вход', sortEmail: 'Почта (А–Я)', sortName: 'Имя (А–Я)', sortLang: 'Язык сайта (А–Я)',
    siteLang: 'Язык сайта', welcome: 'Приветственное письмо', welcomeNo: 'не отправлено', optedOut: 'Отписался от писем',
    stats: 'Подтверждены: {v} · Не подтверждены: {u} · Отписались: {o}',
    select: 'Выбрать для письма', selectedN: 'Выбрано: {n}', selectPage: 'Выбрать всех на странице', clearSel: 'Сбросить выбор',
    composeSel: 'Написать выбранным', composeOne: 'Написать письмо', notEligible: 'Этому аккаунту письма не отправляются (почта не подтверждена, аккаунт заблокирован или отписан)',
  },
  tr: {
    title: 'Kullanıcılar', sub: 'Sitenin kullanıcı hesapları ve rolleri', search: 'E-posta veya ada göre ara', find: 'Ara',
    total: 'Toplam', none: 'Kullanıcı bulunamadı', role: 'Rol', mosqueId: 'Cami kimliği', save: 'Rolü kaydet',
    disable: 'Engelle', enable: 'Engeli kaldır', blocked: 'Engellendi', verified: 'E-posta onaylandı', unverified: 'E-posta onaylanmadı',
    created: 'Kayıt', lastLogin: 'Son giriş', never: 'hiç', prev: 'Önceki', next: 'Sonraki', page: 'Sayfa',
    readOnly: 'Bu hesabın rolü buradan değiştirilemez', you: 'Bu sizsiniz',
    saved: 'Kaydedildi', audit: 'Rol geçmişi', auditNone: 'Henüz değişiklik yok', script: 'Sunucu betiği',
    actRole: 'Rol değişti', actDisable: 'Engellendi', actEnable: 'Engel kaldırıldı', adminAccount: 'panel hesabı',
    errMosque: 'Cami kimliği: 1–64 karakter, yalnızca Latin harfleri, rakamlar, «-» ve «_»',
    errScriptOnly: 'Süper yönetici rolü yalnızca sunucuda betikle verilir ve alınır',
    errSuperOnly: 'Yönetici rolünü (ve yöneticiyi engellemeyi) yalnızca süper yönetici yapabilir',
    errSelf: 'Kendi rolünüzü veya hesabınızı buradan değiştiremezsiniz',
    errSessionReq: 'Bu bölüm için panele e-posta ve şifreyle yeniden giriş yapın',
    errBadRole: 'Bilinmeyen rol',
    errForbidden: 'Bu bölüm yalnızca yöneticiler ve süper yöneticiler içindir',
    filterVerified: 'E-posta', all: 'Tümü', onlyVerified: 'Onaylı', onlyUnverified: 'Onaysız',
    filterLang: 'Site dili', anyLang: 'Tüm diller', noLang: 'bilinmiyor', sortLabel: 'Sıralama', sortNew: 'En yeni', sortOld: 'En eski',
    sortLogin: 'Son giriş', sortEmail: 'E-posta (A–Z)', sortName: 'Ad (A–Z)', sortLang: 'Site dili (A–Z)',
    siteLang: 'Site dili', welcome: 'Hoş geldin e-postası', welcomeNo: 'gönderilmedi', optedOut: 'E-postalardan çıktı',
    stats: 'Onaylı: {v} · Onaysız: {u} · Abonelikten çıkan: {o}',
    select: 'E-posta için seç', selectedN: 'Seçildi: {n}', selectPage: 'Bu sayfadakileri seç', clearSel: 'Seçimi temizle',
    composeSel: 'Seçilenlere e-posta yaz', composeOne: 'E-posta yaz', notEligible: 'Bu hesaba e-posta gönderilmez (onaysız, engelli veya abonelikten çıkmış)',
  },
  ar: {
    title: 'المستخدمون', sub: 'حسابات مستخدمي الموقع وأدوارهم', search: 'ابحث بالبريد الإلكتروني أو الاسم', find: 'بحث',
    total: 'المجموع', none: 'لم يُعثر على مستخدمين', role: 'الدور', mosqueId: 'معرّف المسجد', save: 'حفظ الدور',
    disable: 'حظر', enable: 'رفع الحظر', blocked: 'محظور', verified: 'البريد مؤكَّد', unverified: 'البريد غير مؤكَّد',
    created: 'التسجيل', lastLogin: 'آخر دخول', never: 'أبدًا', prev: 'السابق', next: 'التالي', page: 'الصفحة',
    readOnly: 'لا يمكن تغيير دور هذا الحساب من هنا', you: 'هذا أنت',
    saved: 'تم الحفظ', audit: 'سجل الأدوار', auditNone: 'لا توجد تغييرات بعد', script: 'سكربت الخادم',
    actRole: 'تغيّر الدور', actDisable: 'حُظر', actEnable: 'رُفع الحظر', adminAccount: 'حساب اللوحة',
    errMosque: 'معرّف المسجد: من 1 إلى 64 رمزًا، حروف لاتينية وأرقام و«-» و«_» فقط',
    errScriptOnly: 'دور المشرف الأعلى يُمنح ويُسحب بسكربت على الخادم فقط',
    errSuperOnly: 'لا يمنح دور المشرف ولا يسحبه (ولا يحظر مشرفًا) إلا المشرف الأعلى',
    errSelf: 'لا يمكنك تغيير دورك أو حسابك من هنا',
    errSessionReq: 'لاستخدام هذا القسم سجّل الدخول إلى اللوحة مجددًا بالبريد وكلمة المرور',
    errBadRole: 'دور غير معروف',
    errForbidden: 'هذا القسم للمشرفين والمشرفين الأعلين فقط',
    filterVerified: 'البريد', all: 'الكل', onlyVerified: 'مؤكَّد', onlyUnverified: 'غير مؤكَّد',
    filterLang: 'لغة الموقع', anyLang: 'كل اللغات', noLang: 'غير معروفة', sortLabel: 'الترتيب', sortNew: 'الأحدث', sortOld: 'الأقدم',
    sortLogin: 'آخر دخول', sortEmail: 'البريد (أبجديًا)', sortName: 'الاسم (أبجديًا)', sortLang: 'لغة الموقع (أبجديًا)',
    siteLang: 'لغة الموقع', welcome: 'رسالة الترحيب', welcomeNo: 'لم تُرسل', optedOut: 'ألغى الاشتراك في الرسائل',
    stats: 'مؤكَّدون: {v} · غير مؤكَّدين: {u} · ألغوا الاشتراك: {o}',
    select: 'اختر للمراسلة', selectedN: 'المحدَّدون: {n}', selectPage: 'حدّد كل من في هذه الصفحة', clearSel: 'مسح التحديد',
    composeSel: 'راسل المحدَّدين', composeOne: 'اكتب رسالة', notEligible: 'لا تُرسل رسائل إلى هذا الحساب (غير مؤكَّد أو محظور أو ألغى الاشتراك)',
  },
}

const sameEmail = (a, b) => Boolean(a && b) && String(a).trim().toLowerCase() === String(b).trim().toLowerCase()

/** Bu hesabın rolunu / blokunu panel istifadəçisi dəyişə bilərmi (server qaydasının əksi)? */
function editable(actorRole, actorEmail, u) {
  if (sameEmail(actorEmail, u.email)) return false
  if (u.role === 'superadmin') return false
  if (u.role === 'admin' && actorRole !== 'superadmin') return false
  return roleRank(actorRole) >= roleRank('admin')
}

const fillN = (s, vars) => String(s).replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? '' : String(vars[k])))
/** Məktub ala bilərmi (server də eyni qaydanı tətbiq edir): təsdiqli, bloklanmamış, imtina etməmiş */
const mailable = (u) => Boolean(u.emailVerified && !u.disabled && !u.emailOptOut)
// Sıralama seçimi → API (sort, dir); 'new' — köhnə susmaya görə (id DESC)
const SORTS = { new: ['', ''], old: ['created', 'asc'], login: ['lastLogin', 'desc'], email: ['email', 'asc'], name: ['name', 'asc'], lang: ['lang', 'asc'] }

function UserRow({ u, actorRole, actorEmail, l, roles, fmt, onSaved, onError, selectable, checked, onToggle, onCompose }) {
  const [role, setRole] = useState(u.role)
  const [mosque, setMosque] = useState(u.mosqueId || '')
  const [busy, setBusy] = useState(false)
  const canEdit = editable(actorRole, actorEmail, u)
  const options = assignableRoles(actorRole)
  const dirty = role !== u.role || (role === 'mosque_rep' && mosque.trim() !== (u.mosqueId || ''))
  const me = sameEmail(actorEmail, u.email)

  useEffect(() => { setRole(u.role); setMosque(u.mosqueId || '') }, [u.role, u.mosqueId])

  const act = async (fn) => {
    setBusy(true)
    try { const r = await fn(); onSaved(r && r.user) } catch (e) { onError(e) } finally { setBusy(false) }
  }
  const saveRole = () => {
    if (role === 'mosque_rep' && !validMosqueId(mosque.trim())) { onError({ local: 'errMosque' }); return }
    act(() => adminSetRole(u.id, role, mosque.trim()))
  }

  return (
    <article className="ui-card admin-user" data-testid="admin-user" data-email={u.email}>
      <div className="admin-user__who">
        {selectable ? (
          <label className="admin-user__pick" title={mailable(u) ? l.select : l.notEligible}>
            <input type="checkbox" checked={checked} disabled={!mailable(u)} onChange={() => onToggle(u)} aria-label={`${l.select}: ${u.email || ''}`} data-testid="user-pick" />
            <strong><bdi>{u.email || '—'}</bdi></strong>
          </label>
        ) : <strong><bdi>{u.email || '—'}</bdi></strong>}
        {u.displayName && <span className="admin-user__name"><bdi>{u.displayName}</bdi></span>}
        <span className="admin-user__badges">
          <span className={`ui-badge${u.role === 'superadmin' ? ' admin-role-badge--super' : u.role === 'admin' ? ' ui-badge--solid' : u.role === 'user' ? '' : ' ui-badge--brand'}`}>{roles[u.role] || u.role}</span>
          {u.mosqueId && <span className="ui-badge ui-badge--outline"><Icon name="mosques" size={14} /> <bdi>{u.mosqueId}</bdi></span>}
          <span className={`ui-badge ${u.emailVerified ? 'ui-badge--ok' : 'ui-badge--warn'}`}>{u.emailVerified ? l.verified : l.unverified}</span>
          {u.disabled && <span className="ui-badge ui-badge--bad">{l.blocked}</span>}
          {u.emailOptOut && <span className="ui-badge ui-badge--note" data-testid="user-optout">{l.optedOut}</span>}
          {me && <span className="ui-badge ui-badge--note">{l.you}</span>}
        </span>
        <span className="admin-user__meta">{l.created}: {fmt(u.createdAt)} · {l.lastLogin}: {u.lastLoginAt ? fmt(u.lastLoginAt) : l.never}</span>
        <span className="admin-user__meta" data-testid="user-extra">
          {l.siteLang}: <span className="ui-num">{u.siteLang ? u.siteLang.toUpperCase() : l.noLang}</span> · {l.welcome}: {u.welcomeSentAt ? fmt(u.welcomeSentAt) : l.welcomeNo}
        </span>
        {onCompose && mailable(u) && (
          <span><button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => onCompose([{ id: u.id, email: u.email }])}>
            <Icon name="mail" className="ui-btn__icon" /> {l.composeOne}
          </button></span>
        )}
      </div>
      {canEdit ? (
        <div className="admin-user__controls">
          <label className="ui-field">
            <span className="ui-field__label">{l.role}</span>
            <select className="ui-select ui-select--sm" value={role} onChange={(e) => setRole(e.target.value)} disabled={busy} data-testid="role-select">
              {/* Cari rol təklif siyahısında yoxdursa da görünsün (məs. admin superadmin-ə) */}
              {[...new Set([...options, ...(options.includes(u.role) ? [] : [u.role])])].map(r => (
                <option key={r} value={r} disabled={!options.includes(r)}>{roles[r] || r}</option>
              ))}
            </select>
          </label>
          {role === 'mosque_rep' && (
            <label className="ui-field">
              <span className="ui-field__label">{l.mosqueId}</span>
              <input className="ui-input ui-input--sm" value={mosque} onChange={(e) => setMosque(e.target.value)} maxLength={64} spellCheck={false} autoCapitalize="none" placeholder="baku-taza-pir" disabled={busy} />
            </label>
          )}
          <div className="admin-user__btns">
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={saveRole} disabled={busy || !dirty}>{l.save}</button>
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => act(() => adminSetDisabled(u.id, !u.disabled))} disabled={busy}>
              <Icon name={u.disabled ? 'check' : 'close'} className="ui-btn__icon" /> {u.disabled ? l.enable : l.disable}
            </button>
          </div>
        </div>
      ) : (
        <p className="admin-user__ro"><Icon name="lock" size={16} /> {l.readOnly}</p>
      )}
    </article>
  )
}

export default function UserManager({ actorRole = 'admin', actorEmail = '', onCompose }) {
  const { lang } = useLang()
  const l = pickUi(LABELS, lang)
  const common = pickUi(AUTH_TEXT, lang)
  const roles = common.roles
  const [q, setQ] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [toast, setToast] = useState('')
  const [audit, setAudit] = useState(null)
  const [auditPage, setAuditPage] = useState(1)
  const [verified, setVerified] = useState('')
  const [langF, setLangF] = useState('')
  const [sortKey, setSortKey] = useState('new')
  // Məktub üçün seçilənlər (yalnız baş admin): id → { id, email }; səhifələr arasında qalır
  const [picked, setPicked] = useState({})
  const toastTimer = useRef(0)

  const fmt = useMemo(() => {
    let f = null
    try { f = new Intl.DateTimeFormat(lang === 'az' ? 'az-Latn-AZ' : lang, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) } catch { /* köhnə brauzer */ }
    return (ms) => (ms ? (f ? f.format(new Date(ms)) : new Date(ms).toLocaleString()) : '')
  }, [lang])

  const errMsg = useCallback((e) => {
    if (e && e.local) return l[e.local]
    const k = errorKey(e)
    return l[k] || common[k] || common.errUnknown
  }, [l, common])

  const load = useCallback(async () => {
    setErr('')
    const [sort, dir] = SORTS[sortKey] || SORTS.new
    try { setData(await adminListUsers({ q: query, page, verified, lang: langF, sort, dir })) } catch (e) { setErr(errMsg(e)); setData({ users: [], total: 0, page, pageSize: 50 }) }
  }, [query, page, verified, langF, sortKey, errMsg])
  useEffect(() => { load() }, [load])

  const loadAudit = useCallback(async () => {
    try { setAudit(await adminRoleAudit(auditPage)) } catch { setAudit({ entries: [], page: auditPage, pageSize: 50 }) }
  }, [auditPage])
  useEffect(() => { loadAudit() }, [loadAudit])
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const onSaved = (u) => {
    setErr('')
    if (u) setData(d => d && ({ ...d, users: d.users.map(x => (x.id === u.id ? u : x)) }))
    setToast(l.saved)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2400)
    loadAudit()
  }
  const onError = (e) => {
    setErr(errMsg(e))
    if (e && e.code === 'not_found') load()
  }

  const pages = data ? Math.max(1, Math.ceil((data.total || 0) / (data.pageSize || 50))) : 1
  const pickedList = Object.values(picked)
  const toggle = (u) => setPicked((p) => {
    const next = { ...p }
    if (next[u.id]) delete next[u.id]
    else next[u.id] = { id: u.id, email: u.email }
    return next
  })
  const pickPage = () => setPicked((p) => {
    const next = { ...p }
    for (const u of (data && data.users) || []) if (mailable(u)) next[u.id] = { id: u.id, email: u.email }
    return next
  })
  const facets = data && data.facets
  const langOptions = facets && Array.isArray(facets.langs) ? facets.langs.filter((x) => x.lang !== 'none') : []
  const setFilter = (fn) => (e) => { fn(e.target.value); setPage(1) }
  const actText = { role: l.actRole, disable: l.actDisable, enable: l.actEnable }

  return (
    <div>
      <AdminHeader icon="user" title={l.title} sub={l.sub} />
      <form className="admin-users-search" role="search" onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(q.trim()) }}>
        <label className="ui-sr-only" htmlFor="admin-users-q">{l.search}</label>
        <input id="admin-users-q" type="search" className="ui-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={l.search} maxLength={100} />
        <button type="submit" className="ui-btn ui-btn--secondary"><Icon name="search" className="ui-btn__icon" /> {l.find}</button>
      </form>
      <div className="admin-users-filters">
        <label className="ui-field">
          <span className="ui-field__label">{l.filterVerified}</span>
          <select className="ui-select ui-select--sm" value={verified} onChange={setFilter(setVerified)} data-testid="filter-verified">
            <option value="">{l.all}</option>
            <option value="1">{l.onlyVerified}</option>
            <option value="0">{l.onlyUnverified}</option>
          </select>
        </label>
        <label className="ui-field">
          <span className="ui-field__label">{l.filterLang}</span>
          <select className="ui-select ui-select--sm" value={langF} onChange={setFilter(setLangF)} data-testid="filter-lang">
            <option value="">{l.anyLang}</option>
            {langOptions.map((x) => <option key={x.lang} value={x.lang}>{x.lang.toUpperCase()} ({x.n})</option>)}
            <option value="none">{l.noLang}</option>
          </select>
        </label>
        <label className="ui-field">
          <span className="ui-field__label">{l.sortLabel}</span>
          <select className="ui-select ui-select--sm" value={sortKey} onChange={setFilter(setSortKey)} data-testid="sort-users">
            <option value="new">{l.sortNew}</option>
            <option value="old">{l.sortOld}</option>
            <option value="login">{l.sortLogin}</option>
            <option value="email">{l.sortEmail}</option>
            <option value="name">{l.sortName}</option>
            <option value="lang">{l.sortLang}</option>
          </select>
        </label>
      </div>
      {onCompose && (
        <div className="admin-users-pickbar" data-testid="pick-bar">
          <span className="ui-num" aria-live="polite">{fillN(l.selectedN, { n: pickedList.length })}</span>
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={pickPage} disabled={!data || !data.users.some(mailable)}>{l.selectPage}</button>
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setPicked({})} disabled={!pickedList.length}>{l.clearSel}</button>
          <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => onCompose(pickedList)} disabled={!pickedList.length}>
            <Icon name="mail" className="ui-btn__icon" /> {l.composeSel}
          </button>
        </div>
      )}
      {err && <AdminAlert>{err}</AdminAlert>}
      {data === null ? <AdminEmpty busy /> : (
        <>
          <p className="admin-users-total">{l.total}: <span className="ui-num">{data.total || 0}</span>
            {facets && <> · {fillN(l.stats, { v: facets.verified, u: facets.unverified, o: facets.optedOut })}</>}
          </p>
          {data.users.length === 0 ? <AdminEmpty icon="user">{l.none}</AdminEmpty> : (
            <div className="admin-users-list">
              {data.users.map(u => (
                <UserRow key={u.id} u={u} actorRole={actorRole} actorEmail={actorEmail} l={l} roles={roles} fmt={fmt} onSaved={onSaved} onError={onError}
                  selectable={Boolean(onCompose)} checked={Boolean(picked[u.id])} onToggle={toggle} onCompose={onCompose} />
              ))}
            </div>
          )}
          {pages > 1 && (
            <nav className="admin-users-pager" aria-label={l.page}>
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>{l.prev}</button>
              <span className="ui-num">{l.page} {page} / {pages}</span>
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>{l.next}</button>
            </nav>
          )}
        </>
      )}

      <section className="admin-section admin-users-audit" aria-labelledby="admin-audit-title">
        <span id="admin-audit-title"><SectionTitle icon="clock">{l.audit}</SectionTitle></span>
        {audit === null ? <AdminEmpty busy /> : audit.entries.length === 0 ? <AdminEmpty icon="clock">{l.auditNone}</AdminEmpty> : (
          <ol className="admin-audit" data-testid="role-audit">
            {audit.entries.map(x => (
              <li key={x.id}>
                <span className="admin-audit__when">{fmt(x.at)}</span>
                <span className="admin-audit__what">
                  <strong>{actText[x.action] || x.action}</strong>{' '}
                  <bdi>{x.targetEmail || `#${x.targetId}`}</bdi>
                  {x.targetKind === 'admin' && <> ({l.adminAccount})</>}
                  {x.action === 'role' && <>: {roles[x.oldRole] || x.oldRole} → {roles[x.newRole] || x.newRole}</>}
                </span>
                <span className="admin-audit__who">{x.actorKind === 'script' ? l.script : <bdi>{x.actorEmail || `#${x.actorId}`}</bdi>}</span>
              </li>
            ))}
          </ol>
        )}
        {audit && (audit.page > 1 || audit.entries.length >= (audit.pageSize || 50)) && (
          <nav className="admin-users-pager" aria-label={l.audit}>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={auditPage <= 1} onClick={() => setAuditPage(p => p - 1)}>{l.prev}</button>
            <span className="ui-num">{l.page} {auditPage}</span>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={audit.entries.length < (audit.pageSize || 50)} onClick={() => setAuditPage(p => p + 1)}>{l.next}</button>
          </nav>
        )}
      </section>
      <AdminToast message={toast} />
    </div>
  )
}
