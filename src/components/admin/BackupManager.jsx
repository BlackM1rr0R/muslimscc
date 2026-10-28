import { useState, useRef } from 'react'
import { useLang } from '../../contexts/LangContext'
import { AdminHeader, SectionTitle, AdminAlert } from './AdminUi'
import Icon from '../Icon'
import { exportAllData } from '../../data/adminContent'

const LABELS = {
  az: { title:'Ehtiyat nüsxə və bərpa', sub:'Bütün məlumatları idarə edin', export:'İxrac et', exportDesc:'Bütün admin məlumatlarını JSON formatında endirin', import:'İdxal et', importDesc:'JSON faylından məlumatları yükləyin', clear:'Hamısını sil', clearDesc:'Bütün admin məzmununu silin (geri qaytarıla bilməz)', exportBtn:'JSON yüklə', importBtn:'JSON faylı seç', clearBtn:'Sil', confirmClear:'Bütün admin məlumatları silmək istəyirsiniz? Bu əməliyyat geri qaytarıla bilməz!', imported:'Uğurla idxal olundu! Səhifəni yeniləyin.', importError:'Fayl yanlışdır', cleared:'Hamısı silindi', danger:'TƏHLÜKƏLİ', importViaConsole:'Firebase-ə idxalı Firebase konsolundan etmək tövsiyə olunur', clearViaConsole:'Firebase-dəki məlumatları Firebase konsolundan silin' },
  en: { title:'Backup & Restore', sub:'Manage all your data', export:'Export', exportDesc:'Download all admin data as JSON', import:'Import', importDesc:'Load data from JSON file', clear:'Delete all', clearDesc:'Delete all admin content (cannot be undone)', exportBtn:'Download JSON', importBtn:'Select JSON file', clearBtn:'Delete', confirmClear:'Delete all admin data? This cannot be undone!', imported:'Imported! Reload the page.', importError:'Invalid file', cleared:'All cleared', danger:'DANGER', importViaConsole:'Importing into Firebase is recommended via the Firebase console', clearViaConsole:'Delete Firebase data from the Firebase console' },
  ru: { title:'Резервная копия и восстановление', sub:'Управление данными', export:'Экспорт', exportDesc:'Скачать все данные в JSON', import:'Импорт', importDesc:'Загрузить данные из JSON', clear:'Удалить всё', clearDesc:'Удалить весь контент админки (необратимо)', exportBtn:'Скачать JSON', importBtn:'Выбрать JSON', clearBtn:'Удалить', confirmClear:'Удалить всё? Необратимо!', imported:'Импортировано! Перезагрузите.', importError:'Неверный файл', cleared:'Очищено', danger:'ОПАСНО', importViaConsole:'Импорт в Firebase рекомендуется выполнять через консоль Firebase', clearViaConsole:'Удаляйте данные Firebase через консоль Firebase' },
  ar: { title:'النسخ الاحتياطي والاستعادة', sub:'إدارة البيانات', export:'تصدير', exportDesc:'تحميل البيانات بصيغة JSON', import:'استيراد', importDesc:'تحميل من ملف JSON', clear:'حذف الكل', clearDesc:'حذف كل المحتوى (لا يمكن التراجع)', exportBtn:'تحميل JSON', importBtn:'اختر ملف JSON', clearBtn:'حذف', confirmClear:'حذف الكل؟ لا يمكن التراجع!', imported:'تم الاستيراد!', importError:'ملف غير صحيح', cleared:'تم المسح', danger:'خطر', importViaConsole:'يُنصح بالاستيراد إلى Firebase عبر لوحة تحكم Firebase', clearViaConsole:'احذف بيانات Firebase من لوحة تحكم Firebase' },
  tr: { title:'Yedekleme ve geri yükleme', sub:'Verileri yönetin', export:'Dışa Aktar', exportDesc:'Tüm verileri JSON olarak indir', import:'İçe Aktar', importDesc:'JSON dosyasından yükle', clear:'Tümünü sil', clearDesc:'Tüm içeriği sil (geri alınamaz)', exportBtn:'JSON İndir', importBtn:'JSON dosyası seç', clearBtn:'Sil', confirmClear:'Hepsi silinsin mi? Geri alınamaz!', imported:'İçe aktarıldı! Yenileyin.', importError:'Geçersiz dosya', cleared:'Temizlendi', danger:'TEHLİKE', importViaConsole:'Firebase içe aktarımının Firebase konsolundan yapılması önerilir', clearViaConsole:'Firebase verilerini Firebase konsolundan silin' },
}

export default function BackupManager() {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az
  const fileInputRef = useRef(null)
  const [msg, setMsg] = useState('')

  const handleExport = async () => {
    const json = await exportAllData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `muslims-cc-backup-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e) => {
    setMsg('error:' + l.importViaConsole)
    setTimeout(() => setMsg(''), 4000)
    e.target.value = ''
  }

  const handleClear = () => {
    setMsg('error:' + l.clearViaConsole)
    setTimeout(() => setMsg(''), 4000)
  }

  return (
    <div>
      <AdminHeader icon="download" title={l.title} sub={l.sub} />

      {msg && (
        <AdminAlert tone={msg.startsWith('success') ? 'ok' : 'warn'} className="admin-backup-msg">
          {msg.slice(msg.indexOf(':') + 1)}
        </AdminAlert>
      )}

      {/* İxrac */}
      <div className="admin-section" data-reveal>
        <SectionTitle icon="download">{l.export}</SectionTitle>
        <p className="admin-section-lead">{l.exportDesc}</p>
        <button type="button" onClick={handleExport} className="admin-submit-btn">
          <Icon name="download" /> {l.exportBtn}
        </button>
      </div>

      {/* İdxal */}
      <div className="admin-section" data-reveal>
        <SectionTitle icon="arrowUp">{l.import}</SectionTitle>
        <p className="admin-section-lead">{l.importDesc}</p>
        <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImport} hidden />
        <button type="button" onClick={() => fileInputRef.current?.click()} className="admin-cancel-btn">
          <Icon name="arrowUp" /> {l.importBtn}
        </button>
      </div>

      {/* Təhlükəli zona */}
      <div className="admin-section admin-danger" data-reveal>
        <SectionTitle icon="alert">{l.danger}</SectionTitle>
        <p className="admin-section-lead">{l.clearDesc}</p>
        <button type="button" onClick={handleClear} className="admin-submit-btn admin-btn-danger">
          <Icon name="trash" /> {l.clearBtn}
        </button>
      </div>
    </div>
  )
}
