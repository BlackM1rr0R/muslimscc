// ═══════════════════════════════════════════════════════
// SyncPanel — cihazlar arası sinxronizasiya (BackupCard-ın içində)
// Hesab yoxdur: bərpa kodu. Məlumat brauzerdə şifrələnir (utils/syncCrypto),
// server yalnız şifrəli bloku saxlayır (server/sync.js).
// ═══════════════════════════════════════════════════════
import { useState } from 'react'
import Icon from './Icon'
import { readSync, enable, fetchRemote, link, push, pull, unlink, removeRemote, setAuto } from '../utils/userSync'

const AUTO = {
  az: { label: 'Avtomatik sinxronizasiya', hint: 'Dəyişikliklər özü göndərilir və gətirilir; hər iki cihaz dəyişibsə heç nə üzərinə yazılmır — siz seçirsiniz.' },
  en: { label: 'Automatic sync', hint: 'Changes are sent and fetched on their own; if both devices changed, nothing is overwritten — you choose.' },
  ru: { label: 'Автоматическая синхронизация', hint: 'Изменения отправляются и загружаются сами; если изменены оба устройства, ничего не перезаписывается — выбираете вы.' },
  tr: { label: 'Otomatik senkronizasyon', hint: 'Değişiklikler kendiliğinden gönderilir ve alınır; iki cihaz da değiştiyse hiçbir şeyin üzerine yazılmaz — siz seçersiniz.' },
  ar: { label: 'مزامنة تلقائية', hint: 'تُرسل التغييرات وتُجلب تلقائيًا، وإذا تغيّر الجهازان لا يُستبدل شيء — أنت تختار.' },
}

// Kodun nümunəsi — dildən asılı deyil (latın hərfləri və rəqəmlər)
const CODE_PH = 'XXXX-XXXX-XXXX-XXXX-XXXX-XXXX'

export const SYNC_TXT = {
  az: {
    title: 'Cihazlar arası sinxronizasiya', lead: 'Hesab lazım deyil: bərpa kodu ilə telefon və kompüterdə eyni məlumat. Məlumat brauzerinizdə şifrələnir — server onu oxuya bilmir.',
    enable: 'Sinxronizasiyanı aç', haveCode: 'Kodum var', codeLabel: 'Bərpa kodu', connect: 'Qoş', cancel: 'Ləğv et',
    saveCode: 'Bu kodu yazıb saxlayın. Başqa cihazda "Kodum var" düyməsinə basıb onu daxil edin.', codeWarn: 'Kodu itirsəniz, məlumatı geri qaytarmaq mümkün olmayacaq. Kodu bilən hər kəs məlumatınızı görə bilər — heç kimə göndərməyin.',
    copy: 'Kopyala', copied: 'Kopyalandı', show: 'Göstər', hide: 'Gizlət', done: 'Saxladım',
    on: 'Sinxronizasiya açıqdır', synced: 'Son sinxronizasiya',
    push: 'Bu cihazdan göndər', pull: 'Serverdən gətir', unlink: 'Bu cihazda söndür', del: 'Serverdən sil', delQ: 'Serverdəki şifrəli nüsxə birdəfəlik silinsin? Bu kodla qoşulmuş digər cihazlar da sinxronizasiyanı itirəcək; bu cihazdakı məlumat qalır.', delYes: 'Bəli, sil', deleted: 'Serverdəki nüsxə silindi.',
    pushed: 'Göndərildi.', pulled: 'Gətirildi — səhifə yenilənir…', unlinked: 'Bu cihazda söndürüldü. Serverdəki məlumat kodla yenə əlçatandır.',
    confirmTitle: 'Bu kodun məlumatı bu cihaza yazılsın?', confirmMeta: 'Son yenilənmə', items: 'qeyd', confirmWarn: 'Serverdəki bölmələr bu cihazdakı eyni bölmələrin yerinə yazılacaq.', doLink: 'Qoş və yaz',
    errors: { conflict: 'Başqa cihaz daha yeni məlumat göndərib — əvvəlcə "Serverdən gətir" düyməsinə basın.', bad_code: 'Kod düzgün deyil — 24 simvol olmalıdır.', not_found: 'Bu kodla məlumat tapılmadı.', decrypt: 'Kod uyğun gəlmir və ya məlumat zədələnib.', too_big: 'Məlumat çox böyükdür (AI söhbət tarixçəsini silməyi yoxlayın).', network: 'Serverə qoşulmaq alınmadı. İnterneti yoxlayın.' },
  },
  en: {
    title: 'Sync between devices', lead: 'No account needed: the same data on your phone and computer with a recovery code. Data is encrypted in your browser — the server cannot read it.',
    enable: 'Turn on sync', haveCode: 'I have a code', codeLabel: 'Recovery code', connect: 'Connect', cancel: 'Cancel',
    saveCode: 'Write this code down and keep it. On another device, press "I have a code" and enter it.', codeWarn: 'If you lose the code, the data cannot be recovered. Anyone with the code can see your data — never send it to anyone.',
    copy: 'Copy', copied: 'Copied', show: 'Show', hide: 'Hide', done: 'I saved it',
    on: 'Sync is on', synced: 'Last synced',
    push: 'Send from this device', pull: 'Get from server', unlink: 'Turn off on this device', del: 'Delete from server', delQ: 'Delete the encrypted copy on the server for good? Other devices connected with this code will also lose sync; the data on this device stays.', delYes: 'Yes, delete', deleted: 'The copy on the server was deleted.',
    pushed: 'Sent.', pulled: 'Received — reloading the page…', unlinked: 'Turned off on this device. The data on the server is still available with the code.',
    confirmTitle: 'Write this code’s data to this device?', confirmMeta: 'Last updated', items: 'items', confirmWarn: 'Sections from the server will replace the same sections on this device.', doLink: 'Connect and write',
    errors: { conflict: 'Another device has sent newer data — press "Get from server" first.', bad_code: 'The code is not valid — it must be 24 characters.', not_found: 'No data was found for this code.', decrypt: 'The code does not match or the data is damaged.', too_big: 'The data is too large (try deleting the AI chat history).', network: 'Could not reach the server. Check your internet connection.' },
  },
  ru: {
    title: 'Синхронизация между устройствами', lead: 'Аккаунт не нужен: одни и те же данные на телефоне и компьютере по коду восстановления. Данные шифруются в браузере — сервер не может их прочитать.',
    enable: 'Включить синхронизацию', haveCode: 'У меня есть код', codeLabel: 'Код восстановления', connect: 'Подключить', cancel: 'Отмена',
    saveCode: 'Запишите и сохраните этот код. На другом устройстве нажмите «У меня есть код» и введите его.', codeWarn: 'Если потерять код, данные восстановить нельзя. Любой, у кого есть код, увидит ваши данные — никому его не отправляйте.',
    copy: 'Копировать', copied: 'Скопировано', show: 'Показать', hide: 'Скрыть', done: 'Я сохранил',
    on: 'Синхронизация включена', synced: 'Последняя синхронизация',
    push: 'Отправить с этого устройства', pull: 'Получить с сервера', unlink: 'Отключить на этом устройстве', del: 'Удалить с сервера', delQ: 'Удалить зашифрованную копию на сервере навсегда? Другие устройства с этим кодом тоже потеряют синхронизацию; данные на этом устройстве останутся.', delYes: 'Да, удалить', deleted: 'Копия на сервере удалена.',
    pushed: 'Отправлено.', pulled: 'Получено — страница перезагружается…', unlinked: 'Отключено на этом устройстве. Данные на сервере по-прежнему доступны по коду.',
    confirmTitle: 'Записать данные этого кода на устройство?', confirmMeta: 'Последнее обновление', items: 'записей', confirmWarn: 'Разделы с сервера заменят такие же разделы на этом устройстве.', doLink: 'Подключить и записать',
    errors: { conflict: 'Другое устройство отправило более новые данные — сначала нажмите «Получить с сервера».', bad_code: 'Неверный код — должно быть 24 символа.', not_found: 'По этому коду данные не найдены.', decrypt: 'Код не подходит или данные повреждены.', too_big: 'Данные слишком большие (попробуйте удалить историю чата с ИИ).', network: 'Не удалось связаться с сервером. Проверьте интернет.' },
  },
  ar: {
    title: 'المزامنة بين الأجهزة', lead: 'لا حاجة إلى حساب: البيانات نفسها على الهاتف والحاسوب برمز الاستعادة. تُشفَّر البيانات في متصفحك — ولا يستطيع الخادم قراءتها.',
    enable: 'تشغيل المزامنة', haveCode: 'لديّ رمز', codeLabel: 'رمز الاستعادة', connect: 'ربط', cancel: 'إلغاء',
    saveCode: 'اكتب هذا الرمز واحفظه. على جهاز آخر اضغط «لديّ رمز» وأدخله.', codeWarn: 'إذا أضعت الرمز فلا يمكن استعادة البيانات. كل من لديه الرمز يستطيع رؤية بياناتك — لا ترسله إلى أحد.',
    copy: 'نسخ', copied: 'تم النسخ', show: 'إظهار', hide: 'إخفاء', done: 'حفظته',
    on: 'المزامنة مفعّلة', synced: 'آخر مزامنة',
    push: 'إرسال من هذا الجهاز', pull: 'جلب من الخادم', unlink: 'إيقاف على هذا الجهاز', del: 'حذف من الخادم', delQ: 'هل تحذف النسخة المشفّرة على الخادم نهائيًا؟ ستفقد الأجهزة الأخرى المرتبطة بهذا الرمز المزامنة أيضًا، وتبقى البيانات على هذا الجهاز.', delYes: 'نعم، احذف', deleted: 'حُذفت النسخة من الخادم.',
    pushed: 'تم الإرسال.', pulled: 'تم الجلب — يُعاد تحميل الصفحة…', unlinked: 'أُوقفت على هذا الجهاز. ما زالت البيانات على الخادم متاحة بالرمز.',
    confirmTitle: 'هل تُكتب بيانات هذا الرمز على هذا الجهاز؟', confirmMeta: 'آخر تحديث', items: 'عنصرًا', confirmWarn: 'ستحل أقسام الخادم محل الأقسام نفسها على هذا الجهاز.', doLink: 'ربط وكتابة',
    errors: { conflict: 'أرسل جهاز آخر بيانات أحدث — اضغط «جلب من الخادم» أولًا.', bad_code: 'الرمز غير صحيح — يجب أن يكون 24 حرفًا.', not_found: 'لم تُوجد بيانات بهذا الرمز.', decrypt: 'الرمز غير مطابق أو البيانات تالفة.', too_big: 'البيانات كبيرة جدًا (جرّب حذف سجل محادثة الذكاء الاصطناعي).', network: 'تعذّر الاتصال بالخادم. تحقّق من الإنترنت.' },
  },
  tr: {
    title: 'Cihazlar arası eşitleme', lead: 'Hesap gerekmez: kurtarma koduyla telefonda ve bilgisayarda aynı veriler. Veriler tarayıcınızda şifrelenir — sunucu okuyamaz.',
    enable: 'Eşitlemeyi aç', haveCode: 'Kodum var', codeLabel: 'Kurtarma kodu', connect: 'Bağla', cancel: 'İptal',
    saveCode: 'Bu kodu yazıp saklayın. Başka bir cihazda "Kodum var" düğmesine basıp girin.', codeWarn: 'Kodu kaybederseniz veriler geri getirilemez. Kodu bilen herkes verilerinizi görebilir — kimseye göndermeyin.',
    copy: 'Kopyala', copied: 'Kopyalandı', show: 'Göster', hide: 'Gizle', done: 'Kaydettim',
    on: 'Eşitleme açık', synced: 'Son eşitleme',
    push: 'Bu cihazdan gönder', pull: 'Sunucudan getir', unlink: 'Bu cihazda kapat', del: 'Sunucudan sil', delQ: 'Sunucudaki şifreli kopya kalıcı olarak silinsin mi? Bu kodla bağlı diğer cihazlar da eşitlemeyi kaybeder; bu cihazdaki veriler kalır.', delYes: 'Evet, sil', deleted: 'Sunucudaki kopya silindi.',
    pushed: 'Gönderildi.', pulled: 'Getirildi — sayfa yenileniyor…', unlinked: 'Bu cihazda kapatıldı. Sunucudaki verilere kodla yine erişilebilir.',
    confirmTitle: 'Bu kodun verileri bu cihaza yazılsın mı?', confirmMeta: 'Son güncelleme', items: 'kayıt', confirmWarn: 'Sunucudaki bölümler bu cihazdaki aynı bölümlerin yerine yazılacak.', doLink: 'Bağla ve yaz',
    errors: { conflict: 'Başka bir cihaz daha yeni veri gönderdi — önce "Sunucudan getir" düğmesine basın.', bad_code: 'Kod geçersiz — 24 karakter olmalı.', not_found: 'Bu kodla veri bulunamadı.', decrypt: 'Kod eşleşmiyor veya veriler bozuk.', too_big: 'Veriler çok büyük (yapay zekâ sohbet geçmişini silmeyi deneyin).', network: 'Sunucuya ulaşılamadı. İnternetinizi kontrol edin.' },
  },
}

const errCode = (e) => {
  const m = e?.message
  if (['conflict', 'bad_code', 'not_found', 'decrypt', 'too_big'].includes(m)) return m
  return 'network'
}

export default function SyncPanel({ lang, fmtDate }) {
  const t = SYNC_TXT[lang] || SYNC_TXT.az
  const [sync, setSync] = useState(readSync)
  // view: 'idle' | 'created' | 'enter' | 'confirm'
  const [view, setView] = useState('idle')
  const [code, setCode] = useState('')
  const [input, setInput] = useState('')
  const [remote, setRemote] = useState(null)
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState(null)      // { ok?: text } | { err: code }
  const [shown, setShown] = useState(false)
  const [copied, setCopied] = useState(false)

  const run = async (name, fn) => {
    setBusy(name); setMsg(null)
    try { await fn() } catch (e) { setMsg({ err: errCode(e) }) } finally { setBusy('') }
  }
  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { /* */ }
  }
  const reloadSoon = () => setTimeout(() => window.location.reload(), 1200)

  const onEnable = () => run('enable', async () => {
    const r = await enable()
    setCode(r.code); setSync(readSync()); setView('created')
  })
  const onConnect = (e) => {
    e.preventDefault()
    run('connect', async () => {
      const r = await fetchRemote(input)
      setRemote(r); setView('confirm')
    })
  }
  const onLink = () => { link(remote); setSync(readSync()); setMsg({ ok: t.pulled }); setView('idle'); reloadSoon() }
  const onPush = () => run('push', async () => {
    const r = await push()
    if (r.conflict) { setMsg({ err: 'conflict' }); return }
    setSync(readSync()); setMsg({ ok: t.pushed })
  })
  const onPull = () => run('pull', async () => { await pull(); setSync(readSync()); setMsg({ ok: t.pulled }); reloadSoon() })
  const onUnlink = () => { unlink(); setSync(null); setView('idle'); setShown(false); setMsg({ ok: t.unlinked }) }
  const [askDel, setAskDel] = useState(false)
  const onDelete = () => run('del', async () => {
    await removeRemote()
    setSync(null); setAskDel(false); setShown(false); setMsg({ ok: t.deleted })
  })

  const masked = (c) => c.split('-').map((g, i) => (i === 0 ? g : '••••')).join('-')
  const spin = (name) => (busy === name ? <span className="ui-spin" aria-hidden="true" /> : null)

  return (
    <div className="sy" aria-labelledby="sy-title">
      <h3 id="sy-title" className="sy-title"><Icon name="refresh" size={16} /> {t.title}</h3>
      <p className="sy-lead">{t.lead}</p>

      {view === 'created' && (
        <div className="sy-code-box" role="status">
          <span className="sy-code-label">{t.codeLabel}</span>
          <code className="sy-code" data-testid="sync-code">{code}</code>
          <p className="sy-note">{t.saveCode}</p>
          <p className="sy-warn"><Icon name="alert" size={15} /> {t.codeWarn}</p>
          <div className="bk-actions">
            <button type="button" className="ui-btn ui-btn--secondary" onClick={() => copy(code)}><Icon name={copied ? 'check' : 'copy'} className="ui-btn__icon" />{copied ? t.copied : t.copy}</button>
            <button type="button" className="ui-btn ui-btn--primary" onClick={() => setView('idle')}>{t.done}</button>
          </div>
        </div>
      )}

      {view === 'confirm' && remote && (
        <div className="bk-confirm" role="alertdialog" aria-labelledby="sy-confirm-t">
          <p id="sy-confirm-t" className="bk-confirm__t">{t.confirmTitle}</p>
          <p className="bk-confirm__meta">
            {remote.updatedAt && <>{t.confirmMeta}: <b>{fmtDate(new Date(remote.updatedAt).toISOString())}</b> · </>}
            <span className="ui-num">{remote.backup.count}</span> {t.items}
          </p>
          <p className="bk-confirm__warn"><Icon name="alert" size={15} /> {t.confirmWarn}</p>
          <div className="bk-actions">
            <button type="button" className="ui-btn ui-btn--primary" onClick={onLink}>{t.doLink}</button>
            <button type="button" className="ui-btn ui-btn--secondary" onClick={() => { setView('idle'); setRemote(null) }}>{t.cancel}</button>
          </div>
        </div>
      )}

      {view === 'enter' && (
        <form className="sy-enter" onSubmit={onConnect}>
          <label className="ui-field">
            <span className="ui-field__label">{t.codeLabel}</span>
            <input className="ui-input sy-input" value={input} onChange={e => setInput(e.target.value)} placeholder={CODE_PH}
              autoComplete="off" autoCapitalize="characters" spellCheck="false" dir="ltr" />
          </label>
          <div className="bk-actions">
            <button type="submit" className="ui-btn ui-btn--primary" disabled={Boolean(busy) || input.trim().length < 20}>{spin('connect')}{t.connect}</button>
            <button type="button" className="ui-btn ui-btn--secondary" onClick={() => setView('idle')}>{t.cancel}</button>
          </div>
        </form>
      )}

      {view === 'idle' && !sync && (
        <div className="bk-actions">
          <button type="button" className="ui-btn ui-btn--primary" onClick={onEnable} disabled={Boolean(busy)}>{spin('enable')}<Icon name="shield" className="ui-btn__icon" />{t.enable}</button>
          <button type="button" className="ui-btn ui-btn--secondary" onClick={() => { setView('enter'); setMsg(null) }}>{t.haveCode}</button>
        </div>
      )}

      {view === 'idle' && sync && (
        <div className="sy-on">
          <p className="sy-on__state"><span className="sy-dot" aria-hidden="true" /> {t.on}</p>
          <p className="sy-on__code">
            <code className="sy-code sy-code--sm" dir="ltr">{shown ? sync.code : masked(sync.code)}</code>
            <button type="button" className="ui-link sy-link" onClick={() => setShown(v => !v)}>{shown ? t.hide : t.show}</button>
            <button type="button" className="ui-link sy-link" onClick={() => copy(sync.code)}>{copied ? t.copied : t.copy}</button>
          </p>
          {sync.syncedAt && <p className="sy-meta">{t.synced}: {fmtDate(sync.syncedAt)}</p>}
          <label className="sy-auto">
            <input type="checkbox" checked={sync.auto === true} data-testid="sync-auto"
              onChange={e => { setAuto(e.target.checked); setSync(readSync()) }} />
            <span><b>{(AUTO[lang] || AUTO.az).label}</b><small>{(AUTO[lang] || AUTO.az).hint}</small></span>
          </label>
          <div className="bk-actions">
            <button type="button" className="ui-btn ui-btn--primary" onClick={onPush} disabled={Boolean(busy)}>{spin('push')}<Icon name="send" className="ui-btn__icon" />{t.push}</button>
            <button type="button" className="ui-btn ui-btn--secondary" onClick={onPull} disabled={Boolean(busy)}>{spin('pull')}<Icon name="download" className="ui-btn__icon" />{t.pull}</button>
            <button type="button" className="ui-btn ui-btn--ghost" onClick={onUnlink} disabled={Boolean(busy)}>{t.unlink}</button>
          </div>
          {askDel ? (
            <div className="bk-confirm sy-del" role="alertdialog" aria-labelledby="sy-del-q">
              <p id="sy-del-q" className="bk-confirm__warn"><Icon name="alert" size={15} /> {t.delQ}</p>
              <div className="bk-actions">
                <button type="button" className="ui-btn ui-btn--primary sy-del__yes" onClick={onDelete} disabled={Boolean(busy)}>{spin('del')}<Icon name="trash" className="ui-btn__icon" />{t.delYes}</button>
                <button type="button" className="ui-btn ui-btn--secondary" onClick={() => setAskDel(false)}>{t.cancel}</button>
              </div>
            </div>
          ) : (
            <button type="button" className="ui-link sy-link sy-del-link" onClick={() => setAskDel(true)} disabled={Boolean(busy)}>
              <Icon name="trash" size={14} /> {t.del}
            </button>
          )}
        </div>
      )}

      <p className="bk-status" role="status" aria-live="polite">
        {msg?.ok && <><Icon name="check" size={15} /> {msg.ok}</>}
        {msg?.err && <span className="bk-err"><Icon name="alert" size={15} /> {t.errors[msg.err]}</span>}
      </p>
    </div>
  )
}
