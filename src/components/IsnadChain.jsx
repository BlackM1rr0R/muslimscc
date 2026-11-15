// ═══════════════════════════════════════════════════════
// IsnadChain (v6.9) — hədisin ravilər zənciri (sənəd), "Tam mətn" pəncərəsində
//
// Adlar hadith-api ərəb mətnindən OLDUĞU KİMİ (src/utils/isnad.js →
// scripts/build-hadith-full.mjs → data.isnad). Kitab müəllifindən başlayır,
// ravidən raviyə qızılı xətlə Peyğəmbərə ﷺ qədər bir-bir yanır (yalnız
// transform/opacity; hərəkət azaldılıbsa — dərhal görünür).
// ═══════════════════════════════════════════════════════
import { pickUi } from '../utils/uiText'
import '../styles/IsnadChain.css'

const T = {
  az: { title: 'Ravilər zənciri (sənəd)', note: 'Adlar hədisin ərəbcə mətnindən olduğu kimi götürülüb; ən yuxarıda kitabın müəllifi, ən aşağıda Peyğəmbər ﷺ.', prophet: 'Peyğəmbər ﷺ' },
  en: { title: 'Chain of narrators (isnad)', note: 'Names are taken verbatim from the Arabic text of the hadith; the compiler is at the top, the Prophet ﷺ at the bottom.', prophet: 'The Prophet ﷺ' },
  ru: { title: 'Цепочка передатчиков (иснад)', note: 'Имена взяты без изменений из арабского текста хадиса; вверху — составитель сборника, внизу — Пророк ﷺ.', prophet: 'Пророк ﷺ' },
  ar: { title: 'سلسلة الإسناد', note: 'الأسماء منقولة كما هي من نص الحديث؛ في الأعلى صاحب الكتاب، وفي الأسفل النبي ﷺ.', prophet: 'النبي ﷺ' },
  tr: { title: 'Râviler zinciri (isnad)', note: 'İsimler hadisin Arapça metninden olduğu gibi alınmıştır; en üstte kitabın müellifi, en altta Peygamber ﷺ.', prophet: 'Peygamber ﷺ' },
}
// Kitab müəllifi — ərəbcə (zəncirin başı)
const AUTHOR = { bukhari: 'الإمام البخاري', muslim: 'الإمام مسلم', tirmidhi: 'الإمام الترمذي', abudawud: 'الإمام أبو داود', ibnmajah: 'الإمام ابن ماجه', nasai: 'الإمام النسائي' }

export default function IsnadChain({ book, chain, lang }) {
  const u = pickUi(T, lang, 'en')
  if (!chain?.length) return null
  const links = [AUTHOR[book] || '', ...chain].filter(Boolean)
  return (
    <section className="isn" aria-labelledby="isn-h" data-testid="isnad-chain">
      <h3 id="isn-h" className="hfull__h">{u.title}</h3>
      <ol className="isn__list">
        {links.map((n, i) => (
          <li key={i} className={`isn__node${i === 0 ? ' isn__node--book' : ''}`} style={{ '--i': i }}>
            <span className="isn__dot" aria-hidden="true" />
            <span className="isn__name ui-arabic" lang="ar" dir="rtl">{n}</span>
          </li>
        ))}
        <li className="isn__node isn__node--end" style={{ '--i': links.length }}>
          <span className="isn__dot" aria-hidden="true" />
          <span className="isn__name">{u.prophet}</span>
        </li>
      </ol>
      <p className="hfull__note isn__note">{u.note}</p>
    </section>
  )
}
