// ═══════════════════════════════════════════════════════
// /debt-ledger — "Borc dəftəri" (P1)
//
// Borcu yazmaq: əl-Bəqərə 2:282 — ayə mətni YAZILMIR, saytın Quran mənbəyindən (components/quote/content →
// fetchAyah) yalnız düyməyə basanda yüklənir + Quran səhifəsinə keçid.
// GİZLİ siyahı: "mən borcluyam" / "mənə borcludurlar" — şəxs, məbləğ + valyuta, gün, qaytarılma günü,
// şahidlər, qeyd, qismən qaytarmalar, "bağlandı". Başqaları ilə müqayisə / reytinq YOXDUR; yalnız öz açıq
// qalıqlarınız. Saxlama: utils/debtLedger (debt_ledger_v1 — profilə aid; ehtiyat nüsxə və hesabın E2E
// şifrəli sinxronizasiyası onu daşıyır). Yaddaş yalnız mount-dan sonra oxunur.
// Xatırlatma (istəyə bağlı, qeyd üzrə): qaytarılma günü çatanda — bildiriş icazəsi ARTIQ verilibsə yerli
// bildiriş (icazə soruşulmur; mətnində ad / məbləğ yoxdur), yoxdursa səhifədə zolaq. Hesabla daxil olan
// istifadəçi ayrıca razılıqla serverdəki "gələcəyə məktub" sistemindən (api/personal → createLetter) də
// istifadə edə bilər — orada yalnız gün və ümumi mətn ŞİFRƏSİZ saxlanır (ad, məbləğ getmir).
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import HeroOrnament from '../components/HeroOrnament'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import RelatedLinks from '../components/RelatedLinks'
import { isPlainClick } from '../components/PageLink'
import { navGroupLabel, navGroupOf } from '../data/navigation'
import { pathFor } from '../seo/routes'
import { pickUi } from '../utils/uiText'
import { dayLabel } from '../utils/dayLabel'
import { parseAmount } from '../utils/parseAmount'
import { surahLabel } from '../components/hifz/surahLabel'
import { showLocalNotification } from '../utils/notify'
import { createLetter, deleteLetter, listLetters, personalErrorKey } from '../api/personal'
import { ConsentBox, usePersonalText, useSignedIn } from '../components/personal/PersonalUi'
import {
  readLedger, saveDebt, patchDebt, removeDebt, addRepayment, removeRepayment, paidOf, remaining, isSettled,
  dueState, daysUntilDue, dueReminders, openTotals, knownNames, localDay,
  DEBT_KEY, DEBT_EVENT, DEBT_KINDS, CURRENCIES, PERSON_MAX, NOTE_MAX, WITNESS_MAX,
} from '../utils/debtLedger'
import '../styles/DebtLedgerPage.css'

// Ru: rəqəmdən sonra sözün forması — bütöv ifadə üçün
const ruForm = (n, one, few, many) => {
  const a = n % 10, b = n % 100
  if (a === 1 && b !== 11) return one
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few
  return many
}
const arDays = (n) => (n === 1 ? 'يوم واحد' : n === 2 ? 'يومان' : n <= 10 ? `${n} أيام` : `${n} يومًا`)
const arEntries = (n) => (n === 1 ? 'قيد واحد' : n === 2 ? 'قيدان' : n <= 10 ? `${n} قيود` : `${n} قيدًا`)

const T = {
  az: {
    title: 'Borc dəftəri',
    lead: 'Borclarınızı unutmamaq üçün sakit, şəxsi qeyd: kimə borclusunuz və kim sizə borcludur.',
    private: 'Qeydlər yalnız sizdədir: bu cihazda, ehtiyat nüsxədə və hesabın şifrəli sinxronizasiyasında. Heç kimlə paylaşılmır və müqayisə olunmur.',
    ayahLead: 'Quranda müddətli borcu yazmaq və şahid tutmaq barədə ayə:', ayahShow: 'Ayəni burada göstər', ayahHide: 'Ayəni gizlət',
    ayahRead: 'Quranda oxu', ayahLoading: 'Yüklənir…', ayahFail: 'Ayəni yükləmək alınmadı.',
    addTitle: 'Yeni qeyd', editTitle: 'Qeydi redaktə et', kind: 'Növ', kinds: { owe: 'Mən borcluyam', owed: 'Mənə borcludurlar' },
    person: 'Kim?', personPh: 'Ad', amount: 'Məbləğ', currency: 'Valyuta', date: 'Borc günü', due: 'Qaytarılma günü (istəyə bağlı)',
    witnesses: 'Şahidlər (istəyə bağlı)', witnessesHint: `Adları vergüllə ayırın (ən çox ${WITNESS_MAX}).`, note: 'Qeyd (istəyə bağlı)',
    remind: 'Qaytarılma günü xatırlat', remindHint: 'Bildirişə icazə artıq verilibsə, bu səhifəni açanda bildiriş gələcək; yoxdursa — burada zolaq görünəcək. İcazə soruşulmur.',
    server: 'Həmin gün e-poçtuma / telefonuma da göndər (hesab)', serverNote: 'Serverdə yalnız gün və "borc dəftərində bir qeydin vaxtı çatıb" mətni şifrəsiz saxlanır — ad və məbləğ getmir.',
    save: 'Yadda saxla', update: 'Dəyişikliyi saxla', cancel: 'Ləğv et', edit: 'Redaktə et', del: 'Sil',
    confirmDel: 'Bu qeyd silinsin?', yes: 'Bəli, sil', no: 'Xeyr',
    invalid: 'Ad, düzgün məbləğ, valyuta və gün yazın.',
    added: 'Qeyd əlavə olundu.', updated: 'Qeyd yeniləndi.', deleted: 'Qeyd silindi.',
    totals: 'Açıq qalıqlarım', oweTotal: 'Mənim borcum', owedTotal: 'Mənə olan borc', nothingOpen: 'Açıq borc yoxdur.',
    list: 'Qeydlər', filters: { open: 'Açıq', settled: 'Bağlanmış', all: 'Hamısı' }, empty: 'Burada hələ qeyd yoxdur.',
    owePerson: (p) => `${p} — mən borcluyam`, owedPerson: (p) => `${p} — mənə borcludur`,
    left: (m) => `Qalıq: ${m}`, paid: (m) => `Qaytarılıb: ${m}`, of: (m) => `Məbləğ: ${m}`,
    since: (d) => `Borc günü: ${d}`, dueOn: (d) => `Qaytarılma: ${d}`,
    dueIn: (n) => `${n} gün qalıb`, dueToday: 'Bu gün qaytarılmalıdır', overdue: (n) => `${n} gün gecikib`,
    settledBadge: 'Bağlanıb', settledOn: (d) => `Bağlandı: ${d}`, witnessesList: (w) => `Şahidlər: ${w}`,
    repayTitle: 'Qismən qaytarma', repayAmount: 'Məbləğ', repayDate: 'Gün', repayAdd: 'Qaytarmanı əlavə et', repayDel: 'Qaytarmanı sil',
    repayTooMuch: 'Bu məbləğ qalıqdan çoxdur.', repayInvalid: 'Düzgün məbləğ və gün yazın.', repayAdded: 'Qaytarma qeyd olundu.', repayRemoved: 'Qaytarma silindi.',
    settle: 'Bağlandı kimi qeyd et', reopen: 'Yenidən aç', settledMsg: 'Qeyd bağlandı.', reopenedMsg: 'Qeyd yenidən açıldı.',
    banner: (n) => (n === 1 ? 'Bir qeydin qaytarılma günü çatıb və ya keçib.' : `${n} qeydin qaytarılma günü çatıb və ya keçib.`),
    notifTitle: 'Borc dəftəri', notifBody: 'Bir qeydin qaytarılma günü çatıb.',
    letterBody: 'Borc dəftəri: bir qeydin qaytarılma günü bu gündür. muslims.cc → Borc dəftəri.',
    serverSet: 'Server xatırlatması quruldu.', reminderOn: 'Xatırlatma açıqdır', serverOn: 'E-poçt / telefon xatırlatması',
    related: 'Əlaqəli bölmələr',
  },
  en: {
    title: 'Debt ledger',
    lead: 'A calm, private record so you don’t forget your debts: what you owe and what is owed to you.',
    private: 'Your entries stay with you: on this device, in your backup and in your account’s encrypted sync. Nothing is shared or compared.',
    ayahLead: 'The ayah in the Quran about writing down a debt for a fixed term and taking witnesses:', ayahShow: 'Show the ayah here', ayahHide: 'Hide the ayah',
    ayahRead: 'Read in the Quran', ayahLoading: 'Loading…', ayahFail: 'The ayah could not be loaded.',
    addTitle: 'New entry', editTitle: 'Edit entry', kind: 'Type', kinds: { owe: 'I owe', owed: 'Owed to me' },
    person: 'Who?', personPh: 'Name', amount: 'Amount', currency: 'Currency', date: 'Date of the debt', due: 'Due date (optional)',
    witnesses: 'Witnesses (optional)', witnessesHint: `Separate names with commas (up to ${WITNESS_MAX}).`, note: 'Note (optional)',
    remind: 'Remind me on the due date', remindHint: 'If notifications are already allowed, you’ll get one when you open this page; otherwise a banner shows here. No permission is requested.',
    server: 'Also send it to my email / phone on that day (account)', serverNote: 'Only the date and the text “an entry in your debt ledger is due” are stored on our server unencrypted — no names or amounts.',
    save: 'Save', update: 'Save changes', cancel: 'Cancel', edit: 'Edit', del: 'Delete',
    confirmDel: 'Delete this entry?', yes: 'Yes, delete', no: 'No',
    invalid: 'Enter a name, a valid amount, a currency and a date.',
    added: 'Entry added.', updated: 'Entry updated.', deleted: 'Entry deleted.',
    totals: 'My open balances', oweTotal: 'I owe', owedTotal: 'Owed to me', nothingOpen: 'No open debts.',
    list: 'Entries', filters: { open: 'Open', settled: 'Settled', all: 'All' }, empty: 'No entries here yet.',
    owePerson: (p) => `I owe ${p}`, owedPerson: (p) => `${p} owes me`,
    left: (m) => `Left: ${m}`, paid: (m) => `Repaid: ${m}`, of: (m) => `Amount: ${m}`,
    since: (d) => `Date: ${d}`, dueOn: (d) => `Due: ${d}`,
    dueIn: (n) => (n === 1 ? 'Due in 1 day' : `Due in ${n} days`), dueToday: 'Due today', overdue: (n) => (n === 1 ? 'Overdue by 1 day' : `Overdue by ${n} days`),
    settledBadge: 'Settled', settledOn: (d) => `Settled: ${d}`, witnessesList: (w) => `Witnesses: ${w}`,
    repayTitle: 'Partial repayment', repayAmount: 'Amount', repayDate: 'Date', repayAdd: 'Add repayment', repayDel: 'Delete repayment',
    repayTooMuch: 'This amount is more than what is left.', repayInvalid: 'Enter a valid amount and date.', repayAdded: 'Repayment recorded.', repayRemoved: 'Repayment deleted.',
    settle: 'Mark as settled', reopen: 'Reopen', settledMsg: 'Entry settled.', reopenedMsg: 'Entry reopened.',
    banner: (n) => (n === 1 ? 'One entry is due or overdue.' : `${n} entries are due or overdue.`),
    notifTitle: 'Debt ledger', notifBody: 'An entry in your debt ledger is due.',
    letterBody: 'Debt ledger: an entry is due today. muslims.cc → Debt ledger.',
    serverSet: 'Server reminder set.', reminderOn: 'Reminder on', serverOn: 'Email / phone reminder',
    related: 'Related sections',
  },
  ru: {
    title: 'Книга долгов',
    lead: 'Спокойная личная запись, чтобы не забывать о долгах: кому должны вы и кто должен вам.',
    private: 'Записи остаются только у вас: на этом устройстве, в резервной копии и в зашифрованной синхронизации аккаунта. Ничем не делимся и ни с кем не сравниваем.',
    ayahLead: 'Аят Корана о записи долга на определённый срок и о свидетелях:', ayahShow: 'Показать аят здесь', ayahHide: 'Скрыть аят',
    ayahRead: 'Читать в Коране', ayahLoading: 'Загрузка…', ayahFail: 'Не удалось загрузить аят.',
    addTitle: 'Новая запись', editTitle: 'Изменить запись', kind: 'Вид', kinds: { owe: 'Я должен', owed: 'Мне должны' },
    person: 'Кто?', personPh: 'Имя', amount: 'Сумма', currency: 'Валюта', date: 'Дата долга', due: 'Срок возврата (необязательно)',
    witnesses: 'Свидетели (необязательно)', witnessesHint: `Имена через запятую (не больше ${WITNESS_MAX}).`, note: 'Заметка (необязательно)',
    remind: 'Напомнить в срок возврата', remindHint: 'Если уведомления уже разрешены, придёт уведомление при открытии этой страницы; иначе здесь появится полоса. Разрешение не запрашивается.',
    server: 'Также прислать на почту / телефон в этот день (аккаунт)', serverNote: 'На нашем сервере без шифрования хранятся только дата и текст «в книге долгов наступил срок записи» — без имён и сумм.',
    save: 'Сохранить', update: 'Сохранить изменения', cancel: 'Отмена', edit: 'Изменить', del: 'Удалить',
    confirmDel: 'Удалить эту запись?', yes: 'Да, удалить', no: 'Нет',
    invalid: 'Укажите имя, правильную сумму, валюту и дату.',
    added: 'Запись добавлена.', updated: 'Запись обновлена.', deleted: 'Запись удалена.',
    totals: 'Мои открытые остатки', oweTotal: 'Я должен', owedTotal: 'Мне должны', nothingOpen: 'Открытых долгов нет.',
    list: 'Записи', filters: { open: 'Открытые', settled: 'Закрытые', all: 'Все' }, empty: 'Здесь пока нет записей.',
    owePerson: (p) => `Я должен: ${p}`, owedPerson: (p) => `Мне должен: ${p}`,
    left: (m) => `Осталось: ${m}`, paid: (m) => `Возвращено: ${m}`, of: (m) => `Сумма: ${m}`,
    since: (d) => `Дата: ${d}`, dueOn: (d) => `Срок: ${d}`,
    dueIn: (n) => `До срока ${n} ${ruForm(n, 'день', 'дня', 'дней')}`, dueToday: 'Срок сегодня', overdue: (n) => `Просрочено на ${n} ${ruForm(n, 'день', 'дня', 'дней')}`,
    settledBadge: 'Закрыт', settledOn: (d) => `Закрыт: ${d}`, witnessesList: (w) => `Свидетели: ${w}`,
    repayTitle: 'Частичный возврат', repayAmount: 'Сумма', repayDate: 'Дата', repayAdd: 'Добавить возврат', repayDel: 'Удалить возврат',
    repayTooMuch: 'Эта сумма больше остатка.', repayInvalid: 'Укажите правильную сумму и дату.', repayAdded: 'Возврат записан.', repayRemoved: 'Возврат удалён.',
    settle: 'Отметить как закрытый', reopen: 'Открыть снова', settledMsg: 'Запись закрыта.', reopenedMsg: 'Запись снова открыта.',
    banner: (n) => (n === 1 ? 'Срок одной записи наступил или прошёл.' : `Срок ${n} ${ruForm(n, 'записи', 'записей', 'записей')} наступил или прошёл.`),
    notifTitle: 'Книга долгов', notifBody: 'В книге долгов наступил срок одной записи.',
    letterBody: 'Книга долгов: сегодня срок одной записи. muslims.cc → Книга долгов.',
    serverSet: 'Напоминание на сервере создано.', reminderOn: 'Напоминание включено', serverOn: 'Напоминание на почту / телефон',
    related: 'Связанные разделы',
  },
  ar: {
    title: 'سجل الديون',
    lead: 'سجل هادئ وخاص كي لا تنسى ديونك: ما عليك وما لك.',
    private: 'سجلاتك تبقى عندك: على هذا الجهاز وفي النسخة الاحتياطية وفي مزامنة الحساب المشفّرة. لا يُشارَك شيء ولا يُقارَن.',
    ayahLead: 'آية القرآن في كتابة الدَّين إلى أجل مسمّى والإشهاد عليه:', ayahShow: 'اعرض الآية هنا', ayahHide: 'أخفِ الآية',
    ayahRead: 'اقرأ في المصحف', ayahLoading: 'جارٍ التحميل…', ayahFail: 'تعذّر تحميل الآية.',
    addTitle: 'سجل جديد', editTitle: 'تعديل السجل', kind: 'النوع', kinds: { owe: 'عليّ دَين', owed: 'لي دَين' },
    person: 'مَن؟', personPh: 'الاسم', amount: 'المبلغ', currency: 'العملة', date: 'تاريخ الدَّين', due: 'تاريخ السداد (اختياري)',
    witnesses: 'الشهود (اختياري)', witnessesHint: `افصل الأسماء بفواصل (حتى ${WITNESS_MAX}).`, note: 'ملاحظة (اختياري)',
    remind: 'ذكّرني في تاريخ السداد', remindHint: 'إن كانت الإشعارات مسموحة من قبل فسيصلك إشعار عند فتح هذه الصفحة، وإلا يظهر شريط هنا. لا نطلب الإذن.',
    server: 'أرسله أيضًا إلى بريدي / هاتفي في ذلك اليوم (الحساب)', serverNote: 'لا يُحفظ على خادمنا دون تشفير إلا التاريخ ونص «حلّ موعد سجل في سجل ديونك» — بلا أسماء ولا مبالغ.',
    save: 'حفظ', update: 'حفظ التعديل', cancel: 'إلغاء', edit: 'تعديل', del: 'حذف',
    confirmDel: 'هل تريد حذف هذا السجل؟', yes: 'نعم، احذف', no: 'لا',
    invalid: 'اكتب الاسم ومبلغًا صحيحًا والعملة والتاريخ.',
    added: 'أُضيف السجل.', updated: 'حُدّث السجل.', deleted: 'حُذف السجل.',
    totals: 'أرصدتي المفتوحة', oweTotal: 'عليّ', owedTotal: 'لي', nothingOpen: 'لا ديون مفتوحة.',
    list: 'السجلات', filters: { open: 'مفتوحة', settled: 'مسدَّدة', all: 'الكل' }, empty: 'لا سجلات هنا بعد.',
    owePerson: (p) => `عليّ دَين لـ ${p}`, owedPerson: (p) => `لي دَين على ${p}`,
    left: (m) => `المتبقي: ${m}`, paid: (m) => `المسدَّد: ${m}`, of: (m) => `المبلغ: ${m}`,
    since: (d) => `التاريخ: ${d}`, dueOn: (d) => `السداد: ${d}`,
    dueIn: (n) => `بقي ${arDays(n)}`, dueToday: 'السداد اليوم', overdue: (n) => `متأخر ${arDays(n)}`,
    settledBadge: 'مسدَّد', settledOn: (d) => `سُدّد: ${d}`, witnessesList: (w) => `الشهود: ${w}`,
    repayTitle: 'سداد جزئي', repayAmount: 'المبلغ', repayDate: 'التاريخ', repayAdd: 'أضف السداد', repayDel: 'احذف السداد',
    repayTooMuch: 'هذا المبلغ أكبر من المتبقي.', repayInvalid: 'اكتب مبلغًا وتاريخًا صحيحين.', repayAdded: 'سُجّل السداد.', repayRemoved: 'حُذف السداد.',
    settle: 'علّمه مسدَّدًا', reopen: 'أعد فتحه', settledMsg: 'سُدّد السجل.', reopenedMsg: 'أُعيد فتح السجل.',
    banner: (n) => `حلّ أو فات موعد السداد في ${arEntries(n)}.`,
    notifTitle: 'سجل الديون', notifBody: 'حلّ موعد سداد سجل في سجل ديونك.',
    letterBody: 'سجل الديون: اليوم موعد سداد أحد السجلات. muslims.cc ← سجل الديون.',
    serverSet: 'ضُبط تذكير الخادم.', reminderOn: 'التذكير مفعّل', serverOn: 'تذكير بالبريد / الهاتف',
    related: 'أقسام ذات صلة',
  },
  tr: {
    title: 'Borç defteri',
    lead: 'Borçlarınızı unutmamak için sakin, kişisel bir kayıt: kime borçlusunuz ve kim size borçlu.',
    private: 'Kayıtlar yalnızca sizdedir: bu cihazda, yedekte ve hesabınızın şifreli eşitlemesinde. Hiçbir şey paylaşılmaz ve karşılaştırılmaz.',
    ayahLead: 'Kur’an’da vadeli borcu yazmak ve şahit tutmakla ilgili ayet:', ayahShow: 'Ayeti burada göster', ayahHide: 'Ayeti gizle',
    ayahRead: 'Kur’an’da oku', ayahLoading: 'Yükleniyor…', ayahFail: 'Ayet yüklenemedi.',
    addTitle: 'Yeni kayıt', editTitle: 'Kaydı düzenle', kind: 'Tür', kinds: { owe: 'Ben borçluyum', owed: 'Bana borçlular' },
    person: 'Kim?', personPh: 'Ad', amount: 'Tutar', currency: 'Para birimi', date: 'Borç tarihi', due: 'Ödeme tarihi (isteğe bağlı)',
    witnesses: 'Şahitler (isteğe bağlı)', witnessesHint: `Adları virgülle ayırın (en fazla ${WITNESS_MAX}).`, note: 'Not (isteğe bağlı)',
    remind: 'Ödeme gününde hatırlat', remindHint: 'Bildirimlere zaten izin verildiyse bu sayfayı açınca bildirim gelir; verilmediyse burada bir şerit görünür. İzin istenmez.',
    server: 'O gün e-postama / telefonuma da gönder (hesap)', serverNote: 'Sunucumuzda şifrelenmeden yalnızca tarih ve “borç defterinizde bir kaydın vadesi geldi” metni saklanır — ad ve tutar gitmez.',
    save: 'Kaydet', update: 'Değişikliği kaydet', cancel: 'İptal', edit: 'Düzenle', del: 'Sil',
    confirmDel: 'Bu kayıt silinsin mi?', yes: 'Evet, sil', no: 'Hayır',
    invalid: 'Bir ad, geçerli bir tutar, para birimi ve tarih yazın.',
    added: 'Kayıt eklendi.', updated: 'Kayıt güncellendi.', deleted: 'Kayıt silindi.',
    totals: 'Açık bakiyelerim', oweTotal: 'Borcum', owedTotal: 'Alacağım', nothingOpen: 'Açık borç yok.',
    list: 'Kayıtlar', filters: { open: 'Açık', settled: 'Kapanmış', all: 'Tümü' }, empty: 'Burada henüz kayıt yok.',
    owePerson: (p) => `${p} — ben borçluyum`, owedPerson: (p) => `${p} — bana borçlu`,
    left: (m) => `Kalan: ${m}`, paid: (m) => `Ödenen: ${m}`, of: (m) => `Tutar: ${m}`,
    since: (d) => `Tarih: ${d}`, dueOn: (d) => `Vade: ${d}`,
    dueIn: (n) => `Vadeye ${n} gün var`, dueToday: 'Vade bugün', overdue: (n) => `${n} gün gecikti`,
    settledBadge: 'Kapandı', settledOn: (d) => `Kapandı: ${d}`, witnessesList: (w) => `Şahitler: ${w}`,
    repayTitle: 'Kısmi ödeme', repayAmount: 'Tutar', repayDate: 'Tarih', repayAdd: 'Ödemeyi ekle', repayDel: 'Ödemeyi sil',
    repayTooMuch: 'Bu tutar kalandan fazla.', repayInvalid: 'Geçerli bir tutar ve tarih yazın.', repayAdded: 'Ödeme kaydedildi.', repayRemoved: 'Ödeme silindi.',
    settle: 'Kapandı olarak işaretle', reopen: 'Yeniden aç', settledMsg: 'Kayıt kapandı.', reopenedMsg: 'Kayıt yeniden açıldı.',
    banner: (n) => (n === 1 ? 'Bir kaydın vadesi geldi veya geçti.' : `${n} kaydın vadesi geldi veya geçti.`),
    notifTitle: 'Borç defteri', notifBody: 'Borç defterinizde bir kaydın vadesi geldi.',
    letterBody: 'Borç defteri: bugün bir kaydın vadesi. muslims.cc → Borç defteri.',
    serverSet: 'Sunucu hatırlatması kuruldu.', reminderOn: 'Hatırlatma açık', serverOn: 'E-posta / telefon hatırlatması',
    related: 'İlgili bölümler',
  },
}

const RELATED = [
  { to: 'zakat',
    title: { az: 'Zəkat hesablayıcısı', en: 'Zakat calculator', ru: 'Калькулятор закята', ar: 'حاسبة الزكاة', tr: 'Zekât hesaplayıcı' },
    sub: { az: 'borc və zəkat', en: 'debts and zakat', ru: 'долги и закят', ar: 'الديون والزكاة', tr: 'borçlar ve zekât' } },
  { to: 'inheritance',
    title: { az: 'Miras hesablayıcısı', en: 'Inheritance calculator', ru: 'Калькулятор наследства', ar: 'حاسبة المواريث', tr: 'Miras hesaplayıcı' },
    sub: { az: 'borclar mirasdan əvvəl ödənir', en: 'debts are paid before inheritance', ru: 'долги выплачиваются до раздела наследства', ar: 'تُقضى الديون قبل قسمة التركة', tr: 'borçlar mirastan önce ödenir' } },
  { learn: 'wasiyyah',
    title: { az: 'Vəsiyyət', en: 'Wasiyyah (will)', ru: 'Завещание (васыя)', ar: 'الوصية', tr: 'Vasiyet' },
    sub: { az: 'borcları yazmaq', en: 'writing down debts', ru: 'запись долгов', ar: 'كتابة الديون', tr: 'borçları yazmak' } },
]

const COMMA = new Set(['az', 'ru', 'tr'])
/** Məbləğ → "1 250,50 AZN" (deterministik, Intl yox) */
function fmtMoney(n, cu, lang) {
  const neg = n < 0
  let [i, d] = Math.abs(n).toFixed(2).split('.')
  i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  const num = d === '00' ? i : `${i}${COMMA.has(lang) ? ',' : '.'}${d}`
  return `${neg ? '−' : ''}${num} ${cu}`
}
const splitNames = (s) => String(s || '').split(/[,،;]/).map((x) => x.trim()).filter(Boolean).slice(0, WITNESS_MAX)
const NOTIFIED_KEY = 'mcc_debt_notified'
const EMPTY_FORM = { id: null, k: 'owe', p: '', a: '', cu: 'AZN', d: '', du: '', w: '', no: '', rm: false, srv: false }

export default function DebtLedgerPage({ setPage }) {
  const { lang } = useLang()
  const t = pickUi(T, lang, 'en')
  const navigate = useNavigate()
  const { t: pt } = usePersonalText()
  const { status } = useSignedIn()
  const [data, setData] = useState({ v: 1, l: [] })
  const [ready, setReady] = useState(false)
  const [today, setToday] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [filter, setFilter] = useState('open')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [confirmId, setConfirmId] = useState(null)
  const [repay, setRepay] = useState({ id: null, a: '', d: '', err: '' })
  const [ayah, setAyah] = useState({ open: false, status: 'idle', d: null })
  const [consentKnown, setConsentKnown] = useState(null)
  const [consent, setConsent] = useState(false)
  const formRef = useRef(null)
  const listHeadRef = useRef(null)

  useEffect(() => {
    const load = () => setData(readLedger())
    load()
    const d = localDay()
    setToday(d)
    setForm((f) => (f.d ? f : { ...f, d }))
    setReady(true)
    const onStorage = (e) => { if (!e.key || e.key === DEBT_KEY || e.key.endsWith(`:${DEBT_KEY}`)) load() }
    window.addEventListener('storage', onStorage)
    window.addEventListener(DEBT_EVENT, load)
    window.addEventListener('mcc-profile', load)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(DEBT_EVENT, load)
      window.removeEventListener('mcc-profile', load)
    }
  }, [])

  // Dil dəyişəndə ayə o dilin tərcüməsi ilə yenidən yüklənsin
  useEffect(() => { setAyah({ open: false, status: 'idle', d: null }) }, [lang])

  // Xatırlatma: günü çatmış qeydlər; icazə ARTIQ verilibsə — gündə bir dəfə yerli bildiriş (ad/məbləğ yoxdur)
  const due = useMemo(() => (today ? dueReminders(data, today) : []), [data, today])
  const dueCount = due.length
  useEffect(() => {
    if (!ready || !dueCount || typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    let seen = ''
    try { seen = sessionStorage.getItem(NOTIFIED_KEY) || '' } catch { /* */ }
    if (seen === today) return
    try { sessionStorage.setItem(NOTIFIED_KEY, today) } catch { /* */ }
    showLocalNotification(t.notifTitle, { body: t.notifBody, tag: 'debt-due' }).catch(() => {})
  }, [ready, dueCount, today, t.notifTitle, t.notifBody])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const resetForm = () => { setForm({ ...EMPTY_FORM, d: today }); setConsent(false) }

  // Server xatırlatması ("gələcəyə məktub" sistemi) — razılıqla; xəta yerli qeydi pozmur
  const dropLetter = (lid) => { if (lid) deleteLetter(lid).catch(() => {}) }
  async function syncServer(item, want) {
    const wantNow = want && item.rm && item.du && item.du >= today && !isSettled(item)
    if (!wantNow) {
      if (item.lid) { dropLetter(item.lid); setData(patchDebt(item.id, { lid: undefined }).data) }
      return
    }
    if (item.lid) return
    try {
      const letter = await createLetter({ body: t.letterBody, deliverOn: item.du, kind: 'date', lang, consent: consentKnown !== true ? consent : false })
      setConsentKnown(true)
      if (letter?.id) setData(patchDebt(item.id, { lid: Number(letter.id) }).data)
      setMsg(t.serverSet)
    } catch (e) {
      setErr(pt.err[personalErrorKey(e)] || pt.err.unknown)
    }
  }

  function submit(e) {
    e.preventDefault()
    const amount = parseAmount(form.a)
    const old = form.id ? data.l.find((x) => x.id === form.id) : null
    const dueChanged = old && old.du !== (form.du || undefined)
    // Yeni server xatırlatması yaradılacaqsa — razılıq (bilinmirsə də) tələb olunur
    const newLetter = form.srv && form.rm && form.du && (!old?.lid || dueChanged)
    if (newLetter && status === 'user' && consentKnown !== true && !consent) { setErr(pt.err.consent); return }
    const r = saveDebt({
      id: form.id || undefined, k: form.k, p: form.p, a: amount, cu: form.cu, d: form.d,
      du: form.du || undefined, w: splitNames(form.w), no: form.no, rm: form.rm,
      lid: dueChanged ? undefined : old?.lid,
    })
    if (!r.ok) { setErr(t.invalid); return }
    if (dueChanged && old?.lid) dropLetter(old.lid)
    setErr('')
    setData(r.data)
    setMsg(form.id ? t.updated : t.added)
    if (status === 'user' && (form.srv || r.item.lid)) syncServer(r.item, form.srv)
    resetForm()
  }

  function startEdit(x) {
    setForm({ id: x.id, k: x.k, p: x.p, a: String(x.a), cu: x.cu, d: x.d, du: x.du || '', w: (x.w || []).join(', '), no: x.no || '', rm: Boolean(x.rm), srv: Boolean(x.lid) })
    setErr('')
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ block: 'start' })
      formRef.current?.querySelector('input[type="radio"]:checked')?.focus()
    })
  }
  function doDelete(x) {
    dropLetter(x.lid)
    setData(removeDebt(x.id))
    setConfirmId(null)
    setMsg(t.deleted)
    if (form.id === x.id) resetForm()
    requestAnimationFrame(() => listHeadRef.current?.focus())
  }
  function toggleSettled(x) {
    const on = !x.s
    if (on) dropLetter(x.lid)
    const r = patchDebt(x.id, on ? { s: true, sd: today, lid: undefined } : { s: undefined, sd: undefined })
    setData(r.data)
    setMsg(on ? t.settledMsg : t.reopenedMsg)
  }
  function submitRepay(e, x) {
    e.preventDefault()
    const r = addRepayment(x.id, { d: repay.d || today, a: parseAmount(repay.a) })
    if (!r.ok) { setRepay((p) => ({ ...p, err: r.code === 'tooMuch' ? t.repayTooMuch : t.repayInvalid })); return }
    setData(r.data)
    setRepay({ id: null, a: '', d: '', err: '' })
    setMsg(t.repayAdded)
    if (isSettled(r.item)) dropLetter(r.item.lid)
  }
  function delRepay(x, rid) {
    setData(removeRepayment(x.id, rid).data)
    setMsg(t.repayRemoved)
  }

  async function toggleAyah() {
    if (ayah.open) { setAyah((a) => ({ ...a, open: false })); return }
    if (ayah.d) { setAyah((a) => ({ ...a, open: true })); return }
    setAyah({ open: true, status: 'loading', d: null })
    try {
      const { fetchAyah } = await import('../components/quote/content')
      const d = await fetchAyah(2, 282, lang)
      setAyah({ open: true, status: 'ok', d })
    } catch {
      setAyah({ open: true, status: 'error', d: null })
    }
  }

  const totals = openTotals(data)
  const names = knownNames(data)
  const shown = [...data.l].reverse().filter((x) => (filter === 'all' ? true : filter === 'open' ? !isSettled(x) : isSettled(x)))
  const editing = Boolean(form.id)
  const ayahHref = `${pathFor('quran', lang, 2)}?a=282`
  const ayahRef = `${surahLabel(2, lang)} 2:282`
  const curList = CURRENCIES.includes(form.cu) ? CURRENCIES : [form.cu, ...CURRENCIES]
  const totalLine = (m) => Object.entries(m).map(([cu, v]) => fmtMoney(v, cu, lang)).join(' · ')
  const dueText = (x) => {
    const st = dueState(x, today)
    if (st === 'none') return ''
    const n = daysUntilDue(x, today)
    return st === 'overdue' ? t.overdue(-n) : st === 'today' ? t.dueToday : t.dueIn(n)
  }

  return (
    <div className="dbt-page">
      <header className="ui-page-hero dbt-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <HeroOrnament />
        <div className="ui-container ui-container--narrow">
          <div className="ui-page-hero__text">
            <Breadcrumb setPage={setPage} current={t.title} />
            <span className="ui-eyebrow">{navGroupLabel(navGroupOf('debts'), lang)}</span>
            <h1 className="ui-display">{t.title}</h1>
            <p className="ui-lead">{t.lead}</p>
            <p className="ui-page-hero__how"><Icon name="lock" size={16} /> {t.private}</p>
          </div>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container ui-container--narrow dbt-main">
          <div className="ui-card dbt-ayah">
            <p className="dbt-ayah__lead">{t.ayahLead} <b className="ui-num">{ayahRef}</b></p>
            <div className="dbt-ayah__actions">
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" aria-expanded={ayah.open} aria-controls="dbt-ayah-box" onClick={toggleAyah}>
                <Icon name="quran" size={16} className="ui-btn__icon" /> {ayah.open ? t.ayahHide : t.ayahShow}
              </button>
              <a className="ui-link" href={ayahHref} onClick={(e) => { if (!isPlainClick(e)) return; e.preventDefault(); navigate(ayahHref); window.scrollTo(0, 0) }}>
                {t.ayahRead} <Icon name="chevron" size={14} className="ui-flip-rtl" />
              </a>
            </div>
            <div id="dbt-ayah-box" hidden={!ayah.open}>
              {ayah.status === 'loading' && <p className="dbt-muted">{t.ayahLoading}</p>}
              {ayah.status === 'error' && <p className="dbt-muted">{t.ayahFail}</p>}
              {ayah.status === 'ok' && ayah.d && (
                <figure className="dbt-ayah__fig" data-testid="dbt-ayah">
                  <p className="ui-arabic dbt-ayah__ar" lang="ar" dir="rtl">{ayah.d.ar}</p>
                  {lang !== 'ar' && ayah.d.text && <p className="dbt-ayah__tr" dir="auto">{ayah.d.text}</p>}
                  <figcaption className="dbt-muted">— {ayah.d.ref}{ayah.d.tname ? ` · ${ayah.d.tname}` : ''}</figcaption>
                </figure>
              )}
            </div>
          </div>

          {dueCount > 0 && (
            <div className="dbt-banner" data-testid="dbt-banner">
              <Icon name="bell" size={20} /> <span>{t.banner(dueCount)}</span>
            </div>
          )}

          <section className="ui-card dbt-totals" aria-labelledby="dbt-totals-title">
            <h2 className="ui-title ui-title--sm" id="dbt-totals-title">{t.totals}</h2>
            {ready && !Object.keys(totals.owe).length && !Object.keys(totals.owed).length
              ? <p className="dbt-muted">{t.nothingOpen}</p>
              : (
                <dl className="dbt-totals__dl">
                  {Object.keys(totals.owe).length > 0 && <div><dt>{t.oweTotal}</dt><dd className="ui-num" data-testid="dbt-total-owe">{totalLine(totals.owe)}</dd></div>}
                  {Object.keys(totals.owed).length > 0 && <div><dt>{t.owedTotal}</dt><dd className="ui-num" data-testid="dbt-total-owed">{totalLine(totals.owed)}</dd></div>}
                </dl>
              )}
          </section>

          <form ref={formRef} className="ui-card dbt-form" onSubmit={submit} aria-labelledby="dbt-form-title" noValidate>
            <h2 className="ui-title ui-title--sm" id="dbt-form-title">{editing ? t.editTitle : t.addTitle}</h2>
            <fieldset className="dbt-kinds">
              <legend className="ui-field__label">{t.kind}</legend>
              <div className="dbt-kinds__row">
                {DEBT_KINDS.map((k) => (
                  <label key={k} className={`ui-chip dbt-kind${form.k === k ? ' is-on' : ''}`}>
                    <input type="radio" name="dbt-kind" value={k} checked={form.k === k} onChange={set('k')} className="dbt-kind__input" />
                    <Icon name={k === 'owe' ? 'arrowUp' : 'arrowDown'} size={16} /> <span>{t.kinds[k]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="dbt-grid">
              <label className="ui-field dbt-grid__wide">
                <span className="ui-field__label">{t.person}</span>
                <input className="ui-input" type="text" dir="auto" maxLength={PERSON_MAX} placeholder={t.personPh} value={form.p} onChange={set('p')}
                  list={names.length ? 'dbt-names' : undefined} autoComplete="off" required />
              </label>
              <label className="ui-field">
                <span className="ui-field__label">{t.amount}</span>
                <input className="ui-input ui-num" type="text" inputMode="decimal" autoComplete="off" value={form.a} onChange={set('a')} required />
              </label>
              <label className="ui-field">
                <span className="ui-field__label">{t.currency}</span>
                <select className="ui-input" value={form.cu} onChange={set('cu')}>
                  {curList.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="ui-field">
                <span className="ui-field__label">{t.date}</span>
                <input className="ui-input" type="date" required value={form.d} min="1900-01-01" max="2100-12-31" onChange={set('d')} disabled={!ready} />
              </label>
              <label className="ui-field">
                <span className="ui-field__label">{t.due}</span>
                <input className="ui-input" type="date" value={form.du} min={form.d || '1900-01-01'} max="2100-12-31" onChange={set('du')} disabled={!ready} />
              </label>
            </div>
            {names.length > 0 && <datalist id="dbt-names">{names.map((n) => <option key={n} value={n} />)}</datalist>}
            <label className="ui-field">
              <span className="ui-field__label">{t.witnesses}</span>
              <input className="ui-input" type="text" dir="auto" value={form.w} onChange={set('w')} aria-describedby="dbt-w-hint" autoComplete="off" />
              <span className="dbt-hint" id="dbt-w-hint">{t.witnessesHint}</span>
            </label>
            <label className="ui-field">
              <span className="ui-field__label">{t.note}</span>
              <textarea className="ui-input dbt-note" dir="auto" rows={2} maxLength={NOTE_MAX} value={form.no} onChange={set('no')} />
            </label>

            <div className="dbt-remind">
              <label className="dbt-check">
                <input type="checkbox" checked={form.rm && Boolean(form.du)} disabled={!form.du} onChange={set('rm')} aria-describedby="dbt-rm-hint" data-testid="dbt-remind" />
                <span>{t.remind}</span>
              </label>
              <p className="dbt-hint" id="dbt-rm-hint">{t.remindHint}</p>
              {status === 'user' && form.rm && form.du && (
                <div className="dbt-server">
                  <label className="dbt-check">
                    <input type="checkbox" checked={form.srv} data-testid="dbt-server" aria-describedby="dbt-srv-note"
                      onChange={(e) => {
                        const on = e.target.checked
                        setForm((f) => ({ ...f, srv: on }))
                        if (on && consentKnown === null) listLetters().then((r) => setConsentKnown(Boolean(r.consent))).catch(() => setConsentKnown(false))
                      }} />
                    <span>{t.server}</span>
                  </label>
                  <p className="dbt-hint" id="dbt-srv-note"><Icon name="shield" size={14} /> {t.serverNote}</p>
                  {form.srv && consentKnown !== true && <ConsentBox t={pt} checked={consent} onChange={setConsent} id="dbt-consent" />}
                </div>
              )}
            </div>

            {err && <p className="dbt-error" role="alert">{err}</p>}
            <div className="dbt-form__actions">
              {editing && (
                <button type="button" className="ui-btn ui-btn--ghost" onClick={() => { resetForm(); setErr('') }}>
                  <Icon name="close" className="ui-btn__icon" /> {t.cancel}
                </button>
              )}
              <button type="submit" className="ui-btn ui-btn--primary" disabled={!ready}>
                <Icon name="check" className="ui-btn__icon" /> {editing ? t.update : t.save}
              </button>
            </div>
          </form>

          <p className="ui-sr-only" role="status" aria-live="polite">{msg}</p>

          <section aria-labelledby="dbt-list-title" className="dbt-list-wrap">
            <h2 className="ui-title ui-title--sm" id="dbt-list-title" tabIndex={-1} ref={listHeadRef}>{t.list}</h2>
            <div className="dbt-filters" role="group" aria-labelledby="dbt-list-title">
              {['open', 'settled', 'all'].map((f) => (
                <button key={f} type="button" className="ui-chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>{t.filters[f]}</button>
              ))}
            </div>
            {ready && shown.length === 0 && <p className="dbt-muted">{t.empty}</p>}
            {shown.length > 0 && (
              <ul className="dbt-list">
                {shown.map((x) => {
                  const settled = isSettled(x)
                  const title = x.k === 'owe' ? t.owePerson(x.p) : t.owedPerson(x.p)
                  const dt = dueText(x)
                  const st = dueState(x, today)
                  return (
                    <li key={x.id} className={`ui-card dbt-item${settled ? ' is-settled' : ''}`} data-kind={x.k} data-testid="dbt-item">
                      <div className="dbt-item__top">
                        <p className="dbt-item__title" dir="auto"><strong>{title}</strong></p>
                        {settled
                          ? <span className="dbt-badge dbt-badge--ok">{t.settledBadge}</span>
                          : dt && <span className={`dbt-badge dbt-badge--${st}`}>{dt}</span>}
                      </div>
                      <p className="dbt-item__money ui-num">
                        <b>{t.left(fmtMoney(remaining(x), x.cu, lang))}</b>
                        <span>{t.of(fmtMoney(x.a, x.cu, lang))}</span>
                        {paidOf(x) > 0 && <span>{t.paid(fmtMoney(paidOf(x), x.cu, lang))}</span>}
                      </p>
                      <p className="dbt-item__meta ui-num">
                        <span>{t.since(dayLabel(x.d, lang))}</span>
                        {x.du && <span>{t.dueOn(dayLabel(x.du, lang))}</span>}
                        {x.sd && <span>{t.settledOn(dayLabel(x.sd, lang))}</span>}
                        {x.rm && !settled && <span><Icon name="bell" size={14} /> {t.reminderOn}</span>}
                        {x.lid && !settled && <span><Icon name="mail" size={14} /> {t.serverOn}</span>}
                      </p>
                      {x.w?.length > 0 && <p className="dbt-item__w" dir="auto">{t.witnessesList(x.w.join(', '))}</p>}
                      {x.no && <p className="dbt-item__note" dir="auto">{x.no}</p>}
                      {x.r.length > 0 && (
                        <ul className="dbt-repays" aria-label={t.repayTitle}>
                          {x.r.map((r) => (
                            <li key={r.id} className="ui-num">
                              <span>{dayLabel(r.d, lang)} — {fmtMoney(r.a, x.cu, lang)}</span>
                              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm dbt-icon-btn" onClick={() => delRepay(x, r.id)}
                                aria-label={`${t.repayDel}: ${dayLabel(r.d, lang)}, ${fmtMoney(r.a, x.cu, lang)}`}>
                                <Icon name="trash" size={14} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      {repay.id === x.id && (
                        <form className="dbt-repay-form" onSubmit={(e) => submitRepay(e, x)} aria-label={`${t.repayTitle}: ${title}`} noValidate>
                          <label className="ui-field">
                            <span className="ui-field__label">{t.repayAmount}</span>
                            <input className="ui-input ui-num" type="text" inputMode="decimal" autoComplete="off" value={repay.a} autoFocus
                              onChange={(e) => setRepay((p) => ({ ...p, a: e.target.value, err: '' }))} />
                          </label>
                          <label className="ui-field">
                            <span className="ui-field__label">{t.repayDate}</span>
                            <input className="ui-input" type="date" value={repay.d || today} min={x.d} max="2100-12-31"
                              onChange={(e) => setRepay((p) => ({ ...p, d: e.target.value, err: '' }))} />
                          </label>
                          {repay.err && <p className="dbt-error" role="alert">{repay.err}</p>}
                          <div className="dbt-form__actions">
                            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setRepay({ id: null, a: '', d: '', err: '' })}>{t.cancel}</button>
                            <button type="submit" className="ui-btn ui-btn--primary ui-btn--sm">{t.repayAdd}</button>
                          </div>
                        </form>
                      )}

                      {confirmId === x.id ? (
                        <div className="dbt-item__actions" role="group" aria-label={t.confirmDel}>
                          <span className="dbt-confirm">{t.confirmDel}</span>
                          <button type="button" className="ui-btn ui-btn--sm ui-btn--secondary dbt-danger" onClick={() => doDelete(x)} autoFocus>{t.yes}</button>
                          <button type="button" className="ui-btn ui-btn--sm ui-btn--ghost" onClick={() => setConfirmId(null)}>{t.no}</button>
                        </div>
                      ) : (
                        <div className="dbt-item__actions">
                          {!settled && repay.id !== x.id && (
                            <button type="button" className="ui-btn ui-btn--sm ui-btn--ghost" onClick={() => setRepay({ id: x.id, a: '', d: today, err: '' })}
                              aria-label={`${t.repayAdd}: ${title}`}>
                              <Icon name="plus" size={16} className="ui-btn__icon" /> {t.repayAdd}
                            </button>
                          )}
                          {(x.s || !settled) && (
                            <button type="button" className="ui-btn ui-btn--sm ui-btn--ghost" onClick={() => toggleSettled(x)} aria-label={`${x.s ? t.reopen : t.settle}: ${title}`}>
                              <Icon name={x.s ? 'refresh' : 'check'} size={16} className="ui-btn__icon" /> {x.s ? t.reopen : t.settle}
                            </button>
                          )}
                          <button type="button" className="ui-btn ui-btn--sm ui-btn--ghost" onClick={() => startEdit(x)} aria-label={`${t.edit}: ${title}`}>
                            <Icon name="edit" size={16} className="ui-btn__icon" /> {t.edit}
                          </button>
                          <button type="button" className="ui-btn ui-btn--sm ui-btn--ghost" onClick={() => setConfirmId(x.id)} aria-label={`${t.del}: ${title}`}>
                            <Icon name="trash" size={16} className="ui-btn__icon" /> {t.del}
                          </button>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <h2 className="ui-title ui-title--sm dbt-related-title">{t.related}</h2>
          <RelatedLinks items={RELATED} />
        </div>
      </section>
    </div>
  )
}
