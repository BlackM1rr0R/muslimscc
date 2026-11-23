// ═══════════════════════════════════════════════════════
// /traveller-kit — Müsəlman səyyahın dəsti: təyinatı seç → bir səhifədə hər şey
//
// • Təyinat: components/travel/DestinationField (saytın şəhər siyahısı + Open-Meteo geocoding). Saytın namaz
//   şəhəri DƏYİŞMİR — yalnız "namaz şəhərim et" düyməsi ilə (utils/prayerLocation → setPrayerCity).
// • Orada qiblə (utils/travelKit → qiblaFor: saytın qiblə həndəsəsi), seçilən günün namaz vaxtları (utils/prayCalc —
//   saytın öz hesabı; AZ — Əbu Bəkr məscidi, qalanları — Diyanət; əsr — məzhəb seçimi), evdəki saatla fərq.
// • Məscid axtarışı və halal yerlər cihazın yeri və ya seçilmiş namaz şəhəri ətrafında axtarır — təyinat ətrafında
//   DEYİL; bunu dürüst yazırıq və "namaz şəhərim et" təklif edirik (çatanda "yerimə görə" də işləyir).
// • Səfər namazı (qəsr/cəm): ÖZ HÖKMÜMÜZ YOXDUR — "alimlər fərqli rəydədir" + saytın dərsinə keçid.
// • Tarixi qeyd: yalnız mənbəli sayt məlumatı yaxındadırsa (≤ 60 km) — İbn Bəttutənin dayanacaqları (Rihla; Dunn)
//   və Quranda adı keçən yerlər (ayə istinadı ilə). Data modulları tənbəl yüklənir. Yoxdursa — bölmə görünmür.
// • "Səfərlərim": utils/travelTrips (traveller_trips_v1, profilə aid, E2E sinxronizasiya). Yalnız mount-dan sonra oxunur;
//   ev şəhəri, məzhəb və tarix də — prerender ilə ilk render eyni olsun.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import HeroOrnament from '../components/HeroOrnament'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import { isPlainClick } from '../components/PageLink'
import DestinationField from '../components/travel/DestinationField'
import { navGroupLabel, navGroupOf } from '../data/navigation'
import { pathFor } from '../seo/routes'
import { pickUi } from '../utils/uiText'
import { PRAYER_NAMES } from '../hooks/usePrayerTimes'
import { getPrayerLocation, setPrayerCity } from '../utils/prayerLocation'
import { currentAsrFactor, subscribeMadhab } from '../utils/madhab'
import { EVENT as PROFILE_EVENT } from '../utils/profileCore'
import { destTimes, qiblaFor, tzDiffMin, zonedYMD, ymdKey, parseYmd, historyNear } from '../utils/travelKit'
import { readTrips, saveTrip, removeTrip, tripPlace, TRIPS_EVENT, TRIPS_MAX } from '../utils/travelTrips'
import '../styles/TravellerKit.css'

const UNITS = { az: { h: 'saat', m: 'dəq' }, en: { h: 'h', m: 'min' }, ru: { h: 'ч', m: 'мин' }, tr: { h: 'sa', m: 'dk' }, ar: { h: 'س', m: 'د' } }
const dur = (min, u) => {
  const h = Math.floor(min / 60), r = min % 60
  return h && r ? `${h} ${u.h} ${r} ${u.m}` : h ? `${h} ${u.h}` : `${r} ${u.m}`
}

const T = {
  az: {
    title: 'Müsəlman səyyahın dəsti',
    lead: 'Hara getdiyinizi seçin — bir səhifədə: oradakı qiblə, namaz vaxtları, saat fərqi və səfər üçün faydalı keçidlər.',
    dest: 'Təyinat', destHint: 'Şəhərin adı…', world: 'Dünyada axtar', searching: 'Axtarılır…',
    worldErr: 'Axtarış alınmadı. İnterneti yoxlayın.', worldNone: 'Heç nə tapılmadı',
    notListed: 'Siyahıda yoxdur — «Dünyada axtar» düyməsini basın.',
    found: (n) => (n === 1 ? '1 yer tapıldı' : `${n} yer tapıldı`),
    pickFirst: 'Qibləni və namaz vaxtlarını görmək üçün təyinat seçin.',
    showing: (c) => `${c} göstərilir`,
    trips: 'Səfərlərim', tripsEmpty: 'Hələ saxlanılan səfər yoxdur. Təyinatı saxlayın — burada tez taparsınız.',
    save: 'Səfərlərimə saxla', saved: 'Səfərlərimə saxlanıldı.', full: `Ən çox ${TRIPS_MAX} səfər saxlamaq olar. Əvvəlcə birini silin.`,
    remove: (n) => `${n} — sil`, removed: (n) => `${n} silindi.`,
    tripsNote: 'Səfərlər bu cihazda saxlanılır (hesaba girmisinizsə — şifrəli sinxronizasiyada da).',
    timeH: 'Oradakı saat', nowThere: (hm) => `İndi orada: ${hm}`, home: (c) => `Eviniz (namaz şəhəriniz): ${c}`,
    ahead: (d, c) => `${c} ilə müqayisədə ${d} irəli`, behind: (d, c) => `${c} ilə müqayisədə ${d} geri`, same: (c) => `${c} ilə eyni saat`,
    prayH: 'Oradakı namaz vaxtları', date: 'Tarix',
    abubakr: 'Hesab: Bakıdakı Əbu Bəkr məscidinin cədvəli (saytdakı Azərbaycan şəhərləri kimi).',
    diyanet: 'Hesab: Diyanət (Türkiyə) üsulu — saytdakı dünya şəhərləri kimi.',
    asrH: 'Əsr: Hənəfi (məzhəb seçiminizə görə).', asrS: 'Əsr: Şafii, Maliki və Hənbəli hesabı (standart).',
    prayNote: 'Vaxtlar cihazınızda hesablanır. Yerli məscidlər başqa üsul işlədə bilər — çatanda onlardan soruşun.',
    qiblaH: 'Oradakı qiblə', qiblaDeg: (d, p) => `Həqiqi şimaldan ${d}° (${p})`, qiblaKm: (km) => `Kəbəyə qədər ${km} km`,
    qiblaNote: 'Həqiqi şimal, maqnit şimalı deyil. Çatanda «Qiblə» səhifəsi telefonun kompasını işlədə bilər.',
    atKaaba: 'Kəbə bu şəhərdədir.',
    qiblaLink: 'Qiblə kompasını aç', dial: (d) => `Qiblə istiqaməti: həqiqi şimaldan ${d}°`,
    points: ['şimal', 'şimal-şərq', 'şərq', 'cənub-şərq', 'cənub', 'cənub-qərb', 'qərb', 'şimal-qərb'],
    nearH: 'Məscidlər və halal yemək',
    nearLead: 'Məscid axtarışı və halal yerlər cihazınızın yeri və ya seçilmiş namaz şəhəriniz ətrafında axtarır — burada seçdiyiniz şəhərin ətrafında yox. Çatanda «Yerimə görə axtar» düyməsini basın, ya da bu şəhəri namaz şəhəriniz edin.',
    useCity: (c) => `${c} — namaz şəhərim olsun`, useCityNote: 'Bu, bütün saytda namaz vaxtlarının şəhərini dəyişir. İstədiyiniz vaxt geri qaytara bilərsiniz.',
    cityDone: (c) => `${c} indi namaz şəhərinizdir.`,
    mosques: 'Məscid axtar', halal: 'Halal yerlər', osm: 'Ərazini OpenStreetMap-də aç', // lang-ok[OpenStreetMap]: xidmətin adı
    lessonH: 'Səfərdə namaz',
    lessonTxt: 'Kimin müsafir sayıldığı (məsafə və qalma müddəti), namazı qısaltmaq (qəsr) və birləşdirmək (cəm) barədə alimlər fərqli rəydədir. Bu səhifə öz hökmünü vermir — dəlilləri ilə dərsi oxuyun və ya etibar etdiyiniz alimdən soruşun.',
    lessonLink: 'Dərs: səfər namazı',
    planH: 'Yolu planlayın', road: 'Avtomobil səfərində namaz vaxtları', flight: 'Təyyarədə namaz vaxtları',
    planNote: 'Hər ikisi «Namaz vaxtları» səhifəsinin aşağısındadır.', onroad: '«Yolda» rejimi',
    histH: 'Bu yerin yaxınlığında tarix',
    battuta: (y, approx, n) => `${approx ? 'Təqribən ' : ''}${y}: İbn Bəttutə — ${n}`,
    battutaSrc: 'Mənbə: İbn Bəttutə, «Tuhfat ən-Nuzzar» (Rihla); tarixlər — R. E. Dunn, The Adventures of Ibn Battuta.', // lang-ok[Dunn,The,Adventures,of,Ibn,Battuta]: kitabın və müəllifin adı
    quranPlace: (n) => `${n} — adı Quranda keçir`, approx: 'Dəqiq yeri məlum deyil, nöqtə təqribidir.', ayah: 'Ayə',
    histLink: 'İslam tarixi bölməsində ətraflı',
    privacy: 'Təyinat Open-Meteo-nun pulsuz yer axtarışı ilə tapılır (şəhər seçicisi kimi). Serverimizdə heç nə saxlanmır.', // lang-ok[Open,Meteo,Open-Meteo-nun]: xidmətin adı
  },
  en: {
    title: 'Muslim traveller kit',
    lead: 'Pick where you’re going and get one page with the qibla there, its prayer times, the time difference and useful links for the journey.',
    dest: 'Destination', destHint: 'City name…', world: 'Search the world', searching: 'Searching…',
    worldErr: 'Search failed. Check your connection.', worldNone: 'Nothing found',
    notListed: 'Not in the list — press “Search the world”.',
    found: (n) => (n === 1 ? '1 place found' : `${n} places found`),
    pickFirst: 'Choose a destination to see its qibla and prayer times.',
    showing: (c) => `Showing ${c}`,
    trips: 'My trips', tripsEmpty: 'No saved trips yet. Save a destination to find it here quickly.',
    save: 'Save to My trips', saved: 'Saved to My trips.', full: `You can keep up to ${TRIPS_MAX} trips. Remove one first.`,
    remove: (n) => `Remove ${n}`, removed: (n) => `${n} removed.`,
    tripsNote: 'Trips are kept on this device (and in your encrypted sync if you’re signed in).',
    timeH: 'Time there', nowThere: (hm) => `Now there: ${hm}`, home: (c) => `Home (your prayer city): ${c}`,
    ahead: (d, c) => `${d} ahead of ${c}`, behind: (d, c) => `${d} behind ${c}`, same: (c) => `Same time as ${c}`,
    prayH: 'Prayer times there', date: 'Date',
    abubakr: 'Calculation: the timetable of the Abu Bakr mosque in Baku (as for Azerbaijan cities on this site).',
    diyanet: 'Calculation: the Diyanet (Turkey) method — as for world cities on this site.',
    asrH: 'Asr: Hanafi (from your madhab setting).', asrS: 'Asr: Shafi‘i, Maliki and Hanbali reckoning (standard).',
    prayNote: 'Times are calculated on your device. Local mosques may use another method — ask them when you arrive.',
    qiblaH: 'Qibla there', qiblaDeg: (d, p) => `${d}° from true north (${p})`, qiblaKm: (km) => `${km} km to the Kaaba`,
    qiblaNote: 'True north, not magnetic north. When you arrive, the Qibla page can use your phone’s compass.',
    atKaaba: 'The Kaaba is in this city.',
    qiblaLink: 'Open the qibla compass', dial: (d) => `Qibla direction: ${d}° from true north`,
    points: ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'],
    nearH: 'Mosques and halal food',
    nearLead: 'The mosque finder and the halal places search look around your device’s location or your chosen prayer city — not around the city you picked here. When you arrive, use “Search near me”, or make this city your prayer city.',
    useCity: (c) => `Make ${c} my prayer city`, useCityNote: 'This changes the city for prayer times across the site. You can switch back any time.',
    cityDone: (c) => `${c} is now your prayer city.`,
    mosques: 'Find mosques', halal: 'Halal places', osm: 'Open the area on OpenStreetMap',
    lessonH: 'Praying while travelling',
    lessonTxt: 'Scholars differ on who counts as a traveller (distance and length of stay) and on shortening (qasr) and combining (jam‘) prayers. This page gives no ruling of its own — read the lesson with its evidence, or ask a scholar you trust.',
    lessonLink: 'Lesson: the traveller’s prayer',
    planH: 'Plan the way', road: 'Prayer times on a road trip', flight: 'Prayer times on a flight',
    planNote: 'Both are at the bottom of the Prayer times page.', onroad: 'On the road mode',
    histH: 'History near this place',
    battuta: (y, approx, n) => `${approx ? 'About ' : ''}${y}: Ibn Battuta — ${n}`,
    battutaSrc: 'Source: Ibn Battuta, Tuḥfat al-Nuẓẓār (the Riḥla); dates after R. E. Dunn, The Adventures of Ibn Battuta.',
    quranPlace: (n) => `${n} is named in the Quran`, approx: 'The exact location is not known; the point is approximate.', ayah: 'Ayah',
    histLink: 'More in Islamic history',
    privacy: 'The destination is found with Open-Meteo’s free place search (like the city picker). Nothing is stored on our server.',
  },
  ru: {
    title: 'Набор мусульманина-путешественника',
    lead: 'Выберите, куда едете, — и на одной странице: кибла там, время намаза, разница во времени и полезные ссылки для поездки.',
    dest: 'Куда', destHint: 'Название города…', world: 'Искать по миру', searching: 'Поиск…',
    worldErr: 'Поиск не удался. Проверьте подключение.', worldNone: 'Ничего не найдено',
    notListed: 'В списке нет — нажмите «Искать по миру».',
    found: (n) => `Найдено мест: ${n}`,
    pickFirst: 'Выберите место назначения, чтобы увидеть киблу и время намаза.',
    showing: (c) => `Показано: ${c}`,
    trips: 'Мои поездки', tripsEmpty: 'Сохранённых поездок пока нет. Сохраните место — и быстро найдёте его здесь.',
    save: 'Сохранить в «Мои поездки»', saved: 'Сохранено в «Мои поездки».', full: `Можно хранить не больше ${TRIPS_MAX} поездок. Сначала удалите одну.`,
    remove: (n) => `Удалить: ${n}`, removed: (n) => `Удалено: ${n}.`,
    tripsNote: 'Поездки хранятся на этом устройстве (и в зашифрованной синхронизации, если вы вошли).',
    timeH: 'Время там', nowThere: (hm) => `Сейчас там: ${hm}`, home: (c) => `Дом (ваш город намаза): ${c}`,
    ahead: (d, c) => `Разница с городом ${c}: +${d}`, behind: (d, c) => `Разница с городом ${c}: −${d}`, same: (c) => `То же время, что и в городе ${c}`,
    prayH: 'Время намаза там', date: 'Дата',
    abubakr: 'Расчёт: расписание мечети Абу Бакр в Баку (как для городов Азербайджана на сайте).',
    diyanet: 'Расчёт: метод Diyanet (Турция) — как для городов мира на сайте.', // lang-ok[Diyanet]: название ведомства
    asrH: 'Аср: ханафитский (по выбору мазхаба).', asrS: 'Аср: расчёт шафиитов, маликитов и ханбалитов (стандартный).',
    prayNote: 'Время рассчитывается на вашем устройстве. Местные мечети могут использовать другой метод — уточните на месте.',
    qiblaH: 'Кибла там', qiblaDeg: (d, p) => `${d}° от истинного севера (${p})`, qiblaKm: (km) => `${km} км до Каабы`,
    qiblaNote: 'Истинный север, не магнитный. На месте страница «Кибла» может использовать компас телефона.',
    atKaaba: 'Кааба находится в этом городе.',
    qiblaLink: 'Открыть компас киблы', dial: (d) => `Направление киблы: ${d}° от истинного севера`,
    points: ['север', 'северо-восток', 'восток', 'юго-восток', 'юг', 'юго-запад', 'запад', 'северо-запад'],
    nearH: 'Мечети и халяль-еда',
    nearLead: 'Поиск мечетей и халяльных мест ищет вокруг вашего устройства или выбранного города намаза — не вокруг выбранного здесь города. На месте нажмите «Искать рядом со мной» или сделайте этот город городом намаза.',
    useCity: (c) => `Сделать ${c} городом намаза`, useCityNote: 'Это меняет город для времени намаза на всём сайте. Вернуть можно в любой момент.',
    cityDone: (c) => `Теперь ваш город намаза: ${c}.`,
    mosques: 'Найти мечети', halal: 'Халяль-места', osm: 'Открыть район в OpenStreetMap', // lang-ok[OpenStreetMap]: название сервиса
    lessonH: 'Намаз в поездке',
    lessonTxt: 'Учёные расходятся во мнениях о том, кто считается путником (расстояние и срок пребывания), и о сокращении (каср) и объединении (джам‘) намазов. Эта страница не выносит своего решения — прочитайте урок с доводами или спросите учёного, которому доверяете.',
    lessonLink: 'Урок: намаз путника',
    planH: 'Спланируйте путь', road: 'Время намаза в поездке на машине', flight: 'Время намаза в самолёте',
    planNote: 'Оба — внизу страницы «Время намаза».', onroad: 'Режим «В дороге»',
    histH: 'История рядом с этим местом',
    battuta: (y, approx, n) => `${approx ? 'Около ' : ''}${y}: Ибн Баттута — ${n}`,
    battutaSrc: 'Источник: Ибн Баттута, «Тухфат ан-нуззар» («Рихла»); даты — по Р. Э. Данну, «Приключения Ибн Баттуты».',
    quranPlace: (n) => `${n} — упоминается в Коране`, approx: 'Точное место неизвестно, точка приблизительная.', ayah: 'Аят',
    histLink: 'Подробнее в разделе исламской истории',
    privacy: 'Место ищется бесплатным поиском Open-Meteo (как в выборе города). На нашем сервере ничего не хранится.', // lang-ok[Open-Meteo]: название сервиса
  },
  tr: {
    title: 'Müslüman yolcu çantası',
    lead: 'Nereye gittiğinizi seçin — tek sayfada: oradaki kıble, namaz vakitleri, saat farkı ve yolculuk için faydalı bağlantılar.',
    dest: 'Varış yeri', destHint: 'Şehir adı…', world: 'Dünyada ara', searching: 'Aranıyor…',
    worldErr: 'Arama başarısız. Bağlantınızı kontrol edin.', worldNone: 'Hiçbir şey bulunamadı',
    notListed: 'Listede yok — «Dünyada ara» düğmesine basın.',
    found: (n) => `${n} yer bulundu`,
    pickFirst: 'Kıbleyi ve namaz vakitlerini görmek için bir varış yeri seçin.',
    showing: (c) => `${c} gösteriliyor`,
    trips: 'Yolculuklarım', tripsEmpty: 'Henüz kayıtlı yolculuk yok. Bir varış yerini kaydedin, burada hızlıca bulun.',
    save: 'Yolculuklarıma kaydet', saved: 'Yolculuklarıma kaydedildi.', full: `En fazla ${TRIPS_MAX} yolculuk saklanabilir. Önce birini silin.`,
    remove: (n) => `${n} — sil`, removed: (n) => `${n} silindi.`,
    tripsNote: 'Yolculuklar bu cihazda saklanır (giriş yaptıysanız şifreli eşitlemede de).',
    timeH: 'Oradaki saat', nowThere: (hm) => `Şu an orada: ${hm}`, home: (c) => `Eviniz (namaz şehriniz): ${c}`,
    ahead: (d, c) => `${c} saatine göre ${d} ileri`, behind: (d, c) => `${c} saatine göre ${d} geri`, same: (c) => `${c} ile aynı saat`,
    prayH: 'Oradaki namaz vakitleri', date: 'Tarih',
    abubakr: 'Hesap: Bakü’deki Ebu Bekir camisinin takvimi (sitedeki Azerbaycan şehirleri gibi).',
    diyanet: 'Hesap: Diyanet (Türkiye) yöntemi — sitedeki dünya şehirleri gibi.',
    asrH: 'İkindi: Hanefî (mezhep seçiminize göre).', asrS: 'İkindi: Şâfiî, Mâlikî ve Hanbelî hesabı (standart).',
    prayNote: 'Vakitler cihazınızda hesaplanır. Yerel camiler başka bir yöntem kullanabilir — varınca onlara sorun.',
    qiblaH: 'Oradaki kıble', qiblaDeg: (d, p) => `Gerçek kuzeyden ${d}° (${p})`, qiblaKm: (km) => `Kâbe’ye ${km} km`,
    qiblaNote: 'Gerçek kuzey, manyetik kuzey değil. Varınca «Kıble» sayfası telefonun pusulasını kullanabilir.',
    atKaaba: 'Kâbe bu şehirde.',
    qiblaLink: 'Kıble pusulasını aç', dial: (d) => `Kıble yönü: gerçek kuzeyden ${d}°`,
    points: ['kuzey', 'kuzeydoğu', 'doğu', 'güneydoğu', 'güney', 'güneybatı', 'batı', 'kuzeybatı'],
    nearH: 'Camiler ve helal yemek',
    nearLead: 'Cami arama ve helal yerler, cihazınızın konumu veya seçtiğiniz namaz şehri çevresinde arar — burada seçtiğiniz şehrin çevresinde değil. Varınca «Konumuma göre ara» düğmesine basın ya da bu şehri namaz şehriniz yapın.',
    useCity: (c) => `${c} namaz şehrim olsun`, useCityNote: 'Bu, tüm sitede namaz vakitlerinin şehrini değiştirir. İstediğiniz zaman geri alabilirsiniz.',
    cityDone: (c) => `${c} artık namaz şehriniz.`,
    mosques: 'Cami ara', halal: 'Helal yerler', osm: 'Bölgeyi OpenStreetMap’te aç', // lang-ok[OpenStreetMap]: hizmetin adı
    lessonH: 'Yolculukta namaz',
    lessonTxt: 'Kimin yolcu sayıldığı (mesafe ve kalış süresi), namazı kısaltma (kasr) ve birleştirme (cem) konusunda âlimler farklı görüştedir. Bu sayfa kendi hükmünü vermez — delilleriyle dersi okuyun veya güvendiğiniz bir âlime sorun.',
    lessonLink: 'Ders: yolcu namazı',
    planH: 'Yolu planlayın', road: 'Araba yolculuğunda namaz vakitleri', flight: 'Uçakta namaz vakitleri',
    planNote: 'İkisi de «Namaz vakitleri» sayfasının altında.', onroad: '«Yolda» modu',
    histH: 'Bu yerin yakınında tarih',
    battuta: (y, approx, n) => `${approx ? 'Yaklaşık ' : ''}${y}: İbn Battûta — ${n}`,
    battutaSrc: 'Kaynak: İbn Battûta, Tuhfetü’n-Nuzzâr (Rihle); tarihler — R. E. Dunn, The Adventures of Ibn Battuta.', // lang-ok[The,of,Adventures,Battuta]: kitabın İngilizce adı
    quranPlace: (n) => `${n} — adı Kur’an’da geçer`, approx: 'Tam yeri bilinmiyor; nokta yaklaşıktır.', ayah: 'Ayet',
    histLink: 'İslam tarihi bölümünde daha fazlası',
    privacy: 'Varış yeri Open-Meteo’nun ücretsiz yer aramasıyla bulunur (şehir seçici gibi). Sunucumuzda hiçbir şey saklanmaz.', // lang-ok[Open-Meteo’nun]: hizmetin adı
  },
  ar: {
    title: 'حقيبة المسافر المسلم',
    lead: 'اختر وجهتك لتحصل في صفحة واحدة على القبلة هناك، ومواقيت الصلاة، وفرق التوقيت، وروابط مفيدة للرحلة.',
    dest: 'الوجهة', destHint: 'اسم المدينة…', world: 'ابحث في العالم', searching: 'جارٍ البحث…',
    worldErr: 'تعذّر البحث. تحقّق من الاتصال.', worldNone: 'لا توجد نتائج',
    notListed: 'ليست في القائمة — اضغط «ابحث في العالم».',
    found: (n) => `عدد الأماكن: ${n}`,
    pickFirst: 'اختر وجهة لترى القبلة ومواقيت الصلاة فيها.',
    showing: (c) => `المعروض: ${c}`,
    trips: 'رحلاتي', tripsEmpty: 'لا رحلات محفوظة بعد. احفظ وجهة لتجدها هنا بسرعة.',
    save: 'احفظ في رحلاتي', saved: 'حُفظت في رحلاتي.', full: `يمكن حفظ ${TRIPS_MAX} رحلة على الأكثر. احذف واحدة أولًا.`,
    remove: (n) => `حذف ${n}`, removed: (n) => `حُذفت: ${n}.`,
    tripsNote: 'تُحفظ الرحلات على هذا الجهاز (وفي المزامنة المشفّرة إن كنت مسجّلًا).',
    timeH: 'الوقت هناك', nowThere: (hm) => `الآن هناك: ${hm}`, home: (c) => `بلدك (مدينة الصلاة): ${c}`,
    ahead: (d, c) => `متقدّم بـ${d} عن ${c}`, behind: (d, c) => `متأخّر بـ${d} عن ${c}`, same: (c) => `نفس توقيت ${c}`,
    prayH: 'مواقيت الصلاة هناك', date: 'التاريخ',
    abubakr: 'الحساب: جدول مسجد أبي بكر في باكو (كمدن أذربيجان في الموقع).',
    diyanet: 'الحساب: طريقة رئاسة الشؤون الدينية التركية — كمدن العالم في الموقع.',
    asrH: 'العصر: الحنفي (حسب اختيارك للمذهب).', asrS: 'العصر: حساب الشافعية والمالكية والحنابلة (القياسي).',
    prayNote: 'تُحسب المواقيت على جهازك. قد تعتمد المساجد المحلية طريقة أخرى — اسألهم عند وصولك.',
    qiblaH: 'القبلة هناك', qiblaDeg: (d, p) => `${d}° من الشمال الحقيقي (${p})`, qiblaKm: (km) => `${km} كم إلى الكعبة`,
    qiblaNote: 'الشمال الحقيقي لا المغناطيسي. عند الوصول يمكن لصفحة «القبلة» استخدام بوصلة الهاتف.',
    atKaaba: 'الكعبة في هذه المدينة.',
    qiblaLink: 'افتح بوصلة القبلة', dial: (d) => `اتجاه القبلة: ${d}° من الشمال الحقيقي`,
    points: ['الشمال', 'الشمال الشرقي', 'الشرق', 'الجنوب الشرقي', 'الجنوب', 'الجنوب الغربي', 'الغرب', 'الشمال الغربي'],
    nearH: 'المساجد والطعام الحلال',
    nearLead: 'يبحث مُستكشف المساجد والأماكن الحلال حول موقع جهازك أو مدينة الصلاة المختارة — لا حول المدينة التي اخترتها هنا. عند الوصول اضغط «ابحث قربي»، أو اجعل هذه المدينة مدينة الصلاة.',
    useCity: (c) => `اجعل ${c} مدينة الصلاة`, useCityNote: 'هذا يغيّر مدينة مواقيت الصلاة في الموقع كله. يمكنك الرجوع متى شئت.',
    cityDone: (c) => `${c} الآن مدينة الصلاة لديك.`,
    mosques: 'ابحث عن مساجد', halal: 'أماكن حلال', osm: 'افتح المنطقة في OpenStreetMap', // lang-ok[OpenStreetMap]: اسم الخدمة
    lessonH: 'الصلاة في السفر',
    lessonTxt: 'اختلف العلماء فيمن يُعدّ مسافرًا (المسافة ومدة الإقامة) وفي قصر الصلاة وجمعها. لا تُصدر هذه الصفحة حكمًا من عندها — اقرأ الدرس بأدلته أو اسأل عالمًا تثق به.',
    lessonLink: 'درس: صلاة المسافر',
    planH: 'خطّط للطريق', road: 'مواقيت الصلاة في رحلة السيارة', flight: 'مواقيت الصلاة في الطائرة',
    planNote: 'كلاهما في أسفل صفحة «مواقيت الصلاة».', onroad: 'وضع الطريق',
    histH: 'تاريخ قرب هذا المكان',
    battuta: (y, approx, n) => `${approx ? 'نحو ' : ''}${y}: ابن بطوطة — ${n}`,
    battutaSrc: 'المصدر: ابن بطوطة، «تحفة النظار في غرائب الأمصار وعجائب الأسفار» (الرحلة)؛ التواريخ بحسب روس دن، «مغامرات ابن بطوطة».',
    quranPlace: (n) => `${n} — ورد اسمه في القرآن`, approx: 'الموضع الدقيق غير معروف، والنقطة تقريبية.', ayah: 'آية',
    histLink: 'المزيد في قسم التاريخ الإسلامي',
    privacy: 'يُبحث عن الوجهة عبر بحث الأماكن المجاني في Open-Meteo (كمُختار المدينة). لا يُحفظ شيء على خادمنا.', // lang-ok[Open-Meteo]: اسم الخدمة
  },
}

const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

const clockFmt = new Map()
function clockOf(ms, tz, lang) {
  const k = `${lang}|${tz}`
  let f = clockFmt.get(k)
  if (!f) {
    const o = { timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }
    try { f = new Intl.DateTimeFormat(lang, o) } catch { f = new Intl.DateTimeFormat('en', o) }
    clockFmt.set(k, f)
  }
  return f.format(new Date(ms))
}
const numFmt = new Map()
function fmtNum(n, lang) {
  let f = numFmt.get(lang)
  if (!f) { try { f = new Intl.NumberFormat(lang, { maximumFractionDigits: 0 }) } catch { f = new Intl.NumberFormat('en') } numFmt.set(lang, f) }
  return f.format(n)
}

/** Kiçik qiblə siferblatı: şimal yuxarıda, ox qiblə bucağında (animasiya yoxdur) */
function QiblaDial({ deg, label }) {
  return (
    <svg className="tk-dial" viewBox="0 0 120 120" role="img" aria-label={label} data-testid="tk-dial" data-deg={Math.round(deg)}>
      <circle cx="60" cy="60" r="54" className="tk-dial__ring" />
      {Array.from({ length: 8 }, (_, i) => (
        <line key={i} x1="60" y1="8" x2="60" y2={i % 2 ? 14 : 18} className="tk-dial__tick" transform={`rotate(${i * 45} 60 60)`} />
      ))}
      <text x="60" y="30" textAnchor="middle" className="tk-dial__n">N</text>
      <g transform={`rotate(${deg.toFixed(1)} 60 60)`}>
        <line x1="60" y1="60" x2="60" y2="20" className="tk-dial__arrow" />
        <path d="M60 14 l-6 10 h12 z" className="tk-dial__head" />
      </g>
      <circle cx="60" cy="60" r="4" className="tk-dial__hub" />
    </svg>
  )
}

export default function TravellerKitPage({ setPage }) {
  const { lang } = useLang()
  const t = pickUi(T, lang, 'en')
  const u = pickUi(UNITS, lang, 'en')
  const navigate = useNavigate()

  const [ready, setReady] = useState(false)
  const [dest, setDest] = useState(null)
  const [date, setDate] = useState('')          // 'YYYY-MM-DD' — təyinatın günü
  const [trips, setTrips] = useState([])
  const [home, setHome] = useState(null)
  const [asr, setAsr] = useState(1)
  const [now, setNow] = useState(0)
  const [msg, setMsg] = useState('')
  const [hist, setHist] = useState(null)
  const resultRef = useRef(null)

  // Şəxsi vəziyyət — yalnız mount-dan sonra
  useEffect(() => {
    const load = () => { setTrips(readTrips().l.slice().reverse()); setHome(getPrayerLocation()); setAsr(currentAsrFactor()) }
    load()
    setNow(Date.now())
    setReady(true)
    const onStorage = (e) => { if (!e.key || e.key === 'traveller_trips_v1') load() }
    window.addEventListener(TRIPS_EVENT, load)
    window.addEventListener(PROFILE_EVENT, load)
    window.addEventListener('storage', onStorage)
    const unM = subscribeMadhab(() => setAsr(currentAsrFactor()))
    const id = setInterval(() => setNow(Date.now()), 30000)
    return () => {
      window.removeEventListener(TRIPS_EVENT, load); window.removeEventListener(PROFILE_EVENT, load)
      window.removeEventListener('storage', onStorage); unM(); clearInterval(id)
    }
  }, [])

  const choose = useCallback((p) => {
    setDest(p)
    setDate(ymdKey(zonedYMD(Date.now(), p.tz)))
    setMsg(t.showing(p.label))
    setHist(null)
    requestAnimationFrame(() => resultRef.current?.focus({ preventScroll: false }))
  }, [t])

  // Mənbəli tarixi qeyd — data modulları yalnız təyinat seçiləndə yüklənir
  useEffect(() => {
    if (!dest) return undefined
    let on = true
    Promise.all([import('../data/ibnBattuta'), import('../data/prophetPlaces')])
      .then(([b, q]) => { if (on) setHist(historyNear(dest, { stops: b.IBN_BATTUTA_STOPS, places: q.PROPHET_PLACES })) })
      .catch(() => {})
    return () => { on = false }
  }, [dest])

  const day = useMemo(() => parseYmd(date), [date])
  const pray = useMemo(() => (dest && day ? destTimes(dest, day, asr) : null), [dest, day, asr])
  const qibla = useMemo(() => (dest ? qiblaFor(dest) : null), [dest])
  const diff = useMemo(() => (dest && home && now ? tzDiffMin(home.tz, dest.tz, now) : null), [dest, home, now])
  const homeName = home ? ((home.city && (home.city[lang] || home.city.en)) || '') : ''

  const onSave = () => {
    if (!dest) return
    const r = saveTrip(dest)
    setMsg(r.ok ? t.saved : (r.full ? t.full : ''))
    if (r.ok) setTrips(r.data.l.slice().reverse())
  }
  const onRemove = (trip) => {
    const d = removeTrip(trip.id)
    setTrips(d.l.slice().reverse())
    setMsg(t.removed(trip.n))
  }
  const makeHome = () => {
    if (!dest) return
    setPrayerCity({ lat: dest.lat, lng: dest.lng, tz: dest.tz, name: dest.label, country: dest.country })
    setHome(getPrayerLocation())
    setMsg(t.cityDone(dest.label))
  }

  const go = (e, key, param) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    if (param == null && setPage) setPage(key)
    else navigate(pathFor(key, lang, param))
    window.scrollTo(0, 0)
  }
  const link = (key, label, icon, param) => (
    <a className="ui-btn ui-btn--secondary ui-btn--sm" href={pathFor(key, lang, param)} onClick={(e) => go(e, key, param)} data-testid={`tk-link-${key}`}>
      <Icon name={icon} size={16} /> {label}
    </a>
  )
  const diffTxt = diff == null ? '' : diff === 0 ? t.same(homeName) : diff > 0 ? t.ahead(dur(diff, u), homeName) : t.behind(dur(-diff, u), homeName)
  const pName = (k) => pickUi(PRAYER_NAMES[k], lang, 'en')
  const hasHist = hist && (hist.battuta.length || hist.quran.length)

  return (
    <div className="tk-page">
      <header className="ui-page-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <HeroOrnament />
        <div className="ui-container">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{navGroupLabel(navGroupOf('travelkit'), lang)}</span>
          <h1 className="ui-display">{t.title}</h1>
          <p className="ui-lead">{t.lead}</p>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container tk-wrap">
          <div className="ui-card tk-pick">
            <DestinationField t={t} lang={lang} onPick={choose} />
            <p className="tk-hint"><Icon name="lock" size={14} /> {t.privacy}</p>
          </div>

          <section className="ui-card tk-trips" aria-labelledby="tk-trips-h" data-testid="tk-trips" data-count={trips.length}>
            <h2 id="tk-trips-h" className="tk-h"><Icon name="pin" size={18} /> {t.trips}</h2>
            {ready && !trips.length && <p className="tk-muted">{t.tripsEmpty}</p>}
            {trips.length > 0 && (
              <ul className="tk-trips__list">
                {trips.map((x) => (
                  <li key={x.id} className="tk-trip">
                    <button type="button" className="ui-chip tk-trip__open" aria-pressed={!!dest && Math.abs(dest.lat - x.la) < 0.01 && Math.abs(dest.lng - x.lo) < 0.01}
                      onClick={() => choose(tripPlace(x))} data-testid="tk-trip">
                      {x.n}
                    </button>
                    <button type="button" className="ui-icon-btn tk-trip__del" aria-label={t.remove(x.n)} onClick={() => onRemove(x)} data-testid="tk-trip-del">
                      <Icon name="trash" size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="tk-muted tk-small">{t.tripsNote}</p>
          </section>

          <p className="ui-sr-only" role="status" aria-live="polite">{msg}</p>

          {!dest && <p className="tk-empty" data-testid="tk-empty">{t.pickFirst}</p>}

          {dest && (
            <div className="tk-result" data-testid="tk-result">
              <div className="tk-result__head">
                <h2 className="tk-dest-name" tabIndex={-1} ref={resultRef} data-testid="tk-dest-name">{dest.label}</h2>
                <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={onSave} data-testid="tk-save">
                  <Icon name="plus" size={16} /> {t.save}
                </button>
              </div>

              <div className="tk-grid">
                <section className="ui-card tk-card" aria-labelledby="tk-time-h" data-testid="tk-time">
                  <h3 id="tk-time-h" className="tk-h"><Icon name="clock" size={18} /> {t.timeH}</h3>
                  {now > 0 && <p className="tk-big ui-num">{t.nowThere(clockOf(now, dest.tz, lang))}</p>}
                  {diffTxt && <p data-testid="tk-diff">{diffTxt}</p>}
                  {homeName && <p className="tk-muted tk-small">{t.home(homeName)}</p>}
                </section>

                <section className="ui-card tk-card" aria-labelledby="tk-qibla-h" data-testid="tk-qibla">
                  <h3 id="tk-qibla-h" className="tk-h"><Icon name="qibla" size={18} /> {t.qiblaH}</h3>
                  {qibla.km < 2 ? <p className="tk-big" data-testid="tk-qibla-deg">{t.atKaaba}</p> : (
                    <div className="tk-qibla">
                      <QiblaDial deg={qibla.deg} label={t.dial(Math.round(qibla.deg))} />
                      <div>
                        <p className="tk-big ui-num" data-testid="tk-qibla-deg">{t.qiblaDeg(Math.round(qibla.deg), t.points[qibla.point])}</p>
                        <p>{t.qiblaKm(fmtNum(Math.round(qibla.km), lang))}</p>
                      </div>
                    </div>
                  )}
                  <p className="tk-muted tk-small">{t.qiblaNote}</p>
                  {link('qibla', t.qiblaLink, 'qibla')}
                </section>

                <section className="ui-card tk-card tk-card--wide" aria-labelledby="tk-pray-h" data-testid="tk-pray">
                  <div className="tk-row">
                    <h3 id="tk-pray-h" className="tk-h"><Icon name="prayer" size={18} /> {t.prayH}</h3>
                    <label className="tk-date">
                      <span>{t.date}</span>
                      <input type="date" className="ui-input ui-input--sm" value={date} onChange={(e) => { if (parseYmd(e.target.value)) setDate(e.target.value) }} data-testid="tk-date" />
                    </label>
                  </div>
                  {pray && (
                    <dl className="tk-times" data-testid="tk-times">
                      {PRAYERS.map((k) => (
                        <div key={k} className={`tk-time${k === 'sunrise' ? ' is-sun' : ''}`}>
                          <dt>{pName(k)}</dt>
                          <dd className="ui-num" data-testid={`tk-t-${k}`}>{pray.times[k] || '—'}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  {pray && <p className="tk-muted tk-small">{pray.key === 'abubakr' ? t.abubakr : t.diyanet} {asr === 2 ? t.asrH : t.asrS}</p>}
                  <p className="tk-muted tk-small">{t.prayNote}</p>
                </section>

                <section className="ui-card tk-card" aria-labelledby="tk-near-h" data-testid="tk-near">
                  <h3 id="tk-near-h" className="tk-h"><Icon name="mosques" size={18} /> {t.nearH}</h3>
                  <p>{t.nearLead}</p>
                  <div className="tk-actions">
                    {link('mosques', t.mosques, 'mosques')}
                    {link('halalcheck', t.halal, 'halalcheck')}
                    <a className="ui-btn ui-btn--ghost ui-btn--sm" href={`https://www.openstreetmap.org/?mlat=${dest.lat.toFixed(4)}&mlon=${dest.lng.toFixed(4)}#map=14/${dest.lat.toFixed(4)}/${dest.lng.toFixed(4)}`}
                      target="_blank" rel="noopener noreferrer" data-testid="tk-osm">
                      <Icon name="external" size={16} /> {t.osm}
                    </a>
                  </div>
                  <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm tk-usecity" onClick={makeHome} data-testid="tk-usecity">
                    <Icon name="pin" size={16} /> {t.useCity(dest.label)}
                  </button>
                  <p className="tk-muted tk-small">{t.useCityNote}</p>
                </section>

                <section className="ui-card tk-card" aria-labelledby="tk-lesson-h" data-testid="tk-lesson">
                  <h3 id="tk-lesson-h" className="tk-h"><Icon name="learn" size={18} /> {t.lessonH}</h3>
                  <p>{t.lessonTxt}</p>
                  {link('learn', t.lessonLink, 'learn', 'travel-prayer')}
                </section>

                <section className="ui-card tk-card" aria-labelledby="tk-plan-h" data-testid="tk-plan">
                  <h3 id="tk-plan-h" className="tk-h"><Icon name="onroad" size={18} /> {t.planH}</h3>
                  <ul className="tk-links">
                    <li>{link('prayer', t.road, 'onroad')}</li>
                    <li>{link('prayer', t.flight, 'globe')}</li>
                    <li>{link('onroad', t.onroad, 'compass')}</li>
                  </ul>
                  <p className="tk-muted tk-small">{t.planNote}</p>
                </section>

                {hasHist ? (
                  <section className="ui-card tk-card tk-card--wide" aria-labelledby="tk-hist-h" data-testid="tk-hist">
                    <h3 id="tk-hist-h" className="tk-h"><Icon name="history" size={18} /> {t.histH}</h3>
                    {hist.quran.length > 0 && (
                      <ul className="tk-hist">
                        {hist.quran.map((p) => (
                          <li key={p.id}>
                            <b>{t.quranPlace(pickUi(p.name, lang, 'en'))}</b>
                            {' '}
                            <span className="tk-refs">
                              {p.refs.map(([ref]) => {
                                const s = Number(ref.split(':')[0])
                                return <a key={ref} href={pathFor('quran', lang, s)} onClick={(e) => go(e, 'quran', s)} className="ui-link">{t.ayah} {ref}</a>
                              })}
                            </span>
                            {p.approx && <span className="tk-muted tk-small"> {t.approx}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                    {hist.battuta.length > 0 && (
                      <>
                        <ul className="tk-hist">
                          {hist.battuta.map((s) => (
                            <li key={`${s.i}`}>
                              <b>{t.battuta(s.year, s.approx, pickUi(s.name, lang, 'en'))}</b>
                              <span> {pickUi(s.note, lang, 'en')}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="tk-muted tk-small">{t.battutaSrc}</p>
                      </>
                    )}
                    {link('history', t.histLink, 'history')}
                  </section>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
