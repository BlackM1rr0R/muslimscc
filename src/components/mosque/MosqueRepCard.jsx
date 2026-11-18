// K4: məscid axtarışında təsdiqlənmiş nümayəndəsi olan məscidin kartı (server/mosqueRep.js → /api/mosques/verified)
// Cümə xütbəsi, aktiv elanlar və məscid ekranına keçid. MosqueFinderPage bu faylı yalnız belə məscid olanda yükləyir.
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { pathFor } from '../../seo/routes'
import '../../styles/Community.css'

const T = {
  az: { badge: 'Təsdiqlənmiş nümayəndə', jumuah: 'Cümə xütbəsi', ann: 'Elanlar', tv: 'Məscid ekranını aç' },
  en: { badge: 'Verified representative', jumuah: 'Friday khutbah', ann: 'Announcements', tv: 'Open the mosque display' },
  ru: { badge: 'Подтверждённый представитель', jumuah: 'Пятничная хутба', ann: 'Объявления', tv: 'Открыть экран мечети' },
  ar: { badge: 'ممثّل موثّق', jumuah: 'خطبة الجمعة', ann: 'الإعلانات', tv: 'افتح شاشة المسجد' },
  tr: { badge: 'Onaylı temsilci', jumuah: 'Cuma hutbesi', ann: 'Duyurular', tv: 'Cami ekranını aç' },
}

export default function MosqueRepCard({ id, info, lang, siteLang }) {
  const t = pickUi(T, lang, 'en')
  const j = info.jumuah || {}
  return (
    <div className="mrep-card" data-testid="mosque-verified">
      <p><span className="ui-badge ui-badge--brand"><Icon name="shield" size={14} /> {t.badge}</span></p>
      {(j.time || j.topic) && <p><strong>{t.jumuah}:</strong> <span className="ui-num">{j.time}</span>{j.topic ? <> · <bdi>{j.topic}</bdi></> : null}</p>}
      {info.announcements && info.announcements.length > 0 && (
        <div>
          <strong>{t.ann}:</strong>
          <ul className="rt-list" style={{ marginTop: 4 }}>
            {info.announcements.slice(0, 3).map((a) => <li key={a.id} className="cm-pre" dir="auto">{a.body}</li>)}
          </ul>
        </div>
      )}
      <p><a className="ui-link" href={`${pathFor('mosquetv', siteLang)}?m=${encodeURIComponent(id)}`}><Icon name="mosquetv" size={14} /> {t.tv}</a></p>
    </div>
  )
}
