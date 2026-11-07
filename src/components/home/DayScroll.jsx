// "Bir gün — beş namaz" sürüşmə hekayəsi (vau3.css §8).
// Hündür bölmə + yapışqan səhnə: aşağı sürüşdükcə günəş səma qövsü boyunca
// keçir, səma sübhdən gecəyə rəng dəyişir, beş namaz növbə ilə işıqlanır.
// Tamamilə CSS scroll-driven (view-timeline) — JS yoxdur. Dəstək yoxdursa
// və ya "hərəkəti azalt" seçilibsə: adi hündürlükdə statik bölmə (hamısı görünür).
import Icon from '../Icon'

const KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
const ICON = { fajr: 'sunrise', dhuhr: 'sun', asr: 'sunLow', maghrib: 'sunset', isha: 'moon' }

export default function DayScroll({ eyebrow, title, names, onOpen, href }) {
  return (
    <section className="vx-day" aria-labelledby="vx-day-ttl">
      <div className="vx-day__stage">
        <div className="vx-day__sky" aria-hidden="true">
          <i className="vx-day__layer vx-day__layer--dawn" />
          <i className="vx-day__layer vx-day__layer--noon" />
          <i className="vx-day__layer vx-day__layer--dusk" />
          <i className="vx-day__layer vx-day__layer--night" />
          <i className="vx-day__stars" />
          <span className="vx-day__orbit"><i className="vx-day__sun" /></span>
          <i className="vx-day__hills" />
        </div>
        <div className="ui-container vx-day__in">
          <span className="ui-eyebrow vx-day__ey">{eyebrow}</span>
          <h2 id="vx-day-ttl" className="ui-title vx-day__title">{title}</h2>
          <ol className="vx-day__list">
            {KEYS.map((k, i) => (
              <li key={k} className="vx-day__item" style={{ '--i': i }}>
                <a href={href} onClick={onOpen}>
                  <span className="ui-icon-tile ui-icon-tile--lg" aria-hidden="true"><Icon name={ICON[k]} /></span>
                  <span className="vx-day__name">{names(k)}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
