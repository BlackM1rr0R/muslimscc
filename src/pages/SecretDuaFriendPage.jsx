// ═══════════════════════════════════════════════════════
// /secret-dua-friend — "Gizli dua dostu" (server/duaFriend.js). noindex.
//
// • Könüllü: e-poçtu təsdiqli hesab + açıq razılıq. Server iki üzvü 30 günlük dövrə təsadüfi cütləyir.
// • Gündə bir dəfə "Bu gün gizli dostum üçün dua etdim" → dost "Bu gün kimsə sizin üçün dua etdi" görür.
// • Kimlik YOXDUR (ad, e-poçt, id), mesaj YOXDUR, sayğac/müqayisə/seriya YOXDUR. İstənilən vaxt çıxmaq olar.
// • Gələn qutusu açılanda oxunmuş sayılır (POST /seen). Bu cihazda "qoşulub" ipucu (mcc_dua_friend) —
//   ümumi bildiriş (components/p3/DuaFriendNotice) yalnız onda serverə soruşur.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { pathFor } from '../seo/routes'
import Icon from '../components/Icon'
import VerifyEmailNote from '../components/account/VerifyEmailNote'
import { useAuthUser, refreshMe } from '../api/userSession'
import { getDuaFriend, joinDuaFriend, prayDuaFriend, seenDuaFriend, leaveDuaFriend, setDuaFriendHint, AuthError } from '../api/p3'
import { Confirm, Msg, Loading, SignInCard, fmtDay, fmtDate } from '../components/p3/p3Ui'
import { localDay } from '../utils/journeyStore'
import '../styles/Account.css'
import '../styles/ReadTogether.css'
import '../styles/P3.css'

const ruDays = (n) => {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return `До конца этого круга остался ${n} день`
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return `До конца этого круга осталось ${n} дня`
  return `До конца этого круга осталось ${n} дней`
}
const arDays = (n) => {
  if (n === 1) return 'بقي يوم واحد على نهاية هذه الدورة'
  if (n === 2) return 'بقي يومان على نهاية هذه الدورة'
  if (n >= 3 && n <= 10) return `بقيت ${n} أيام على نهاية هذه الدورة`
  return `بقي ${n} يومًا على نهاية هذه الدورة`
}

export const DF = {
  az: {
    eyebrow: 'Birlikdə', title: 'Gizli dua dostu',
    lead: '30 günlük dövr üçün başqa bir müsəlmanla cütlənin. Hər biriniz digəri üçün dua edir — kim olduğunu heç vaxt bilmədən.',
    how: ['Cüt təsadüfi seçilir, mümkünsə eyni dildən olan biri ilə.', 'Gündə bir dəfə «Bu gün gizli dostum üçün dua etdim» düyməsinə toxuna bilərsiniz. Dostunuz o zaman görür: «Bu gün kimsə sizin üçün dua etdi».', 'Ad, mesaj və say yoxdur. İstədiyiniz vaxt çıxa bilərsiniz.'],
    consent: 'Razıyam: muslims.cc serverində qoşulduğum, dilim, saat qurşağım və düyməyə toxunduğum günlər saxlanılsın. Çıxanda silinir.',
    join: 'Qoşul', joined: 'Qoşuldunuz.', consentNeed: 'Əvvəlcə razılığı təsdiqləyin.',
    waiting: 'Sizə tezliklə gizli dost tapılacaq — adətən bir saat ərzində. Hələ boş kimsə yoxdursa, yeni biri qoşulan kimi cütlənəcəksiniz.',
    pray: 'Bu gün gizli dostum üçün dua etdim', prayed: 'Bu gün üçün qeyd olundu. Dostunuz kimsə onun üçün dua etdiyini görəcək.',
    forMeToday: 'Bu gün kimsə sizin üçün dua etdi', forMeOn: (d) => `${d}: kimsə sizin üçün dua etdi`,
    roundEnds: (d) => `Bu dövr ${d} tarixində bitir`, daysLeft: (n) => `Bu dövrün bitməsinə ${n} gün qalıb`,
    newRound: 'Dövr bitəndə sizə yeni gizli dost tapılacaq.',
    leave: 'Çıx', leaveAsk: 'Çıxırsınız? Cari cütlük bitir və serverdəki məlumatınız silinir.', yes: 'Bəli, çıx', cancel: 'Ləğv et', left: 'Çıxdınız. Məlumatınız silindi.',
    signIn: 'Gizli dua dostuna qoşulmaq üçün daxil olun.', signInBtn: 'Daxil ol',
    loading: 'Yüklənir…', failed: 'Alınmadı. Bir az sonra yenidən cəhd edin.', notPaired: 'Hələ gizli dost tapılmayıb.',
    privacy: 'Dostunuz sizin adınızı, e-poçtunuzu və ya başqa heç nəyinizi görmür. Siz də onunkunu görmürsünüz.',
    back: 'Hesaba qayıt',
  },
  en: {
    eyebrow: 'Together', title: 'Secret dua friend',
    lead: 'Be paired with another Muslim for a 30-day round. Each of you makes dua for the other, without ever knowing who they are.',
    how: ['Pairs are chosen at random, preferably with someone who uses the same language.', 'Once a day you can tap "I made dua for my secret friend today". Your friend then sees: "Someone made dua for you today".', 'No names, no messages, no counts. You can leave at any time.'],
    consent: 'I agree that muslims.cc stores on its server that I joined, my language, my time zone and the days I tap the button. It is deleted when I leave.',
    join: 'Join', joined: 'You have joined.', consentNeed: 'Please confirm your consent first.',
    waiting: 'A secret friend will be found for you soon, usually within an hour. If no one is free yet, you will be paired as soon as someone joins.',
    pray: 'I made dua for my secret friend today', prayed: 'Marked for today. Your friend will see that someone made dua for them.',
    forMeToday: 'Someone made dua for you today', forMeOn: (d) => `Someone made dua for you on ${d}`,
    roundEnds: (d) => `This round ends on ${d}`, daysLeft: (n) => (n === 1 ? '1 day left in this round' : `${n} days left in this round`),
    newRound: 'When the round ends, you will be paired with a new secret friend.',
    leave: 'Leave', leaveAsk: 'Leave? Your current pairing ends and your data on the server is deleted.', yes: 'Yes, leave', cancel: 'Cancel', left: 'You have left. Your data was deleted.',
    signIn: 'Sign in to join secret dua friend.', signInBtn: 'Sign in',
    loading: 'Loading…', failed: 'Something went wrong. Please try again later.', notPaired: 'No secret friend has been found yet.',
    privacy: 'Your friend does not see your name, email or anything else about you. You do not see theirs either.',
    back: 'Back to account',
  },
  ru: {
    eyebrow: 'Вместе', title: 'Тайный друг по дуа',
    lead: 'Вас объединят в пару с другим мусульманином на 30 дней. Каждый делает дуа за другого — никогда не узнавая, кто он.',
    how: ['Пара выбирается случайно, по возможности с тем, кто пользуется тем же языком.', 'Раз в день можно нажать «Сегодня я сделал дуа за тайного друга». Тогда друг увидит: «Сегодня кто-то сделал дуа за вас».', 'Без имён, без сообщений, без подсчётов. Выйти можно в любой момент.'],
    consent: 'Я согласен, что muslims.cc хранит на сервере факт моего участия, мой язык, часовой пояс и дни, когда я нажимаю кнопку. Всё удаляется при выходе.',
    join: 'Присоединиться', joined: 'Вы присоединились.', consentNeed: 'Сначала подтвердите согласие.',
    waiting: 'Тайный друг скоро найдётся — обычно в течение часа. Если пока никого нет, пара составится, как только кто-то присоединится.',
    pray: 'Сегодня я сделал дуа за тайного друга', prayed: 'Отмечено на сегодня. Друг увидит, что кто-то сделал за него дуа.',
    forMeToday: 'Сегодня кто-то сделал дуа за вас', forMeOn: (d) => `${d}: кто-то сделал дуа за вас`,
    roundEnds: (d) => `Этот круг заканчивается ${d}`, daysLeft: ruDays,
    newRound: 'Когда круг закончится, вам подберут нового тайного друга.',
    leave: 'Выйти', leaveAsk: 'Выйти? Текущая пара завершится, а ваши данные на сервере будут удалены.', yes: 'Да, выйти', cancel: 'Отмена', left: 'Вы вышли. Ваши данные удалены.',
    signIn: 'Войдите, чтобы присоединиться к «Тайному другу по дуа».', signInBtn: 'Войти',
    loading: 'Загрузка…', failed: 'Не получилось. Попробуйте позже.', notPaired: 'Тайный друг ещё не найден.',
    privacy: 'Друг не видит ваше имя, почту и ничего другого о вас. Вы тоже не видите его данных.',
    back: 'Назад в аккаунт',
  },
  tr: {
    eyebrow: 'Birlikte', title: 'Gizli dua arkadaşı',
    lead: '30 günlük bir dönem için başka bir Müslümanla eşleşin. Her biriniz diğeri için dua eder — kim olduğunu hiç bilmeden.',
    how: ['Eşleşme rastgele yapılır, mümkünse aynı dili kullanan biriyle.', 'Günde bir kez «Bugün gizli arkadaşım için dua ettim» düğmesine dokunabilirsiniz. Arkadaşınız o zaman şunu görür: «Bugün biri sizin için dua etti».', 'İsim, mesaj ve sayı yok. İstediğiniz zaman ayrılabilirsiniz.'],
    consent: 'muslims.cc sunucusunda katıldığımın, dilimin, saat dilimimin ve düğmeye dokunduğum günlerin saklanmasını kabul ediyorum. Ayrıldığımda silinir.',
    join: 'Katıl', joined: 'Katıldınız.', consentNeed: 'Önce onayınızı verin.',
    waiting: 'Size yakında gizli bir arkadaş bulunacak — genellikle bir saat içinde. Henüz boşta kimse yoksa, biri katılır katılmaz eşleşeceksiniz.',
    pray: 'Bugün gizli arkadaşım için dua ettim', prayed: 'Bugün için işaretlendi. Arkadaşınız biri onun için dua ettiğini görecek.',
    forMeToday: 'Bugün biri sizin için dua etti', forMeOn: (d) => `${d}: biri sizin için dua etti`,
    roundEnds: (d) => `Bu dönem ${d} tarihinde bitiyor`, daysLeft: (n) => `Bu dönemin bitmesine ${n} gün kaldı`,
    newRound: 'Dönem bittiğinde size yeni bir gizli arkadaş bulunacak.',
    leave: 'Ayrıl', leaveAsk: 'Ayrılıyor musunuz? Mevcut eşleşme biter ve sunucudaki verileriniz silinir.', yes: 'Evet, ayrıl', cancel: 'Vazgeç', left: 'Ayrıldınız. Verileriniz silindi.',
    signIn: 'Gizli dua arkadaşına katılmak için giriş yapın.', signInBtn: 'Giriş yap',
    loading: 'Yükleniyor…', failed: 'Olmadı. Biraz sonra tekrar deneyin.', notPaired: 'Henüz gizli arkadaş bulunmadı.',
    privacy: 'Arkadaşınız adınızı, e-postanızı veya sizinle ilgili başka hiçbir şeyi görmez. Siz de onunkini görmezsiniz.',
    back: 'Hesaba dön',
  },
  ar: {
    eyebrow: 'معًا', title: 'صديق الدعاء الخفي',
    lead: 'تُقرَن بمسلم آخر لدورة مدتها 30 يومًا. يدعو كل منكما للآخر دون أن يعرف من هو أبدًا.',
    how: ['يُختار الشريك عشوائيًا، ويُفضَّل من يستخدم اللغة نفسها.', 'يمكنك مرة في اليوم الضغط على «دعوت لصديقي الخفي اليوم». فيرى صديقك: «دعا لك أحدهم اليوم».', 'لا أسماء ولا رسائل ولا أعداد. يمكنك المغادرة في أي وقت.'],
    consent: 'أوافق على أن يحفظ muslims.cc على خادمه أنني انضممت، ولغتي، ومنطقتي الزمنية، والأيام التي أضغط فيها الزر. يُحذف ذلك عند المغادرة.',
    join: 'انضمام', joined: 'لقد انضممت.', consentNeed: 'يرجى تأكيد الموافقة أولًا.',
    waiting: 'سيُعثر لك قريبًا على صديق خفي، عادةً خلال ساعة. إن لم يكن أحد متاحًا بعد، فستُقرَن فور انضمام شخص جديد.',
    pray: 'دعوت لصديقي الخفي اليوم', prayed: 'سُجِّل لهذا اليوم. سيرى صديقك أن أحدهم دعا له.',
    forMeToday: 'دعا لك أحدهم اليوم', forMeOn: (d) => `${d}: دعا لك أحدهم`,
    roundEnds: (d) => `تنتهي هذه الدورة في ${d}`, daysLeft: arDays,
    newRound: 'عند انتهاء الدورة سيُعثر لك على صديق خفي جديد.',
    leave: 'مغادرة', leaveAsk: 'هل تغادر؟ ينتهي الاقتران الحالي وتُحذف بياناتك من الخادم.', yes: 'نعم، غادر', cancel: 'إلغاء', left: 'لقد غادرت. حُذفت بياناتك.',
    signIn: 'سجّل الدخول للانضمام إلى صديق الدعاء الخفي.', signInBtn: 'تسجيل الدخول',
    loading: 'جارٍ التحميل…', failed: 'لم ينجح ذلك. حاول مرة أخرى لاحقًا.', notPaired: 'لم يُعثر على صديق خفي بعد.',
    privacy: 'لا يرى صديقك اسمك ولا بريدك ولا أي شيء آخر عنك، ولا ترى أنت بياناته.',
    back: 'العودة إلى الحساب',
  },
}

const userTz = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { return 'UTC' } }

export default function SecretDuaFriendPage() {
  const { lang, siteLang = lang } = useLang()
  const t = pickUi(DF, lang, 'en')
  const { status } = useAuthUser()
  const [s, setS] = useState(null)       // null — yüklənir, false — alınmadı
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [inbox, setInbox] = useState([])
  useEffect(() => { if (status === 'unknown') refreshMe().catch(() => {}) }, [status])

  const load = useCallback(async () => {
    try {
      const r = await getDuaFriend()
      setS(r)
      setDuaFriendHint(r.joined)
      if (r.inbox?.length) { setInbox(r.inbox); seenDuaFriend().catch(() => {}) }
    } catch { setS(false) }
  }, [])
  useEffect(() => { if (status === 'user') load() }, [status, load])

  const errText = (e) => (e instanceof AuthError && e.code === 'not_paired' ? t.notPaired : t.failed)
  const run = async (fn, ok) => {
    setBusy(true); setMsg(null)
    try { await fn(); if (ok) setMsg({ tone: 'ok', text: ok }); await load() } catch (e) {
      if (e instanceof AuthError && e.code === 'verify_email') setS((x) => (x ? { ...x, verified: false } : x))
      else setMsg({ tone: 'bad', text: errText(e) })
    } finally { setBusy(false) }
  }
  const onJoin = () => {
    if (!consent) { setMsg({ tone: 'bad', text: t.consentNeed }); return }
    run(() => joinDuaFriend({ lang: siteLang, tz: userTz() }), t.joined)
  }
  const onLeave = () => run(async () => { await leaveDuaFriend(); setDuaFriendHint(false); setInbox([]) }, t.left)

  let body
  if (status === 'anon') body = <SignInCard text={t.signIn} btn={t.signInBtn} pageKey="duafriend" siteLang={siteLang} testId="df-signin" />
  else if (status !== 'user' || s === null) body = <Loading label={t.loading} />
  else if (s === false) body = <p className="rt-msg" role="alert">{t.failed}</p>
  else {
    const days = s.pair ? Math.max(1, Math.ceil((s.pair.endsAt - Date.now()) / 86400000)) : 0
    const older = inbox.filter((x) => x.day !== localDay())
    const forToday = Boolean(s.pair?.forMeToday)
    const head = forToday ? t.forMeToday : older[0] ? t.forMeOn(fmtDay(older[0].day, lang)) : ''
    body = (
      <>
        {head && (
          <section className="ui-card acc-section p3-inbox" aria-labelledby="df-inbox-h" data-testid="df-inbox">
            <h2 className="acc-section__title" id="df-inbox-h"><Icon name="sparkle" size={18} /> {head}</h2>
            {(forToday ? older : older.slice(1)).map((x) => <p key={x.day} className="rt-note">{t.forMeOn(fmtDay(x.day, lang))}</p>)}
          </section>
        )}
        <section className="ui-card acc-section" aria-labelledby="df-main-h" data-testid="df-main">
          <h2 className="acc-section__title" id="df-main-h">{t.title}</h2>
          {!s.joined && (
            <>
              <ul className="p3-list">{t.how.map((x) => <li key={x}>{x}</li>)}</ul>
              <p className="rt-note">{t.privacy}</p>
              {!s.verified ? <VerifyEmailNote lang={lang} testId="df-verify" /> : (
                <>
                  <label className="acc-check" htmlFor="df-consent">
                    <input id="df-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} data-testid="df-consent" />
                    <span>{t.consent}</span>
                  </label>
                  <div><button type="button" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy} onClick={onJoin} data-testid="df-join"><Icon name="plus" className="ui-btn__icon" /> {t.join}</button></div>
                </>
              )}
            </>
          )}
          {s.joined && !s.pair && <p className="rt-note" data-testid="df-waiting">{t.waiting}</p>}
          {s.joined && s.pair && (
            <>
              <p className="rt-note">{t.roundEnds(fmtDate(s.pair.endsAt, lang))} · {t.daysLeft(days)}</p>
              {s.pair.prayedToday ? (
                <p className="p3-done" data-testid="df-prayed"><Icon name="check" size={18} /> {t.prayed}</p>
              ) : (
                <div>
                  <button type="button" className="ui-btn ui-btn--primary p3-big" disabled={busy || !s.verified} onClick={() => run(prayDuaFriend)} data-testid="df-pray">
                    <Icon name="duas" className="ui-btn__icon" /> {t.pray}
                  </button>
                </div>
              )}
              <p className="rt-note">{t.newRound}</p>
              <p className="rt-note">{t.privacy}</p>
            </>
          )}
          {s.joined && !s.verified && <VerifyEmailNote lang={lang} testId="df-verify" />}
          <Msg msg={msg} />
          {s.joined && <div><Confirm label={t.leave} ask={t.leaveAsk} yes={t.yes} cancel={t.cancel} onYes={onLeave} disabled={busy} testId="df-leave" icon="logout" /></div>}
        </section>
      </>
    )
  }

  return (
    <div className="acc-account p3-page">
      <section className="ui-page-hero">
        <div className="ui-container ui-container--narrow">
          <p className="ui-eyebrow">{t.eyebrow}</p>
          <h1 className="ui-title">{t.title}</h1>
          <p className="ui-lead">{t.lead}</p>
        </div>
      </section>
      <div className="ui-container ui-container--narrow acc-sections">
        {body}
        <p><a className="ui-btn ui-btn--ghost ui-btn--sm" href={pathFor('account', siteLang)}><Icon name="arrow" className="ui-btn__icon ui-flip-rtl" /> {t.back}</a></p>
      </div>
    </div>
  )
}
