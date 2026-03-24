import { useLang } from '../contexts/LangContext'
import { T } from '../data/i18n'
import '../styles/AboutPage.css'

export function AboutPage({ setPage }) {
  const { lang } = useLang()
  const t = T[lang]?.about || T.az.about

  const values = [
    { icon:'📖', title:t.v1t, desc:t.v1d },
    { icon:'💚', title:t.v2t, desc:t.v2d },
    { icon:'🌐', title:t.v3t, desc:t.v3d },
    { icon:'🔓', title:t.v4t, desc:t.v4d },
  ]

  const team = [
    { initials:'EA', name:'Elchin Abdullayev', role: lang==='az'?'Qurucu & Geliştirici': lang==='ru'?'Основатель и разработчик': lang==='ar'?'المؤسس والمطور': lang==='tr'?'Kurucu & Geliştirici':'Founder & Developer' },
    { initials:'EA', name:'Elchin Abdullayev',  role: lang==='az'?'İslami Məzmun Redaktoru': lang==='ru'?'Редактор исламского контента': lang==='ar'?'محررة المحتوى الإسلامي': lang==='tr'?'İslami İçerik Editörü':'Islamic Content Editor' },
    { initials:'EA', name:'Elchin Abdullayev', role: lang==='az'?'Ərəb Dili Mütəxəssisi': lang==='ru'?'Специалист по арабскому языку': lang==='ar'?'متخصص اللغة العربية': lang==='tr'?'Arapça Uzmanı':'Arabic Language Specialist' },
  ]

  const stats = [
    { num:'10+', label: lang==='az'?'Səhifə': lang==='ru'?'Страниц': lang==='ar'?'صفحات': lang==='tr'?'Sayfa':'Pages' },
    { num:'5',   label: lang==='az'?'Dil': lang==='ru'?'Языков': lang==='ar'?'لغات': lang==='tr'?'Dil':'Languages' },
    { num:'50+', label: lang==='az'?'Hədis': lang==='ru'?'Хадисов': lang==='ar'?'أحاديث': lang==='tr'?'Hadis':'Hadiths' },
    { num:'99',  label: lang==='az'?'Allahın Adı': lang==='ru'?'Имён Аллаха': lang==='ar'?'اسم لله': lang==='tr'?"Allah'ın İsmi":'Names of Allah' },
  ]

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-arabic">عَنِ الْمَوْقِع</div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <div className="section">
        <div className="section-inner">
          {/* Mission */}
          <div className="about-mission">
            <div className="about-mission-icon">☽</div>
            <div>
              <h2>{t.missionTitle}</h2>
              <p>{t.missionText}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="about-stats">
            {stats.map((s,i) => (
              <div key={i} className="about-stat">
                <span className="about-stat-num">{s.num}</span>
                <span className="about-stat-label">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Values */}
          <div className="section-header" style={{marginBottom:28}}>
            <h2 className="section-title">{t.valuesTitle}</h2>
          </div>
          <div className="about-values">
            {values.map((v,i) => (
              <div key={i} className="about-value-card anim-fadeUp" style={{animationDelay:`${i*80}ms`}}>
                <div className="about-value-icon">{v.icon}</div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>

          {/* Team */}
          <div className="section-header" style={{marginTop:60,marginBottom:28}}>
            <h2 className="section-title">{t.teamTitle}</h2>
          </div>
          <div className="about-team">
            {team.map((m,i) => (
              <div key={i} className="about-team-card anim-fadeUp" style={{animationDelay:`${i*80}ms`}}>
                <div className="team-avatar">{m.initials}</div>
                <div className="team-name">{m.name}</div>
                <div className="team-role">{m.role}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="about-cta">
            <div className="about-cta-arabic">وَمَا تَوۡفِيقِيٓ إِلَّا بِٱللَّهِ</div>
            <p>{lang==='az'?'"Mənim müvəffəqiyyətim ancaq Allahın köməyi ilədir." — Hud 11:88': lang==='ru'?'«Мой успех — лишь в помощи Аллаха» — Худ 11:88': lang==='ar'?'"وَمَا تَوْفِيقِي إِلَّا بِاللَّه" — هود ١١:٨٨': lang==='tr'?'"Başarım ancak Allah\'ın yardımıyladır." — Hud 11:88': '"My success is only through Allah." — Hud 11:88'}</p>
            <button className="btn-primary" onClick={() => { setPage('quran'); window.scrollTo({top:0,behavior:'smooth'}) }}>
              📖 {lang==='az'?'Quran Oxu': lang==='ru'?'Читать Коран': lang==='ar'?'اقرأ القرآن': lang==='tr'?'Kur\'an Oku':'Read Quran'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
