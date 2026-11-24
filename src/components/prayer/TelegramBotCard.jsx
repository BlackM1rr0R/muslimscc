// ═══════════════════════════════════════════════════════
// TelegramBotCard — saytın Telegram botuna keçid (/prayer, server/telegramBot.js)
//
// Bot adı build zamanı .env.public → VITE_TELEGRAM_BOT (açıq məlumat, sirr deyil).
// Yoxdursa və ya formatı yararsızdırsa kart heç görünmür (docs/TELEGRAM-BOT.md).
// ═══════════════════════════════════════════════════════
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'

const BOT = String(import.meta.env.VITE_TELEGRAM_BOT || '').trim().replace(/^@/, '')
// Telegram bot adı: 5–32 simvol, hərf/rəqəm/_ , sonu "bot"
export const TELEGRAM_BOT = /^[A-Za-z][A-Za-z0-9_]{3,30}bot$/i.test(BOT) ? BOT : ''

const TXT = {
  // lang-ok[Telegram]: xidmətin adı
  az: { title: 'Telegram botu', lead: 'Namaz vaxtları, növbəti namaza qalan vaxt, günün ayəsi və hədisi — Telegram-da. İstəsəniz bot hər azan vaxtında xatırladır.', open: 'Telegram-da aç', note: 'Bot yalnız söhbət nömrənizi, dili, şəhəri və xatırlatma seçimini saxlayır. /stop əmri hamısını silir.' },
  en: { title: 'Telegram bot', lead: 'Prayer times, time left until the next prayer, the verse and hadith of the day — in Telegram. If you like, the bot reminds you at every adhan time.', open: 'Open in Telegram', note: 'The bot stores only your chat number, language, city and reminder choice. The /stop command deletes everything.' },
  // lang-ok[stop]: botun əmr adı (/stop)
  ru: { title: 'Telegram-бот', lead: 'Время намаза, сколько осталось до следующего намаза, аят и хадис дня — в Telegram. По желанию бот напомнит в каждое время азана.', open: 'Открыть в Telegram', note: 'Бот хранит только номер чата, язык, город и настройку напоминаний. Команда /stop удаляет всё.' },
  // lang-ok[stop]: botun əmr adı (/stop)
  ar: { title: 'بوت تيليجرام', lead: 'مواقيت الصلاة، والوقت المتبقي حتى الصلاة القادمة، وآية اليوم وحديث اليوم — في تيليجرام. وإن شئت يذكّرك البوت عند كل أذان.', open: 'افتح في تيليجرام', note: 'يحفظ البوت رقم المحادثة واللغة والمدينة وخيار التذكير فقط. الأمر /stop يحذف كل شيء.' },
  tr: { title: 'Telegram botu', lead: 'Namaz vakitleri, sonraki namaza kalan süre, günün ayeti ve hadisi — Telegram’da. Dilerseniz bot her ezan vaktinde hatırlatır.', open: 'Telegram’da aç', note: 'Bot yalnızca sohbet numaranızı, dili, şehri ve hatırlatma tercihini saklar. /stop komutu hepsini siler.' },
}

export default function TelegramBotCard({ lang }) {
  if (!TELEGRAM_BOT) return null
  const t = pickUi(TXT, lang)
  return (
    <div className="ui-card pp-cal pp-tg" data-reveal data-testid="telegram-bot-card">
      <div className="pp-cal__head">
        <span className="ui-icon-tile" aria-hidden="true"><Icon name="send" /></span>
        <div>
          <h3 className="pp-cal__title">{t.title}</h3>
          <p className="pp-cal__lead">{t.lead}</p>
        </div>
      </div>
      <div className="pp-cal__actions">
        <a className="ui-btn ui-btn--primary" href={`https://t.me/${TELEGRAM_BOT}`} target="_blank" rel="noopener noreferrer">
          <Icon name="external" className="ui-btn__icon" />{t.open}
        </a>
      </div>
      <p className="pp-cal__note"><Icon name="info" size={14} /> {t.note}</p>
    </div>
  )
}
