// ═══════════════════════════════════════════════════════
// /account → təhlükəsizlik və məlumat bölmələri (tənbəl chunk; server/security.js, docs/ACCOUNT-SECURITY.md)
//
// • "İki addımlı yoxlama" — TOTP: QR (utils/qrCode — tənbəl) + açar mətni + otpauth keçidi → kodla təsdiq →
//   10 ehtiyat kodu BİR DƏFƏ (yüklə / çap et / kopyala). Bağlamaq və kodları yeniləmək: cari şifrə və ya kod.
// • "Təhlükəsizlik fəaliyyəti" — son 30 hadisə (vaxt, növ, cihaz etiketi, ölkə); "qorunma rejimi" bildirişi.
// • "Mənim məlumatlarım" — harada nə saxlanır: bu cihazda (localStorage, bölmələr üzrə ölçü), şifrəli
//   sinxronizasiyada (ölçü, son sinxron), serverdə açıq (sayları) + "Bütün məlumatımı yüklə" (bir JSON).
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLang } from '../../contexts/LangContext'
import { pickUi } from '../../utils/uiText'
import Icon from '../Icon'
import { AuthMessage, PasswordField, useAuthText } from './AuthUi'
import { safeStorage } from '../../api/userSession'
import {
  disableTwoFactor, enableTwoFactor, errorKey, exportAccount, getDataSummary, listSecurityEvents, refreshMe,
  regenBackupCodes, releaseSecurityHold, setupTwoFactor,
} from '../../api/userAuth'
import { collectBackup, isBackupKey } from '../../utils/userBackup'
import QrImage from './QrImage'
import '../../styles/AccountSecurity.css'

const LABELS = {
  az: {
    tfTitle: 'İki addımlı yoxlama', tfLead: 'Şifrədən (və ya Google-dan) sonra telefonunuzdakı kod tətbiqinin 6 rəqəmli kodu da soruşulur. Passkey ilə giriş kodu soruşmur — passkey özü iki addımlıdır.',
    tfOn: 'Açıqdır', tfOff: 'Bağlıdır', tfEnable: 'İki addımlı yoxlamanı aç', tfPwFirst: 'Davam etmək üçün cari şifrənizi yazın',
    // lang-ok[Authenticator]: tətbiqlərin adları tərcümə olunmur
    tfContinue: 'Davam et', tfScan: '1. Kod tətbiqi ilə (Google Authenticator, Microsoft Authenticator, 2FAS, Aegis…) QR kodu skan edin',
    tfQrAlt: 'İki addımlı yoxlama üçün QR kod', tfManual: 'Skan edə bilmirsinizsə, bu açarı tətbiqə əl ilə yazın:', tfOpenApp: 'Bu cihazdakı tətbiqdə aç',
    tfEnter: '2. Tətbiqin göstərdiyi 6 rəqəmli kodu yazın', tfCode: 'Kod', tfConfirm: 'Təsdiqlə və aç', tfCancel: 'Ləğv et',
    tfEnabled: 'İki addımlı yoxlama açıldı.', tfCodesTitle: 'Ehtiyat kodlarınız', tfCodesLead: 'Telefonunuz əlinizdə olmayanda hər kod bir dəfə girişə yarayır. Onları təhlükəsiz yerdə saxlayın — bir daha göstərilməyəcək.',
    tfDownload: 'Yüklə', tfPrint: 'Çap et', tfCopy: 'Kopyala', tfCopied: 'Kopyalandı.', tfSaved: 'Saxladım',
    tfLeft: 'Qalan ehtiyat kodları: {n}', tfRegen: 'Yeni ehtiyat kodları', tfDisable: 'İki addımlı yoxlamanı bağla',
    tfReauth: 'Təsdiq üçün cari şifrəni və ya tətbiqdəki kodu yazın', tfReauthCode: 'Təsdiq üçün tətbiqdəki kodu və ya ehtiyat kodunu yazın',
    tfPw: 'Cari şifrə', tfDisabled: 'İki addımlı yoxlama bağlandı.', tfFileHead: 'Muslims.cc — iki addımlı yoxlamanın ehtiyat kodları',
    actTitle: 'Təhlükəsizlik fəaliyyəti', actLead: 'Son 30 hadisə (90 gün saxlanır). IP ünvanı saxlanmır — yer yalnız ölkə səviyyəsindədir.',
    actNone: 'Hələ hadisə yoxdur.', actUnknown: 'naməlum cihaz',
    holdTitle: 'Hesab qorunma rejimindədir', holdText: '«Bu mən deyildim» düyməsindən sonra şifrə və Google ilə giriş bağlandı. E-poçtunuza gələn keçidlə yeni şifrə təyin edin. Passkey-ləri və sessiyaları yoxlayıb hər şeyin qaydasında olduğuna əminsinizsə, rejimi buradan da aça bilərsiniz.',
    holdRelease: 'Hər şey qaydasındadır — rejimi aç', holdReleased: 'Qorunma rejimi açıldı.',
    ev: {
      sign_in: 'Giriş', sign_in_new: 'Yeni cihazdan giriş', password_changed: 'Şifrə dəyişdirildi', password_reset: 'Şifrə bərpa edildi',
      twofa_enabled: 'İki addımlı yoxlama açıldı', twofa_disabled: 'İki addımlı yoxlama bağlandı', backup_codes_new: 'Yeni ehtiyat kodları',
      backup_code_used: 'Ehtiyat kodu ilə giriş', twofa_failed: 'Yanlış kodlar — giriş dayandırıldı', passkey_added: 'Passkey əlavə olundu',
      passkey_removed: 'Passkey silindi', not_me: '«Bu mən deyildim» — bütün girişlər bağlandı', hold_released: 'Qorunma rejimi açıldı',
      admin_panel: 'İdarə paneli açıldı',
    },
    m: { password: 'şifrə', google: 'Google', passkey: 'passkey', code: 'kod', backup: 'ehtiyat kodu' },
    dataTitle: 'Mənim məlumatlarım', dataLead: 'Nə harada saxlanır və hamısını bir faylda yükləmək.',
    dDevice: 'Bu cihazda (brauzerin yaddaşı)', dDeviceNote: 'Yalnız bu brauzerdədir. Keş yenidən yüklənə bilər və ehtiyat nüsxəyə düşmür.',
    dKeys: '{n} açar', dTotal: 'Cəmi', dSync: 'Şifrəli sinxronizasiya', dSyncOff: 'Bu cihazda sinxronizasiya bağlıdır.',
    dSyncNote: 'Server bu bloku oxuya bilmir — açar yalnız sizin cihazlarınızdadır.', dSyncLast: 'Son sinxron', dSyncSize: 'Serverdəki şifrəli blok',
    dServer: 'Serverdə (açıq saxlanan)', dServerNote: 'Bunları server oxuya bilir: hesab, girişlər və vaxtında göndərilməli xatırlatmalar.',
    dLoading: 'Yüklənir…', dFailed: 'Serverdəki məlumatın xülasəsini yükləmək alınmadı.',
    rAccount: 'Hesab profili (e-poçt, ad, rol)', rSessions: 'Aktiv sessiyalar', rPasskeys: 'Passkey-lər', rEvents: 'Təhlükəsizlik hadisələri', rDevices: 'Tanınan cihazlar',
    r2fa: 'İki addımlı yoxlama', rLetters: 'Gələcəyə məktublar', rLoved: 'Sevdiklərim üçün dua', rFollow: 'İzləyənlər / izlədiklərim', rZakat: 'Zəkat xatırlatması',
    rPush: 'Bildiriş alan cihazlar', rFamily: 'Ailə dairəsi (üzvlər / kartlar)', rHifz: '«Məni yoxla» keçidləri', rRooms: 'Açıq «Birlikdə oxu» otaqları (yalnız yaddaşda)',
    yes: 'var', no: 'yox',
    dExport: 'Bütün məlumatımı yüklə', dExportNote: 'Bir JSON faylı: serverdəki məlumat (şifrə heşi, açarlar və keçid kodları olmadan) + bu cihazdakı məlumat.',
    dExported: 'Fayl yükləndi.',
    g: { quran: 'Quran və mütaliə', prayer: 'Namaz, oruc, Ramazan', hifz: 'Hifz', dhikr: 'Zikr və dualar', learn: 'Öyrənmə, oyunlar, nişanlar', personal: 'Jurnallar, qeydlər, albomlar', profiles: 'Profillər', settings: 'Tərcihlər (dil, mövzu, şəhər)', other: 'Digər', cache: 'Keş və texniki açarlar' },
  },
  en: {
    tfTitle: 'Two-step verification', tfLead: 'After your password (or Google), you are also asked for the 6-digit code from an authenticator app on your phone. Signing in with a passkey does not ask for a code — a passkey is already two-step.',
    tfOn: 'On', tfOff: 'Off', tfEnable: 'Turn on two-step verification', tfPwFirst: 'Enter your current password to continue',
    tfContinue: 'Continue', tfScan: '1. Scan the QR code with an authenticator app (Google Authenticator, Microsoft Authenticator, 2FAS, Aegis…)',
    tfQrAlt: 'QR code for two-step verification', tfManual: 'If you cannot scan it, type this key into the app:', tfOpenApp: 'Open in an app on this device',
    tfEnter: '2. Enter the 6-digit code shown in the app', tfCode: 'Code', tfConfirm: 'Confirm and turn on', tfCancel: 'Cancel',
    tfEnabled: 'Two-step verification is on.', tfCodesTitle: 'Your backup codes', tfCodesLead: 'Each code works once to sign in when your phone is not at hand. Keep them somewhere safe — they will not be shown again.',
    tfDownload: 'Download', tfPrint: 'Print', tfCopy: 'Copy', tfCopied: 'Copied.', tfSaved: 'I have saved them',
    tfLeft: 'Backup codes left: {n}', tfRegen: 'New backup codes', tfDisable: 'Turn off two-step verification',
    tfReauth: 'To confirm, enter your current password or the code from your app', tfReauthCode: 'To confirm, enter the code from your app or a backup code',
    tfPw: 'Current password', tfDisabled: 'Two-step verification is off.', tfFileHead: 'Muslims.cc — two-step verification backup codes',
    actTitle: 'Security activity', actLead: 'The last 30 events (kept for 90 days). No IP address is stored — location is country only.',
    actNone: 'No events yet.', actUnknown: 'unknown device',
    holdTitle: 'Your account is on security hold', holdText: 'After «This wasn’t me», signing in with a password or Google was blocked. Set a new password with the link we emailed you. If you have checked your passkeys and sessions and everything looks fine, you can also lift the hold here.',
    holdRelease: 'Everything is fine — lift the hold', holdReleased: 'The security hold has been lifted.',
    ev: {
      sign_in: 'Sign-in', sign_in_new: 'Sign-in from a new device', password_changed: 'Password changed', password_reset: 'Password reset',
      twofa_enabled: 'Two-step verification turned on', twofa_disabled: 'Two-step verification turned off', backup_codes_new: 'New backup codes',
      backup_code_used: 'Signed in with a backup code', twofa_failed: 'Wrong codes — sign-in stopped', passkey_added: 'Passkey added',
      passkey_removed: 'Passkey removed', not_me: '«This wasn’t me» — all sessions signed out', hold_released: 'Security hold lifted',
      admin_panel: 'Admin panel opened',
    },
    m: { password: 'password', google: 'Google', passkey: 'passkey', code: 'code', backup: 'backup code' },
    dataTitle: 'My data', dataLead: 'What is stored where, and downloading all of it in one file.',
    dDevice: 'On this device (browser storage)', dDeviceNote: 'Only in this browser. The cache can be downloaded again and is not part of backups.',
    dKeys: '{n} keys', dTotal: 'Total', dSync: 'Encrypted sync', dSyncOff: 'Sync is off on this device.',
    dSyncNote: 'The server cannot read this block — the key is only on your devices.', dSyncLast: 'Last sync', dSyncSize: 'Encrypted block on the server',
    dServer: 'On the server (readable)', dServerNote: 'The server can read these: your account, sign-ins and reminders that must be sent on time.',
    dLoading: 'Loading…', dFailed: 'Could not load the summary of your server data.',
    rAccount: 'Account profile (email, name, role)', rSessions: 'Active sessions', rPasskeys: 'Passkeys', rEvents: 'Security events', rDevices: 'Recognised devices',
    r2fa: 'Two-step verification', rLetters: 'Letters to the future', rLoved: 'Prayers for loved ones', rFollow: 'Followers / following', rZakat: 'Zakat reminder',
    rPush: 'Devices receiving notifications', rFamily: 'Family circle (members / cards)', rHifz: '«Test me» links', rRooms: 'Open «Read together» rooms (memory only)',
    yes: 'yes', no: 'no',
    dExport: 'Download all my data', dExportNote: 'One JSON file: your server data (without password hash, keys or tokens) plus the data on this device.',
    dExported: 'The file has been downloaded.',
    g: { quran: 'Quran and reading', prayer: 'Prayer, fasting, Ramadan', hifz: 'Hifz', dhikr: 'Dhikr and duas', learn: 'Learning, games, badges', personal: 'Journals, notes, albums', profiles: 'Profiles', settings: 'Preferences (language, theme, city)', other: 'Other', cache: 'Cache and technical keys' },
  },
  ru: {
    tfTitle: 'Двухэтапная проверка', tfLead: 'После пароля (или Google) запрашивается ещё 6-значный код из приложения-аутентификатора на телефоне. Вход с ключом доступа код не запрашивает — ключ доступа уже двухэтапный.',
    tfOn: 'Включена', tfOff: 'Отключена', tfEnable: 'Включить двухэтапную проверку', tfPwFirst: 'Чтобы продолжить, введите текущий пароль',
    // lang-ok[Google,Authenticator,Microsoft,2FAS,Aegis]: tətbiqlərin adları tərcümə olunmur
    tfContinue: 'Продолжить', tfScan: '1. Отсканируйте QR-код приложением-аутентификатором (Google Authenticator, Microsoft Authenticator, 2FAS, Aegis…)',
    // lang-ok[QR]: texniki termin
    tfQrAlt: 'QR-код для двухэтапной проверки', tfManual: 'Если не получается отсканировать, введите этот ключ в приложение вручную:', tfOpenApp: 'Открыть в приложении на этом устройстве',
    tfEnter: '2. Введите 6-значный код из приложения', tfCode: 'Код', tfConfirm: 'Подтвердить и включить', tfCancel: 'Отмена',
    tfEnabled: 'Двухэтапная проверка включена.', tfCodesTitle: 'Ваши резервные коды', tfCodesLead: 'Каждый код подходит для одного входа, когда телефона нет под рукой. Храните их в надёжном месте — больше они не будут показаны.',
    tfDownload: 'Скачать', tfPrint: 'Печать', tfCopy: 'Копировать', tfCopied: 'Скопировано.', tfSaved: 'Я сохранил коды',
    tfLeft: 'Осталось резервных кодов: {n}', tfRegen: 'Новые резервные коды', tfDisable: 'Отключить двухэтапную проверку',
    tfReauth: 'Для подтверждения введите текущий пароль или код из приложения', tfReauthCode: 'Для подтверждения введите код из приложения или резервный код',
    tfPw: 'Текущий пароль', tfDisabled: 'Двухэтапная проверка отключена.', tfFileHead: 'Muslims.cc — резервные коды двухэтапной проверки',
    // lang-ok[IP]: texniki termin
    actTitle: 'Действия по безопасности', actLead: 'Последние 30 событий (хранятся 90 дней). IP-адрес не хранится — место указано только до страны.',
    actNone: 'Событий пока нет.', actUnknown: 'неизвестное устройство',
    holdTitle: 'Аккаунт в режиме защиты', holdText: 'После «Это был не я» вход по паролю и через Google заблокирован. Задайте новый пароль по ссылке из письма. Если вы проверили ключи доступа и сеансы и всё в порядке, режим можно снять и здесь.',
    holdRelease: 'Всё в порядке — снять режим', holdReleased: 'Режим защиты снят.',
    ev: {
      sign_in: 'Вход', sign_in_new: 'Вход с нового устройства', password_changed: 'Пароль изменён', password_reset: 'Пароль сброшен',
      twofa_enabled: 'Двухэтапная проверка включена', twofa_disabled: 'Двухэтапная проверка отключена', backup_codes_new: 'Новые резервные коды',
      backup_code_used: 'Вход по резервному коду', twofa_failed: 'Неверные коды — вход остановлен', passkey_added: 'Добавлен ключ доступа',
      passkey_removed: 'Ключ доступа удалён', not_me: '«Это был не я» — все сеансы закрыты', hold_released: 'Режим защиты снят',
      admin_panel: 'Открыта админ-панель',
    },
    m: { password: 'пароль', google: 'Google', passkey: 'ключ доступа', code: 'код', backup: 'резервный код' },
    dataTitle: 'Мои данные', dataLead: 'Что и где хранится, и как скачать всё одним файлом.',
    dDevice: 'На этом устройстве (хранилище браузера)', dDeviceNote: 'Только в этом браузере. Кэш можно загрузить заново, он не входит в резервные копии.',
    dKeys: 'ключей: {n}', dTotal: 'Всего', dSync: 'Зашифрованная синхронизация', dSyncOff: 'На этом устройстве синхронизация отключена.',
    dSyncNote: 'Сервер не может прочитать этот блок — ключ есть только на ваших устройствах.', dSyncLast: 'Последняя синхронизация', dSyncSize: 'Зашифрованный блок на сервере',
    dServer: 'На сервере (в открытом виде)', dServerNote: 'Это сервер может прочитать: аккаунт, входы и напоминания, которые нужно отправить вовремя.',
    dLoading: 'Загрузка…', dFailed: 'Не удалось загрузить сводку данных на сервере.',
    rAccount: 'Профиль аккаунта (почта, имя, роль)', rSessions: 'Активные сеансы', rPasskeys: 'Ключи доступа', rEvents: 'События безопасности', rDevices: 'Знакомые устройства',
    r2fa: 'Двухэтапная проверка', rLetters: 'Письма в будущее', rLoved: 'Дуа за близких', rFollow: 'Подписчики / подписки', rZakat: 'Напоминание о закяте',
    rPush: 'Устройства с уведомлениями', rFamily: 'Семейный круг (участники / открытки)', rHifz: 'Ссылки «Проверь меня»', rRooms: 'Открытые комнаты «Читаем вместе» (только в памяти)',
    yes: 'есть', no: 'нет',
    // lang-ok[JSON]: fayl formatının adı
    dExport: 'Скачать все мои данные', dExportNote: 'Один файл JSON: данные на сервере (без хеша пароля, ключей и токенов) и данные этого устройства.',
    dExported: 'Файл скачан.',
    g: { quran: 'Коран и чтение', prayer: 'Намаз, пост, Рамадан', hifz: 'Хифз', dhikr: 'Зикр и дуа', learn: 'Обучение, игры, значки', personal: 'Дневники, заметки, альбомы', profiles: 'Профили', settings: 'Настройки (язык, тема, город)', other: 'Другое', cache: 'Кэш и технические ключи' },
  },
  tr: {
    tfTitle: 'İki adımlı doğrulama', tfLead: 'Şifrenizden (veya Google’dan) sonra telefonunuzdaki doğrulama uygulamasının 6 haneli kodu da sorulur. Geçiş anahtarıyla girişte kod sorulmaz — geçiş anahtarı zaten iki adımlıdır.',
    tfOn: 'Açık', tfOff: 'Kapalı', tfEnable: 'İki adımlı doğrulamayı aç', tfPwFirst: 'Devam etmek için mevcut şifrenizi girin',
    tfContinue: 'Devam et', tfScan: '1. QR kodunu bir doğrulama uygulamasıyla tarayın (Google Authenticator, Microsoft Authenticator, 2FAS, Aegis…)',
    tfQrAlt: 'İki adımlı doğrulama için QR kodu', tfManual: 'Tarayamıyorsanız bu anahtarı uygulamaya elle yazın:', tfOpenApp: 'Bu cihazdaki uygulamada aç',
    tfEnter: '2. Uygulamada görünen 6 haneli kodu girin', tfCode: 'Kod', tfConfirm: 'Onayla ve aç', tfCancel: 'Vazgeç',
    tfEnabled: 'İki adımlı doğrulama açıldı.', tfCodesTitle: 'Yedek kodlarınız', tfCodesLead: 'Telefonunuz yanınızda değilken her kod bir girişte işe yarar. Güvenli bir yerde saklayın — bir daha gösterilmeyecek.',
    tfDownload: 'İndir', tfPrint: 'Yazdır', tfCopy: 'Kopyala', tfCopied: 'Kopyalandı.', tfSaved: 'Kaydettim',
    tfLeft: 'Kalan yedek kod: {n}', tfRegen: 'Yeni yedek kodlar', tfDisable: 'İki adımlı doğrulamayı kapat',
    tfReauth: 'Onaylamak için mevcut şifrenizi veya uygulamadaki kodu girin', tfReauthCode: 'Onaylamak için uygulamadaki kodu veya bir yedek kodu girin',
    tfPw: 'Mevcut şifre', tfDisabled: 'İki adımlı doğrulama kapatıldı.', tfFileHead: 'Muslims.cc — iki adımlı doğrulama yedek kodları',
    actTitle: 'Güvenlik etkinliği', actLead: 'Son 30 olay (90 gün saklanır). IP adresi saklanmaz — konum yalnızca ülke düzeyindedir.',
    actNone: 'Henüz olay yok.', actUnknown: 'bilinmeyen cihaz',
    holdTitle: 'Hesabınız koruma modunda', holdText: '«Bu ben değildim» düğmesinden sonra şifre ve Google ile giriş engellendi. E-postanıza gelen bağlantıyla yeni şifre belirleyin. Geçiş anahtarlarını ve oturumları kontrol ettiyseniz ve her şey yolundaysa modu buradan da kaldırabilirsiniz.',
    holdRelease: 'Her şey yolunda — modu kaldır', holdReleased: 'Koruma modu kaldırıldı.',
    ev: {
      sign_in: 'Giriş', sign_in_new: 'Yeni cihazdan giriş', password_changed: 'Şifre değiştirildi', password_reset: 'Şifre sıfırlandı',
      twofa_enabled: 'İki adımlı doğrulama açıldı', twofa_disabled: 'İki adımlı doğrulama kapatıldı', backup_codes_new: 'Yeni yedek kodlar',
      backup_code_used: 'Yedek kodla giriş', twofa_failed: 'Yanlış kodlar — giriş durduruldu', passkey_added: 'Geçiş anahtarı eklendi',
      passkey_removed: 'Geçiş anahtarı kaldırıldı', not_me: '«Bu ben değildim» — tüm oturumlar kapatıldı', hold_released: 'Koruma modu kaldırıldı',
      admin_panel: 'Yönetim paneli açıldı',
    },
    m: { password: 'şifre', google: 'Google', passkey: 'geçiş anahtarı', code: 'kod', backup: 'yedek kod' },
    dataTitle: 'Verilerim', dataLead: 'Ne nerede saklanıyor ve hepsini tek dosyada indirmek.',
    dDevice: 'Bu cihazda (tarayıcı depolaması)', dDeviceNote: 'Yalnızca bu tarayıcıda. Önbellek yeniden indirilebilir ve yedeklere dahil değildir.',
    dKeys: '{n} anahtar', dTotal: 'Toplam', dSync: 'Şifreli eşitleme', dSyncOff: 'Bu cihazda eşitleme kapalı.',
    dSyncNote: 'Sunucu bu bloğu okuyamaz — anahtar yalnızca sizin cihazlarınızdadır.', dSyncLast: 'Son eşitleme', dSyncSize: 'Sunucudaki şifreli blok',
    dServer: 'Sunucuda (okunabilir)', dServerNote: 'Sunucu bunları okuyabilir: hesabınız, girişler ve zamanında gönderilmesi gereken hatırlatmalar.',
    dLoading: 'Yükleniyor…', dFailed: 'Sunucudaki verilerin özeti yüklenemedi.',
    rAccount: 'Hesap profili (e-posta, ad, rol)', rSessions: 'Etkin oturumlar', rPasskeys: 'Geçiş anahtarları', rEvents: 'Güvenlik olayları', rDevices: 'Tanınan cihazlar',
    r2fa: 'İki adımlı doğrulama', rLetters: 'Geleceğe mektuplar', rLoved: 'Sevdiklerim için dua', rFollow: 'Takipçiler / takip edilenler', rZakat: 'Zekât hatırlatması',
    rPush: 'Bildirim alan cihazlar', rFamily: 'Aile çevresi (üyeler / kartlar)', rHifz: '«Beni dinle» bağlantıları', rRooms: 'Açık «Birlikte oku» odaları (yalnızca bellekte)',
    yes: 'var', no: 'yok',
    dExport: 'Tüm verilerimi indir', dExportNote: 'Tek bir JSON dosyası: sunucudaki verileriniz (şifre özeti, anahtarlar ve belirteçler olmadan) ve bu cihazdaki veriler.',
    dExported: 'Dosya indirildi.',
    g: { quran: 'Kur’an ve okuma', prayer: 'Namaz, oruç, Ramazan', hifz: 'Hafızlık', dhikr: 'Zikir ve dualar', learn: 'Öğrenme, oyunlar, rozetler', personal: 'Günlükler, notlar, albümler', profiles: 'Profiller', settings: 'Tercihler (dil, tema, şehir)', other: 'Diğer', cache: 'Önbellek ve teknik anahtarlar' },
  },
  ar: {
    tfTitle: 'التحقق بخطوتين', tfLead: 'بعد كلمة المرور (أو Google) يُطلب أيضًا رمز من 6 أرقام من تطبيق المصادقة على هاتفك. الدخول بمفتاح المرور لا يطلب رمزًا — فمفتاح المرور بخطوتين أصلًا.',
    tfOn: 'مفعّل', tfOff: 'غير مفعّل', tfEnable: 'تفعيل التحقق بخطوتين', tfPwFirst: 'أدخل كلمة المرور الحالية للمتابعة',
    // lang-ok[Google,Authenticator,Microsoft,2FAS,Aegis]: tətbiqlərin adları tərcümə olunmur
    tfContinue: 'متابعة', tfScan: '1. امسح رمز QR بتطبيق مصادقة (Google Authenticator أو Microsoft Authenticator أو 2FAS أو Aegis…)',
    // lang-ok[QR]: texniki termin
    tfQrAlt: 'رمز QR للتحقق بخطوتين', tfManual: 'إن تعذّر المسح، فاكتب هذا المفتاح في التطبيق يدويًا:', tfOpenApp: 'افتحه في تطبيق على هذا الجهاز',
    tfEnter: '2. أدخل الرمز المكوّن من 6 أرقام الظاهر في التطبيق', tfCode: 'الرمز', tfConfirm: 'تأكيد وتفعيل', tfCancel: 'إلغاء',
    tfEnabled: 'تم تفعيل التحقق بخطوتين.', tfCodesTitle: 'رموزك الاحتياطية', tfCodesLead: 'كل رمز يصلح لدخول واحد حين لا يكون هاتفك معك. احفظها في مكان آمن — لن تُعرض مرة أخرى.',
    tfDownload: 'تنزيل', tfPrint: 'طباعة', tfCopy: 'نسخ', tfCopied: 'تم النسخ.', tfSaved: 'حفظتُها',
    tfLeft: 'الرموز الاحتياطية المتبقية: {n}', tfRegen: 'رموز احتياطية جديدة', tfDisable: 'إيقاف التحقق بخطوتين',
    tfReauth: 'للتأكيد أدخل كلمة المرور الحالية أو الرمز من التطبيق', tfReauthCode: 'للتأكيد أدخل الرمز من التطبيق أو رمزًا احتياطيًا',
    tfPw: 'كلمة المرور الحالية', tfDisabled: 'تم إيقاف التحقق بخطوتين.', tfFileHead: 'Muslims.cc — الرموز الاحتياطية للتحقق بخطوتين',
    // lang-ok[IP]: texniki termin
    actTitle: 'نشاط الأمان', actLead: 'آخر 30 حدثًا (تُحفظ 90 يومًا). لا يُحفظ عنوان IP — الموقع على مستوى الدولة فقط.',
    actNone: 'لا توجد أحداث بعد.', actUnknown: 'جهاز غير معروف',
    holdTitle: 'حسابك في وضع الحماية', holdText: 'بعد «لم أكن أنا» أُوقف الدخول بكلمة المرور أو Google. عيّن كلمة مرور جديدة عبر الرابط المرسل إلى بريدك. إن راجعت مفاتيح المرور والجلسات وكان كل شيء سليمًا، يمكنك رفع الوضع من هنا أيضًا.',
    holdRelease: 'كل شيء سليم — ارفع الوضع', holdReleased: 'رُفع وضع الحماية.',
    ev: {
      sign_in: 'تسجيل دخول', sign_in_new: 'دخول من جهاز جديد', password_changed: 'تغيير كلمة المرور', password_reset: 'إعادة تعيين كلمة المرور',
      twofa_enabled: 'تفعيل التحقق بخطوتين', twofa_disabled: 'إيقاف التحقق بخطوتين', backup_codes_new: 'رموز احتياطية جديدة',
      backup_code_used: 'دخول برمز احتياطي', twofa_failed: 'رموز خاطئة — أُوقف الدخول', passkey_added: 'إضافة مفتاح مرور',
      passkey_removed: 'حذف مفتاح مرور', not_me: '«لم أكن أنا» — أُغلقت جميع الجلسات', hold_released: 'رفع وضع الحماية',
      admin_panel: 'فُتحت لوحة الإدارة',
    },
    m: { password: 'كلمة المرور', google: 'Google', passkey: 'مفتاح المرور', code: 'رمز', backup: 'رمز احتياطي' },
    dataTitle: 'بياناتي', dataLead: 'ما الذي يُحفظ وأين، وتنزيله كله في ملف واحد.',
    dDevice: 'على هذا الجهاز (تخزين المتصفح)', dDeviceNote: 'في هذا المتصفح فقط. يمكن تنزيل ذاكرة التخزين المؤقت من جديد، ولا تدخل في النسخ الاحتياطية.',
    dKeys: '{n} مفتاح', dTotal: 'المجموع', dSync: 'المزامنة المشفّرة', dSyncOff: 'المزامنة متوقفة على هذا الجهاز.',
    dSyncNote: 'لا يستطيع الخادم قراءة هذه الكتلة — المفتاح على أجهزتك فقط.', dSyncLast: 'آخر مزامنة', dSyncSize: 'الكتلة المشفّرة على الخادم',
    dServer: 'على الخادم (مقروءة)', dServerNote: 'يستطيع الخادم قراءة هذه: حسابك وعمليات الدخول والتذكيرات التي يجب إرسالها في وقتها.',
    dLoading: 'جارٍ التحميل…', dFailed: 'تعذّر تحميل ملخص بياناتك على الخادم.',
    rAccount: 'ملف الحساب (البريد، الاسم، الدور)', rSessions: 'الجلسات النشطة', rPasskeys: 'مفاتيح المرور', rEvents: 'أحداث الأمان', rDevices: 'الأجهزة المعروفة',
    r2fa: 'التحقق بخطوتين', rLetters: 'رسائل إلى المستقبل', rLoved: 'الدعاء لأحبّتي', rFollow: 'المتابِعون / المتابَعون', rZakat: 'تذكير الزكاة',
    rPush: 'الأجهزة التي تتلقى الإشعارات', rFamily: 'دائرة العائلة (الأعضاء / البطاقات)', rHifz: 'روابط «اختبرني»', rRooms: 'غرف «لنقرأ معًا» المفتوحة (في الذاكرة فقط)',
    yes: 'نعم', no: 'لا',
    // lang-ok[JSON]: fayl formatının adı
    dExport: 'تنزيل كل بياناتي', dExportNote: 'ملف JSON واحد: بياناتك على الخادم (دون تجزئة كلمة المرور أو المفاتيح أو الرموز المميزة) مع بيانات هذا الجهاز.',
    dExported: 'تم تنزيل الملف.',
    g: { quran: 'القرآن والقراءة', prayer: 'الصلاة والصيام ورمضان', hifz: 'الحفظ', dhikr: 'الذكر والأدعية', learn: 'التعلّم والألعاب والشارات', personal: 'اليوميات والملاحظات والألبومات', profiles: 'الملفات الشخصية', settings: 'التفضيلات (اللغة، المظهر، المدينة)', other: 'أخرى', cache: 'ذاكرة مؤقتة ومفاتيح تقنية' },
  },
}

// localStorage açarı → bölmə (ilk uyğun gələn). Keş/texniki açarlar (ehtiyat nüsxəyə düşməyənlər) — "cache".
const GROUPS = [
  ['profiles', /^mcc_profile/],
  ['hifz', /hifz/i],
  ['quran', /quran|mushaf|tafsir|surah|ayah|khatm|bookmark|qm_q/i],
  ['prayer', /prayer|qada|azan|fast|ramadan|iftar|sunnah|jamaat|hayd|sahur/i],
  ['dhikr', /dhikr|dua|names|tasbih|hisn|salawat|palms/i],
  ['learn', /lesson|course|arabic|badge|storybook|path|quiz|game|passport|sahaba|journey|hajj|race|memory|letter_catch|kids/i],
  ['personal', /journal|muhasabah|note|zakat|charity|sadaq|mosque|album|capsule|mudd|checklist|group/i],
  ['settings', /lang|theme|city|cities|notif|motion|a11y|sound|prefs|font|translation|sidenav|weather|audio|offline|announce/i],
]
const groupOf = (k) => (isBackupKey(k) ? (GROUPS.find(([, re]) => re.test(k)) || ['other'])[0] : 'cache')

function localGroups() {
  const s = safeStorage()
  const out = {}
  let total = 0
  if (!s) return { groups: [], total }
  try {
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i)
      const v = s.getItem(k) || ''
      const bytes = (k.length + v.length) * 2          // UTF-16
      const g = groupOf(k)
      out[g] = out[g] || { id: g, keys: 0, bytes: 0 }
      out[g].keys++
      out[g].bytes += bytes
      total += bytes
    }
  } catch { /* yaddaş bağlıdır */ }
  return { groups: Object.values(out).sort((a, b) => b.bytes - a.bytes), total }
}

const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (m, k) => (vars[k] == null ? m : String(vars[k])))

function useSizeFmt(lang) {
  return useMemo(() => {
    let nf = null
    try { nf = new Intl.NumberFormat(lang === 'az' ? 'az-Latn-AZ' : lang, { maximumFractionDigits: 1 }) } catch { /* */ }
    return (b) => {
      const kb = b / 1024
      const n = (x) => (nf ? nf.format(x) : x.toFixed(1))
      return kb >= 1024 ? `${n(kb / 1024)} MB` : `${n(Math.max(0.1, kb))} KB`
    }
  }, [lang])
}

function Section({ icon, title, lead, children, id, badge = null }) {
  return (
    <section className="ui-card acc-section" aria-labelledby={id}>
      <header className="acc-section__head">
        <span className="ui-icon-tile"><Icon name={icon} size={20} /></span>
        <div>
          <h2 className="acc-section__title" id={id}>{title} {badge}</h2>
          {lead && <p className="acc-section__lead">{lead}</p>}
        </div>
      </header>
      {children}
    </section>
  )
}

function useAction(errText) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const seq = useRef(0)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  const show = useCallback((tone, text) => setMsg({ tone, text, seq: ++seq.current }), [])
  const run = async (fn, okText) => {
    if (busy) return false
    setBusy(true)
    setMsg(null)
    try {
      await fn()
      if (alive.current && okText) show('ok', okText)
      return true
    } catch (e) {
      if (alive.current) show('bad', errText(errorKey(e)))
      return false
    } finally { if (alive.current) setBusy(false) }
  }
  return { busy, msg, show, run, setMsg, alive }
}

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
const today = () => new Date().toISOString().slice(0, 10)

export default function SecuritySections({ user, fmt }) {
  const { lang } = useLang()
  const l = pickUi(LABELS, lang, 'en')
  const { t, errText } = useAuthText()
  return (
    <>
      <TwoFactorSection l={l} t={t} errText={errText} user={user} lang={lang} />
      <ActivitySection l={l} errText={errText} user={user} fmt={fmt} lang={lang} />
      <MyDataSection l={l} errText={errText} fmt={fmt} lang={lang} />
    </>
  )
}

// ── İki addımlı yoxlama ──
function CodeInput({ id, label, value, onChange, backup = false, describedBy }) {
  return (
    <div className="ui-field acc-field">
      <label className="ui-field__label" htmlFor={id}>{label}</label>
      <input id={id} className="ui-input acc-sec-code" value={value} onChange={(e) => onChange(e.target.value)}
        inputMode={backup ? 'text' : 'numeric'} autoComplete="one-time-code" pattern={backup ? undefined : '[0-9]*'}
        maxLength={backup ? 11 : 6} spellCheck={false} autoCapitalize="off" aria-describedby={describedBy} dir="ltr" />
    </div>
  )
}

function BackupCodes({ l, codes, onDone }) {
  const [copied, setCopied] = useState(false)
  const text = `${l.tfFileHead}\n${today()}\n\n${codes.join('\n')}\n`
  const onPrint = () => {
    const root = document.documentElement
    root.classList.add('acc-print-codes')
    const off = () => { root.classList.remove('acc-print-codes'); window.removeEventListener('afterprint', off) }
    window.addEventListener('afterprint', off)
    try { window.print() } finally { setTimeout(off, 1500) }
  }
  const onCopy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true) } catch { /* icazə yoxdur */ }
  }
  return (
    <div className="ui-callout ui-callout--note acc-sec-codes" data-testid="backup-codes">
      <Icon name="key" />
      <div>
        <strong className="ui-callout__title">{l.tfCodesTitle}</strong>
        <p>{l.tfCodesLead}</p>
        <ol className="acc-sec-codes__list" dir="ltr">{codes.map((c) => <li key={c}><code>{c}</code></li>)}</ol>
        <div className="acc-row acc-sec-noprint">
          <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => download(`muslims-cc-backup-codes-${today()}.txt`, text, 'text/plain')}>
            <Icon name="download" className="ui-btn__icon" /> {l.tfDownload}
          </button>
          <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={onPrint}>{l.tfPrint}</button>
          <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={onCopy}>
            <Icon name="copy" className="ui-btn__icon" /> {l.tfCopy}
          </button>
          <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={onDone}>{l.tfSaved}</button>
        </div>
        <p className="acc-empty" aria-live="polite">{copied ? l.tfCopied : ''}</p>
      </div>
    </div>
  )
}

function TwoFactorSection({ l, t, errText, user, lang }) {
  const tf = user.twoFactor || { enabled: false, backupCodesLeft: 0 }
  const a = useAction(errText)
  const [step, setStep] = useState('idle')        // idle | password | setup | codes | reauth-disable | reauth-regen
  const [pw, setPw] = useState('')
  const [code, setCode] = useState('')
  const [setup, setSetup] = useState(null)
  const [codes, setCodes] = useState(null)
  const reset = () => { setStep('idle'); setPw(''); setCode(''); setSetup(null); a.setMsg(null) }

  const begin = async (e) => {
    e && e.preventDefault()
    if (user.hasPassword && step !== 'password') { setStep('password'); return }
    await a.run(async () => {
      const r = await setupTwoFactor(user.hasPassword ? pw : '')
      setSetup(r); setPw(''); setStep('setup')
    })
  }
  const confirm = async (e) => {
    e.preventDefault()
    await a.run(async () => {
      const list = await enableTwoFactor(code, lang)
      setCodes(list); setCode(''); setSetup(null); setStep('codes')
      await refreshMe().catch(() => {})
    }, l.tfEnabled)
  }
  const reauthBody = () => (pw ? { password: pw } : /^\d{6}$/.test(code.replace(/\s+/g, '')) ? { code: code.replace(/\s+/g, '') } : { backupCode: code.trim() })
  const doReauth = async (e) => {
    e.preventDefault()
    const body = reauthBody()
    if (step === 'reauth-disable') {
      const ok = await a.run(async () => { await disableTwoFactor(body, lang); await refreshMe().catch(() => {}) }, l.tfDisabled)
      if (ok) { setStep('idle'); setPw(''); setCode('') }
    } else {
      await a.run(async () => {
        const list = await regenBackupCodes(body, lang)
        setCodes(list); setPw(''); setCode(''); setStep('codes')
        await refreshMe().catch(() => {})
      })
    }
  }
  const groups = setup ? setup.secret.match(/.{1,4}/g).join(' ') : ''
  const badge = <span className={`ui-badge ${tf.enabled ? 'ui-badge--ok' : 'ui-badge--outline'}`} data-testid="twofa-status">{tf.enabled ? l.tfOn : l.tfOff}</span>

  return (
    <Section icon="shield" title={l.tfTitle} lead={l.tfLead} id="acc-2fa" badge={badge}>
      {step === 'codes' && codes && <BackupCodes l={l} codes={codes} onDone={() => { setCodes(null); setStep('idle'); a.setMsg(null) }} />}

      {!tf.enabled && step === 'idle' && (
        <div><button type="button" className="ui-btn ui-btn--primary" onClick={begin} disabled={a.busy}><Icon name="shield" className="ui-btn__icon" /> {l.tfEnable}</button></div>
      )}
      {step === 'password' && (
        <form className="acc-form" onSubmit={begin} noValidate>
          <input type="email" name="username" autoComplete="username" value={user.email || ''} readOnly hidden />
          <PasswordField label={l.tfPwFirst} value={pw} onChange={setPw} autoComplete="current-password" name="tf-password" autoFocus />
          <div className="acc-row">
            <button type="submit" className="ui-btn ui-btn--primary" disabled={a.busy || !pw}>{a.busy ? t.busy : l.tfContinue}</button>
            <button type="button" className="ui-btn ui-btn--ghost" onClick={reset}>{l.tfCancel}</button>
          </div>
        </form>
      )}
      {step === 'setup' && setup && (
        <form className="acc-form acc-sec-setup" onSubmit={confirm} noValidate>
          <p className="acc-sec-step">{l.tfScan}</p>
          <div className="acc-sec-qrwrap">
            <QrImage text={setup.uri} alt={l.tfQrAlt} />
            <div className="acc-sec-manual">
              <p>{l.tfManual}</p>
              <p><code className="acc-sec-secret" dir="ltr" data-testid="totp-secret">{groups}</code></p>
              <p><a className="ui-link" href={setup.uri}>{l.tfOpenApp}</a></p>
            </div>
          </div>
          <p className="acc-sec-step" id="tf-enter-hint">{l.tfEnter}</p>
          <CodeInput id="tf-code" label={l.tfCode} value={code} onChange={setCode} describedBy="tf-enter-hint" />
          <div className="acc-row">
            <button type="submit" className="ui-btn ui-btn--primary" disabled={a.busy || code.replace(/\s+/g, '').length !== 6}>{a.busy ? t.busy : l.tfConfirm}</button>
            <button type="button" className="ui-btn ui-btn--ghost" onClick={reset}>{l.tfCancel}</button>
          </div>
        </form>
      )}
      {tf.enabled && step === 'idle' && (
        <>
          <p className="acc-empty" data-testid="backup-left">{fill(l.tfLeft, { n: tf.backupCodesLeft })}</p>
          <div className="acc-row">
            <button type="button" className="ui-btn ui-btn--secondary" onClick={() => { a.setMsg(null); setStep('reauth-regen') }}><Icon name="refresh" className="ui-btn__icon" /> {l.tfRegen}</button>
            <button type="button" className="ui-btn ui-btn--ghost" onClick={() => { a.setMsg(null); setStep('reauth-disable') }}>{l.tfDisable}</button>
          </div>
        </>
      )}
      {(step === 'reauth-disable' || step === 'reauth-regen') && (
        <form className="acc-form" onSubmit={doReauth} noValidate>
          <p className="acc-sec-step" id="tf-reauth-hint">{user.hasPassword ? l.tfReauth : l.tfReauthCode}</p>
          {user.hasPassword && (
            <>
              <input type="email" name="username" autoComplete="username" value={user.email || ''} readOnly hidden />
              <PasswordField label={l.tfPw} value={pw} onChange={(v) => { setPw(v); if (v) setCode('') }} autoComplete="current-password" name="tf-reauth-password" />
            </>
          )}
          <CodeInput id="tf-reauth-code" label={l.tfCode} value={code} onChange={(v) => { setCode(v); if (v) setPw('') }} backup describedBy="tf-reauth-hint" />
          <div className="acc-row">
            <button type="submit" className={`ui-btn ${step === 'reauth-disable' ? 'acc-btn-danger' : 'ui-btn--primary'}`} disabled={a.busy || (!pw && !code.trim())}>
              {a.busy ? t.busy : step === 'reauth-disable' ? l.tfDisable : l.tfRegen}
            </button>
            <button type="button" className="ui-btn ui-btn--ghost" onClick={reset}>{l.tfCancel}</button>
          </div>
        </form>
      )}
      <AuthMessage msg={a.msg} />
    </Section>
  )
}

// ── Təhlükəsizlik fəaliyyəti ──
function ActivitySection({ l, errText, user, fmt, lang }) {
  const [data, setData] = useState(null)
  const a = useAction(errText)
  const load = useCallback(() => listSecurityEvents().then(setData).catch(() => setData({ events: [], hold: null })), [])
  useEffect(() => { load() }, [load, user.twoFactor?.enabled])
  const country = useMemo(() => {
    // Brauzerdə dilin bölgə adları yoxdursa (məs. az) of() kodu qaytarır — onda ingiliscə ad
    const mk = (l) => { try { return new Intl.DisplayNames([l], { type: 'region' }) } catch { return null } }
    const dn = mk(lang === 'az' ? 'az-Latn-AZ' : lang), en = mk('en')
    return (c) => {
      if (!c) return ''
      try { const v = dn ? dn.of(c) : c; return v && v !== c ? v : (en ? en.of(c) : c) } catch { return c }
    }
  }, [lang])
  const method = (m) => {
    if (!m) return ''
    const [base, extra] = String(m).split('+')
    const parts = [l.m[base] || base]
    if (extra === '2fa') parts.push(l.m.code)
    if (extra === 'backup') parts.push(l.m.backup)
    return parts.filter(Boolean).join(' + ')
  }
  const hold = data ? data.hold : (user.securityHold ? Date.now() : null)
  const onRelease = async () => {
    await a.run(async () => { await releaseSecurityHold(); await refreshMe().catch(() => {}); await load() }, l.holdReleased)
  }
  return (
    <Section icon="clock" title={l.actTitle} lead={l.actLead} id="acc-activity">
      {hold != null && (
        <div className="ui-callout ui-callout--warn" role="status" data-testid="security-hold">
          <Icon name="alert" />
          <div>
            <strong className="ui-callout__title">{l.holdTitle}</strong>
            <p>{l.holdText}</p>
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={onRelease} disabled={a.busy}>{l.holdRelease}</button>
          </div>
        </div>
      )}
      {data === null ? <div className="spinner-wrap"><div className="spinner" /></div>
        : data.events.length === 0 ? <p className="acc-empty">{l.actNone}</p>
          : (
            <ul className="acc-list" data-testid="security-events">
              {data.events.map((e) => (
                <li key={e.id} className="acc-list__item">
                  <span className={`ui-icon-tile ui-icon-tile--sm ${/new|failed|not_me|removed|disabled/.test(e.kind) ? 'acc-sec-tile--warn' : 'ui-icon-tile--neutral'}`}>
                    <Icon name={/passkey/.test(e.kind) ? 'key' : /password/.test(e.kind) ? 'lock' : /sign_in|backup_code_used/.test(e.kind) ? 'enter' : 'shield'} size={16} className={/sign_in/.test(e.kind) ? 'ui-flip-rtl' : undefined} />
                  </span>
                  <div className="acc-list__main">
                    <strong>{l.ev[e.kind] || e.kind}{e.method ? <span className="acc-list__meta"> · {method(e.method)}</span> : null}</strong>
                    <span className="acc-list__meta">
                      <time dateTime={new Date(e.at).toISOString()}>{fmt(e.at)}</time>
                      {' · '}<bdi>{e.label || l.actUnknown}</bdi>
                      {e.country ? <> · {country(e.country)}</> : null}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
      <AuthMessage msg={a.msg} />
    </Section>
  )
}

// ── Mənim məlumatlarım ──
function readSyncState() {
  try { const v = JSON.parse(safeStorage()?.getItem('muslim_cc_sync') || 'null'); return v && typeof v === 'object' ? v : null } catch { return null }
}

function MyDataSection({ l, errText, fmt, lang }) {
  const size = useSizeFmt(lang)
  const [local] = useState(localGroups)
  const [sum, setSum] = useState(null)        // null — yüklənir, false — alınmadı
  const a = useAction(errText)
  useEffect(() => { getDataSummary().then(setSum).catch(() => setSum(false)) }, [])
  const sync = readSyncState()

  const onExport = async () => {
    await a.run(async () => {
      const server = await exportAccount()
      const device = collectBackup()
      const file = { kind: 'muslims.cc/my-data', version: 1, exportedAt: new Date().toISOString(), server, device }
      download(`muslims-cc-my-data-${today()}.json`, JSON.stringify(file, null, 2), 'application/json')
    }, l.dExported)
  }

  const yn = (b) => (b ? l.yes : l.no)
  const rows = sum ? [
    [l.rAccount, '1'],
    [l.rSessions, sum.account?.sessions],
    [l.rPasskeys, sum.account?.passkeys],
    [l.rEvents, sum.security?.events],
    [l.rDevices, sum.security?.devices],
    [l.r2fa, yn(sum.security?.twoFactor)],
    sum.personal && [l.rLetters, sum.personal.letters],
    sum.personal && [l.rLoved, sum.personal.loved],
    sum.personal && [l.rFollow, `${sum.personal.followers} / ${sum.personal.following}`],
    sum.personal && [l.rZakat, yn(sum.personal.zakat)],
    sum.personal && [l.rPush, sum.personal.pushDevices],
    sum.family && [l.rFamily, `${sum.family.members} / ${sum.family.cards}`],
    sum.hifzTests && [l.rHifz, sum.hifzTests.tests],
    sum.readTogether && [l.rRooms, sum.readTogether.openRooms],
  ].filter(Boolean) : []

  return (
    <Section icon="download" title={l.dataTitle} lead={l.dataLead} id="acc-mydata">
      <div className="acc-sec-data">
        <h3 className="acc-sec-h3"><Icon name="device" size={18} /> {l.dDevice}</h3>
        <p className="acc-empty">{l.dDeviceNote}</p>
        <table className="acc-sec-table" data-testid="local-data">
          <tbody>
            {local.groups.map((g) => (
              <tr key={g.id}><th scope="row">{l.g[g.id] || g.id}</th><td>{fill(l.dKeys, { n: g.keys })}</td><td>{size(g.bytes)}</td></tr>
            ))}
            <tr className="acc-sec-total"><th scope="row">{l.dTotal}</th><td /><td>{size(local.total)}</td></tr>
          </tbody>
        </table>

        <h3 className="acc-sec-h3"><Icon name="lock" size={18} /> {l.dSync}</h3>
        {sync || (sum && sum.sync && sum.sync.linked) ? (
          <dl className="ui-kv acc-kv">
            {sync && sync.syncedAt && <div><dt>{l.dSyncLast}</dt><dd>{fmt(Date.parse(sync.syncedAt))}</dd></div>}
            {sum && sum.sync && sum.sync.blobSize > 0 && <div><dt>{l.dSyncSize}</dt><dd>{size(sum.sync.blobSize)}</dd></div>}
          </dl>
        ) : <p className="acc-empty">{l.dSyncOff}</p>}
        <p className="acc-empty">{l.dSyncNote}</p>

        <h3 className="acc-sec-h3"><Icon name="globe" size={18} /> {l.dServer}</h3>
        <p className="acc-empty">{l.dServerNote}</p>
        {sum === null ? <p className="acc-empty" role="status">{l.dLoading}</p>
          : sum === false ? <p className="acc-empty">{l.dFailed}</p>
            : (
              <table className="acc-sec-table" data-testid="server-data">
                <tbody>{rows.map(([k, v]) => <tr key={k}><th scope="row">{k}</th><td colSpan={2}>{v ?? 0}</td></tr>)}</tbody>
              </table>
            )}
      </div>
      <div>
        <button type="button" className="ui-btn ui-btn--primary" onClick={onExport} disabled={a.busy} aria-describedby="acc-export-note">
          <Icon name="download" className="ui-btn__icon" /> {l.dExport}
        </button>
        <p className="acc-empty acc-sec-note" id="acc-export-note">{l.dExportNote}</p>
      </div>
      <AuthMessage msg={a.msg} />
    </Section>
  )
}
