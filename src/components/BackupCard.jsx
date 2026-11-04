// ═══════════════════════════════════════════════════════
// BackupCard — "Məlumatlarım": ehtiyat nüsxəni yüklə / fayldan bərpa et
// Məntiq: utils/userBackup.js. Fayl istifadəçinin cihazında qalır.
// İstifadə: namaz izləyicisi səhifəsində kart kimi, footer-də dialoqda.
// ═══════════════════════════════════════════════════════
import { useRef, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import Icon from './Icon'
import SyncPanel from './SyncPanel'
import {
  collectBackup, parseBackup, restoreBackup, backupFileName, readLastBackup, markBackedUp,
} from '../utils/userBackup'
import '../styles/BackupCard.css'

const LOCALE = { az: 'az-AZ', en: 'en-GB', ru: 'ru-RU', ar: 'ar', tr: 'tr-TR' }
// Chrome-da az-AZ ay adları yoxdur ("2026 M10 30") — saytın qalan yerləri kimi öz adlarımız
const AZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr']

export const BACKUP_TXT = {
  az: {
    title: 'Məlumatlarım', lead: 'Namaz izləyicisi, qəza, hifz, sevimlilər, jurnallar və ayarlar yalnız bu brauzerdə saxlanılır. Brauzeri təmizləsəniz və ya telefonu dəyişsəniz, itə bilər — ehtiyat nüsxəni fayl kimi saxlayın.',
    onDevice: 'Bu cihazda', items: 'qeyd', last: 'Son ehtiyat nüsxə', never: 'hələ yoxdur',
    download: 'Ehtiyat nüsxəni yüklə', restore: 'Fayldan bərpa et', downloaded: 'Fayl yükləndi — onu etibarlı yerdə saxlayın.',
    confirmTitle: 'Bu fayldan bərpa edilsin?', confirmMeta: 'Faylın tarixi', confirmWarn: 'Fayldakı bölmələr bu cihazdakı eyni bölmələrin yerinə yazılacaq. Faylda olmayan məlumat silinmir.',
    doRestore: 'Bərpa et', cancel: 'Ləğv et', restored: 'Bərpa olundu — səhifə yenilənir…',
    errors: { json: 'Fayl oxunmadı — bu, ehtiyat nüsxə faylı deyil.', kind: 'Bu fayl Muslims.cc ehtiyat nüsxəsi deyil.', version: 'Bu fayl saytın daha yeni versiyasında yaradılıb — səhifəni yeniləyin.', empty: 'Faylda bərpa ediləcək məlumat yoxdur.', size: 'Fayl çox böyükdür.' },
    privacy: 'Fayl serverə göndərilmir — yalnız sizin cihazınızda qalır.',
  },
  en: {
    title: 'My data', lead: 'Your prayer tracker, qada, hifz, favourites, journals and settings are stored only in this browser. They can be lost if you clear the browser or change phones — save a backup as a file.',
    onDevice: 'On this device', items: 'items', last: 'Last backup', never: 'none yet',
    download: 'Download backup', restore: 'Restore from file', downloaded: 'File downloaded — keep it somewhere safe.',
    confirmTitle: 'Restore from this file?', confirmMeta: 'File date', confirmWarn: 'Sections in the file will replace the same sections on this device. Data that is not in the file is not deleted.',
    doRestore: 'Restore', cancel: 'Cancel', restored: 'Restored — reloading the page…',
    errors: { json: 'The file could not be read — it is not a backup file.', kind: 'This file is not a Muslims.cc backup.', version: 'This file was made by a newer version of the site — please reload the page.', empty: 'There is nothing to restore in this file.', size: 'The file is too large.' },
    privacy: 'The file is never sent to a server — it stays on your device.',
  },
  ru: {
    title: 'Мои данные', lead: 'Трекер намазов, каза, хифз, избранное, дневники и настройки хранятся только в этом браузере. Они могут пропасть, если очистить браузер или сменить телефон, — сохраните резервную копию в файл.',
    onDevice: 'На этом устройстве', items: 'записей', last: 'Последняя копия', never: 'ещё нет',
    download: 'Скачать резервную копию', restore: 'Восстановить из файла', downloaded: 'Файл скачан — храните его в надёжном месте.',
    confirmTitle: 'Восстановить из этого файла?', confirmMeta: 'Дата файла', confirmWarn: 'Разделы из файла заменят такие же разделы на этом устройстве. Данные, которых нет в файле, не удаляются.',
    doRestore: 'Восстановить', cancel: 'Отмена', restored: 'Восстановлено — страница перезагружается…',
    errors: { json: 'Файл не читается — это не файл резервной копии.', kind: 'Это не резервная копия Muslims.cc.', version: 'Файл создан более новой версией сайта — обновите страницу.', empty: 'В файле нечего восстанавливать.', size: 'Файл слишком большой.' },
    privacy: 'Файл не отправляется на сервер — он остаётся на вашем устройстве.',
  },
  ar: {
    title: 'بياناتي', lead: 'متابعة الصلوات والقضاء والحفظ والمفضلة والمذكرات والإعدادات محفوظة في هذا المتصفح فقط، وقد تضيع إذا مسحت المتصفح أو غيّرت الهاتف — احفظ نسخة احتياطية في ملف.',
    onDevice: 'على هذا الجهاز', items: 'عنصرًا', last: 'آخر نسخة احتياطية', never: 'لا توجد بعد',
    download: 'تنزيل النسخة الاحتياطية', restore: 'الاستعادة من ملف', downloaded: 'تم تنزيل الملف — احفظه في مكان آمن.',
    confirmTitle: 'هل تستعيد من هذا الملف؟', confirmMeta: 'تاريخ الملف', confirmWarn: 'ستحل أقسام الملف محل الأقسام نفسها على هذا الجهاز، ولا تُحذف البيانات غير الموجودة في الملف.',
    doRestore: 'استعادة', cancel: 'إلغاء', restored: 'تمت الاستعادة — يُعاد تحميل الصفحة…',
    errors: { json: 'تعذّرت قراءة الملف — ليس ملف نسخة احتياطية.', kind: 'هذا الملف ليس نسخة احتياطية من الموقع.', version: 'أُنشئ الملف بإصدار أحدث من الموقع — أعد تحميل الصفحة.', empty: 'لا يوجد في الملف ما يُستعاد.', size: 'الملف كبير جدًا.' },
    privacy: 'لا يُرسَل الملف إلى أي خادم — يبقى على جهازك.',
  },
  tr: {
    title: 'Verilerim', lead: 'Namaz takibi, kaza, hıfz, favoriler, günlükler ve ayarlar yalnızca bu tarayıcıda saklanır. Tarayıcıyı temizlerseniz veya telefonu değiştirirseniz kaybolabilir — yedeği dosya olarak saklayın.',
    onDevice: 'Bu cihazda', items: 'kayıt', last: 'Son yedek', never: 'henüz yok',
    download: 'Yedeği indir', restore: 'Dosyadan geri yükle', downloaded: 'Dosya indirildi — güvenli bir yerde saklayın.',
    confirmTitle: 'Bu dosyadan geri yüklensin mi?', confirmMeta: 'Dosya tarihi', confirmWarn: 'Dosyadaki bölümler bu cihazdaki aynı bölümlerin yerine yazılacak. Dosyada olmayan veriler silinmez.',
    doRestore: 'Geri yükle', cancel: 'İptal', restored: 'Geri yüklendi — sayfa yenileniyor…',
    errors: { json: 'Dosya okunamadı — bu bir yedek dosyası değil.', kind: 'Bu dosya bir Muslims.cc yedeği değil.', version: 'Bu dosya sitenin daha yeni bir sürümüyle oluşturuldu — sayfayı yenileyin.', empty: 'Dosyada geri yüklenecek veri yok.', size: 'Dosya çok büyük.' },
    privacy: 'Dosya sunucuya gönderilmez — cihazınızda kalır.',
  },
}

function download(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = name; a.rel = 'noopener'; a.style.display = 'none'
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export default function BackupCard({ className = '', headingLevel = 2 }) {
  const { lang } = useLang()
  const t = BACKUP_TXT[lang] || BACKUP_TXT.az
  const fileRef = useRef(null)
  const [count, setCount] = useState(() => { try { return collectBackup().count } catch { return 0 } })
  const [last, setLast] = useState(readLastBackup)
  // null | { kind:'downloaded' } | { kind:'confirm', backup } | { kind:'restored' } | { kind:'error', code }
  const [state, setState] = useState(null)
  const fmtDate = (iso) => {
    try {
      const d = new Date(iso), l = LOCALE[lang] || 'az-AZ'
      const time = d.toLocaleTimeString(l, { hour: '2-digit', minute: '2-digit', hour12: lang === 'ar' ? undefined : false })
      const date = lang === 'az'
        ? `${d.getDate()} ${AZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`
        : d.toLocaleDateString(l, { day: 'numeric', month: 'long', year: 'numeric' })
      return `${date}, ${time}`
    } catch { return iso }
  }
  const H = `h${headingLevel}`

  const onDownload = () => {
    const now = new Date()
    const b = collectBackup(localStorage, now)
    download(new Blob([JSON.stringify(b, null, 1)], { type: 'application/json' }), backupFileName(now))
    markBackedUp(now)
    setLast(now.toISOString())
    setCount(b.count)
    setState({ kind: 'downloaded' })
  }

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const res = parseBackup(await file.text())
    setState(res.ok ? { kind: 'confirm', backup: res.backup } : { kind: 'error', code: res.code })
  }

  const onRestore = () => {
    if (state?.kind !== 'confirm') return
    restoreBackup(state.backup)
    setState({ kind: 'restored' })
    // Bütün bölmələr yeni məlumatı oxusun
    setTimeout(() => window.location.reload(), 1200)
  }

  return (
    <section className={`ui-card bk-card ${className}`} aria-labelledby="bk-title">
      <div className="bk-head">
        <span className="ui-icon-tile bk-icon" aria-hidden="true"><Icon name="shield" /></span>
        <div>
          <H id="bk-title" className="bk-title">{t.title}</H>
          <p className="bk-lead">{t.lead}</p>
        </div>
      </div>

      <dl className="bk-stats">
        <div><dt>{t.onDevice}</dt><dd><span className="ui-num">{count}</span> {t.items}</dd></div>
        <div><dt>{t.last}</dt><dd>{last ? fmtDate(last) : t.never}</dd></div>
      </dl>

      {state?.kind === 'confirm' ? (
        <div className="bk-confirm" role="alertdialog" aria-labelledby="bk-confirm-t" aria-describedby="bk-confirm-d">
          <p id="bk-confirm-t" className="bk-confirm__t">{t.confirmTitle}</p>
          <p className="bk-confirm__meta">
            {state.backup.createdAt && <>{t.confirmMeta}: <b>{fmtDate(state.backup.createdAt)}</b> · </>}
            <span className="ui-num">{state.backup.count}</span> {t.items}
          </p>
          <p id="bk-confirm-d" className="bk-confirm__warn"><Icon name="alert" size={15} /> {t.confirmWarn}</p>
          <div className="bk-actions">
            <button type="button" className="ui-btn ui-btn--primary" onClick={onRestore}><Icon name="refresh" className="ui-btn__icon" />{t.doRestore}</button>
            <button type="button" className="ui-btn ui-btn--secondary" onClick={() => setState(null)}>{t.cancel}</button>
          </div>
        </div>
      ) : (
        <div className="bk-actions">
          <button type="button" className="ui-btn ui-btn--primary" onClick={onDownload} disabled={!count}>
            <Icon name="download" className="ui-btn__icon" />{t.download}
          </button>
          <button type="button" className="ui-btn ui-btn--secondary" onClick={() => fileRef.current?.click()} disabled={state?.kind === 'restored'}>
            <Icon name="refresh" className="ui-btn__icon" />{t.restore}
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="ui-sr-only" tabIndex={-1} aria-hidden="true" onChange={onFile} />
        </div>
      )}

      <p className="bk-status" role="status" aria-live="polite">
        {state?.kind === 'downloaded' && <><Icon name="check" size={15} /> {t.downloaded}</>}
        {state?.kind === 'restored' && <><Icon name="check" size={15} /> {t.restored}</>}
        {state?.kind === 'error' && <span className="bk-err"><Icon name="alert" size={15} /> {t.errors[state.code] || t.errors.json}</span>}
      </p>
      <p className="bk-privacy"><Icon name="info" size={14} /> {t.privacy}</p>

      {/* Cihazlar arası sinxronizasiya — bərpa kodu, uçdan-uca şifrələmə */}
      <SyncPanel lang={lang} fmtDate={fmtDate} />
    </section>
  )
}
