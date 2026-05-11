import { useState, useRef } from 'react'
import { useLang } from '../../contexts/LangContext'
import { exportAllData } from '../../data/adminContent'

const LABELS = {
  az: { title:'Yedək və Bərpa', sub:'Bütün məlumatları idarə edin', export:'İxrac et', exportDesc:'Bütün admin məlumatlarını JSON formatında endirin', import:'İdxal et', importDesc:'JSON faylından məlumatları yükləyin', clear:'Hamısını sil', clearDesc:'Bütün admin məzmununu silin (geri qaytarıla bilməz)', exportBtn:'JSON Yüklə', importBtn:'JSON faylı seç', clearBtn:'Sil', confirmClear:'Bütün admin məlumatları silmək istəyirsiniz? Bu əməliyyat geri qaytarıla bilməz!', imported:'Uğurla idxal olundu! Səhifəni yeniləyin.', importError:'Fayl yanlışdır', cleared:'Hamısı silindi', danger:'TƏHLÜKƏLİ' },
  en: { title:'Backup & Restore', sub:'Manage all your data', export:'Export', exportDesc:'Download all admin data as JSON', import:'Import', importDesc:'Load data from JSON file', clear:'Delete all', clearDesc:'Delete all admin content (cannot be undone)', exportBtn:'Download JSON', importBtn:'Select JSON file', clearBtn:'Delete', confirmClear:'Delete all admin data? This cannot be undone!', imported:'Imported! Reload the page.', importError:'Invalid file', cleared:'All cleared', danger:'DANGER' },
  ru: { title:'Резервная копия', sub:'Управление данными', export:'Экспорт', exportDesc:'Скачать все данные в JSON', import:'Импорт', importDesc:'Загрузить данные из JSON', clear:'Удалить всё', clearDesc:'Удалить весь контент (необратимо)', exportBtn:'Скачать JSON', importBtn:'Выбрать JSON', clearBtn:'Удалить', confirmClear:'Удалить всё? Необратимо!', imported:'Импортировано! Перезагрузите.', importError:'Неверный файл', cleared:'Очищено', danger:'ОПАСНО' },
  ar: { title:'نسخ احتياطي', sub:'إدارة البيانات', export:'تصدير', exportDesc:'تحميل البيانات بصيغة JSON', import:'استيراد', importDesc:'تحميل من ملف JSON', clear:'حذف الكل', clearDesc:'حذف كل المحتوى (لا يمكن التراجع)', exportBtn:'تحميل JSON', importBtn:'اختر ملف JSON', clearBtn:'حذف', confirmClear:'حذف الكل؟ لا يمكن التراجع!', imported:'تم الاستيراد!', importError:'ملف غير صحيح', cleared:'تم المسح', danger:'خطر' },
  tr: { title:'Yedekleme', sub:'Verileri yönetin', export:'Dışa Aktar', exportDesc:'Tüm verileri JSON olarak indir', import:'İçe Aktar', importDesc:'JSON dosyasından yükle', clear:'Tümünü sil', clearDesc:'Tüm içeriği sil (geri alınamaz)', exportBtn:'JSON İndir', importBtn:'JSON dosyası seç', clearBtn:'Sil', confirmClear:'Hepsi silinsin mi? Geri alınamaz!', imported:'İçe aktarıldı! Yenileyin.', importError:'Geçersiz dosya', cleared:'Temizlendi', danger:'TEHLİKE' },
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
    a.download = `muslim-cc-backup-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e) => {
    setMsg('error:Firebase-də idxal Firebase Console-dan etmək tövsiyə olunur')
    setTimeout(() => setMsg(''), 4000)
    e.target.value = ''
  }

  const handleClear = () => {
    setMsg('error:Firebase-də silmə Firebase Console-dan edin')
    setTimeout(() => setMsg(''), 4000)
  }

  return (
    <div>
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-badge" style={{background:'linear-gradient(135deg,#0891b2,#0e7490)'}}>💾</div>
          <div className="admin-header-info"><h1>{l.title}</h1><p>{l.sub}</p></div>
        </div>
      </div>

      {msg && (
        <div style={{
          padding:'14px 18px',
          marginBottom:20,
          borderRadius:'var(--radius)',
          background: msg.startsWith('success') ? '#10b98115' : '#ef444415',
          border: `1.5px solid ${msg.startsWith('success') ? '#10b98140' : '#ef444440'}`,
          color: msg.startsWith('success') ? '#10b981' : '#ef4444',
          fontWeight:700,
        }}>
          {msg.startsWith('success') ? '✅' : '⚠️'} {msg.split(':')[1]}
        </div>
      )}

      {/* Export */}
      <div className="admin-section">
        <h2 className="admin-section-title">
          <span className="admin-section-title-icon" style={{background:'#10b98118'}}>📥</span>
          {l.export}
        </h2>
        <p style={{color:'var(--text-dim)', fontSize:14, marginBottom:16}}>{l.exportDesc}</p>
        <button onClick={handleExport} className="admin-submit-btn" style={{background:'linear-gradient(135deg,#10b981,#059669)'}}>
          <span>📥</span> {l.exportBtn}
        </button>
      </div>

      {/* Import */}
      <div className="admin-section">
        <h2 className="admin-section-title">
          <span className="admin-section-title-icon" style={{background:'#3b82f618'}}>📤</span>
          {l.import}
        </h2>
        <p style={{color:'var(--text-dim)', fontSize:14, marginBottom:16}}>{l.importDesc}</p>
        <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImport} style={{display:'none'}} />
        <button onClick={() => fileInputRef.current?.click()} className="admin-submit-btn" style={{background:'linear-gradient(135deg,#3b82f6,#2563eb)'}}>
          <span>📤</span> {l.importBtn}
        </button>
      </div>

      {/* Danger zone */}
      <div className="admin-section" style={{borderColor:'#ef444440', background:'#ef444408'}}>
        <h2 className="admin-section-title" style={{color:'#ef4444'}}>
          <span className="admin-section-title-icon" style={{background:'#ef444418'}}>⚠️</span>
          {l.danger}
        </h2>
        <p style={{color:'var(--text-dim)', fontSize:14, marginBottom:16}}>{l.clearDesc}</p>
        <button onClick={handleClear} className="admin-submit-btn" style={{background:'linear-gradient(135deg,#ef4444,#dc2626)'}}>
          <span>🗑️</span> {l.clearBtn}
        </button>
      </div>
    </div>
  )
}
