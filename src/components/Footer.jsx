import { useLang } from '../contexts/LangContext'
import { T } from '../data/i18n'
import '../styles/Footer.css'

const FOOTER_LABELS = {
  az: { quickLinks:'Əsas', tools:'Alətlər', learn:'Öyrən', contact:'Əlaqə', copy:'© 2025 muslims.cc — Bütün hüquqlar qorunur.', made:'Ümmət üçün 💚 ilə hazırlandı', desc:'Tövhid əsasında qurulan pulsuz İslami platforma.' },
  en: { quickLinks:'Main', tools:'Tools', learn:'Learn', contact:'Contact', copy:'© 2025 muslims.cc — All rights reserved.', made:'Made with 💚 for the Ummah', desc:'Free Islamic platform built on Tawheed.' },
  ru: { quickLinks:'Основное', tools:'Инструменты', learn:'Обучение', contact:'Контакт', copy:'© 2025 muslims.cc — Все права защищены.', made:'Сделано с 💚 для уммы', desc:'Бесплатная исламская платформа на основе Таухида.' },
  ar: { quickLinks:'الرئيسية', tools:'أدوات', learn:'تعلم', contact:'تواصل', copy:'© 2025 muslims.cc — جميع الحقوق محفوظة.', made:'صُنع بـ 💚 للأمة', desc:'منصة إسلامية مجانية قائمة على التوحيد.' },
  tr: { quickLinks:'Ana', tools:'Araçlar', learn:'Öğren', contact:'İletişim', copy:'© 2025 muslims.cc — Tüm hakları saklıdır.', made:'Ümmet için 💚 ile yapıldı', desc:'Tevhid temeli üzerine kurulu ücretsiz İslami platform.' },
}

function Footer({ setPage }) {
  const { lang } = useLang()
  const fl = FOOTER_LABELS[lang] || FOOTER_LABELS.az

  const goTo = (p) => { setPage(p); window.scrollTo({ top:0, behavior:'smooth' }) }

  return (
    <footer className="footer">
      <div className="ft-main">
        <div className="ft-inner">

          {/* Brand */}
          <div className="ft-brand">
            <div className="ft-logo" onClick={() => goTo('home')}>
              <div className="ft-logo-icon">☽</div>
              <span className="ft-logo-text">muslims<span>.cc</span></span>
            </div>
            <p className="ft-desc">{fl.desc}</p>
            <div className="ft-arabic">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
          </div>

          {/* Links columns */}
          <div className="ft-links">
            <div className="ft-col">
              <h4>{fl.quickLinks}</h4>
              <button onClick={() => goTo('quran')}>📖 Quran</button>
              <button onClick={() => goTo('hadith')}>📚 {lang==='ru'?'Хадисы':lang==='ar'?'الحديث':lang==='tr'?'Hadis':'Hədis'}</button>
              <button onClick={() => goTo('prayer')}>🕌 {lang==='ru'?'Намаз':lang==='ar'?'الصلاة':lang==='tr'?'Namaz':'Namaz'}</button>
              <button onClick={() => goTo('duas')}>🤲 {lang==='ru'?'Дуа':lang==='ar'?'الأدعية':lang==='tr'?'Dualar':'Dualar'}</button>
              <button onClick={() => goTo('names')}>⭐ {lang==='ru'?'99 Имён':lang==='ar'?'الأسماء':lang==='tr'?'99 İsim':'99 Ad'}</button>
            </div>
            <div className="ft-col">
              <h4>{fl.tools}</h4>
              <button onClick={() => goTo('dhikr')}>📿 {lang==='ru'?'Зикр':lang==='ar'?'الذكر':lang==='tr'?'Zikir':'Zikr'}</button>
              <button onClick={() => goTo('qibla')}>🧭 {lang==='ru'?'Кибла':lang==='ar'?'القبلة':lang==='tr'?'Kıble':'Qiblə'}</button>
              <button onClick={() => goTo('zakat')}>💰 {lang==='ru'?'Закят':lang==='ar'?'الزكاة':lang==='tr'?'Zekât':'Zəkat'}</button>
              <button onClick={() => goTo('calendar')}>🌙 {lang==='ru'?'Календарь':lang==='ar'?'التقويم':lang==='tr'?'Takvim':'Təqvim'}</button>
              <button onClick={() => goTo('hifz')}>📝 {lang==='ru'?'Хифз':lang==='ar'?'الحفظ':lang==='tr'?'Hıfz':'Hifz'}</button>
            </div>
            <div className="ft-col">
              <h4>{fl.learn}</h4>
              <button onClick={() => goTo('quiz')}>❓ {lang==='ru'?'Викторина':lang==='ar'?'اختبار':lang==='tr'?'Quiz':'Kviz'}</button>
              <button onClick={() => goTo('prayerguide')}>🤲 {lang==='ru'?'Учись':lang==='ar'?'تعلم':lang==='tr'?'Öğren':'Öyrən'}</button>
              <button onClick={() => goTo('glossary')}>📖 {lang==='ru'?'Словарь':lang==='ar'?'معجم':lang==='tr'?'Sözlük':'Lüğət'}</button>
              <button onClick={() => goTo('holyplaces')}>🕋 {lang==='ru'?'Места':lang==='ar'?'أماكن':lang==='tr'?'Yerler':'Yerlər'}</button>
              <button onClick={() => goTo('kids')}>👶 {lang==='ru'?'Дети':lang==='ar'?'أطفال':lang==='tr'?'Çocuk':'Uşaq'}</button>
            </div>
            <div className="ft-col">
              <h4>{fl.contact}</h4>
              <a href="mailto:abdllyevv@gmail.com">✉ abdllyevv@gmail.com</a>
              <button onClick={() => goTo('about')}>ℹ️ {lang==='ru'?'О нас':lang==='ar'?'عنا':lang==='tr'?'Hakkımızda':'Haqqında'}</button>
            </div>
          </div>

        </div>
      </div>

      <div className="ft-bottom">
        <p>{fl.copy}</p>
        <span className="ft-made">{fl.made}</span>
      </div>
    </footer>
  )
}

export default Footer
