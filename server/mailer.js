// ═══════════════════════════════════════════════════════════════════════
// E-poçt göndərişi — Resend HTTP API (https://api.resend.com/emails), asılılıqsız
//
// • env RESEND_API_KEY yoxdursa: bir dəfə loga yazılır və heç nə göndərilmir
//   (hesablar işləyir, sadəcə email_verified=0 qalır). Testlər üçün
//   onMessage(msg) qarmağı — açar yoxdursa "göndərilən" məktubu ona verir.
// • Göndərən: noreply@muslims.cc (domen Resend-də təsdiqlənməlidir — docs/USER-ACCOUNTS.md).
// • Şablonlar: verify | reset | exists — 5 dil (az/en/ru/tr/ar), qalanları en.
//   Mətn + sadə HTML; dəyişənlər HTML-escape olunur. Logda alıcı ünvanı və
//   token YOXDUR (yalnız şablon adı və HTTP statusu).
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const RESEND_URL = 'https://api.resend.com/emails'
const DEFAULT_FROM = 'Muslims.cc <noreply@muslims.cc>'
const LANGS = ['az', 'en', 'ru', 'tr', 'ar']

const T = {
  verify: {
    az: { subject: 'E-poçtunuzu təsdiqləyin — Muslims.cc', intro: 'Muslims.cc hesabınızı təsdiqləmək üçün aşağıdakı keçidə basın:', button: 'E-poçtu təsdiqlə', note: 'Keçid 24 saat etibarlıdır. Bu hesabı siz yaratmamısınızsa, məktuba məhəl qoymayın.' },
    en: { subject: 'Confirm your email — Muslims.cc', intro: 'Click the link below to confirm your Muslims.cc account:', button: 'Confirm email', note: 'The link is valid for 24 hours. If you did not create this account, you can ignore this email.' },
    ru: { subject: 'Подтвердите e-mail — Muslims.cc', intro: 'Нажмите на ссылку ниже, чтобы подтвердить аккаунт Muslims.cc:', button: 'Подтвердить e-mail', note: 'Ссылка действительна 24 часа. Если вы не создавали этот аккаунт, просто проигнорируйте письмо.' },
    tr: { subject: 'E-postanızı doğrulayın — Muslims.cc', intro: 'Muslims.cc hesabınızı doğrulamak için aşağıdaki bağlantıya tıklayın:', button: 'E-postayı doğrula', note: 'Bağlantı 24 saat geçerlidir. Bu hesabı siz oluşturmadıysanız bu e-postayı yok sayabilirsiniz.' },
    ar: { subject: 'أكِّد بريدك الإلكتروني — Muslims.cc', intro: 'اضغط على الرابط أدناه لتأكيد حسابك في Muslims.cc:', button: 'تأكيد البريد', note: 'الرابط صالح لمدة 24 ساعة. إن لم تُنشئ هذا الحساب فتجاهل هذه الرسالة.' },
  },
  reset: {
    az: { subject: 'Şifrəni bərpa et — Muslims.cc', intro: 'Muslims.cc hesabınız üçün şifrə bərpası istənilib. Yeni şifrə qoymaq üçün keçidə basın:', button: 'Yeni şifrə qoy', note: 'Keçid 1 saat etibarlıdır. Bunu siz istəməmisinizsə, məktuba məhəl qoymayın — şifrəniz dəyişməyəcək.' },
    en: { subject: 'Reset your password — Muslims.cc', intro: 'A password reset was requested for your Muslims.cc account. Click the link to set a new password:', button: 'Set a new password', note: 'The link is valid for 1 hour. If you did not request this, ignore this email — your password will not change.' },
    ru: { subject: 'Сброс пароля — Muslims.cc', intro: 'Для вашего аккаунта Muslims.cc запрошен сброс пароля. Нажмите на ссылку, чтобы задать новый пароль:', button: 'Задать новый пароль', note: 'Ссылка действительна 1 час. Если вы этого не запрашивали, проигнорируйте письмо — пароль не изменится.' },
    tr: { subject: 'Şifrenizi sıfırlayın — Muslims.cc', intro: 'Muslims.cc hesabınız için şifre sıfırlama istendi. Yeni şifre belirlemek için bağlantıya tıklayın:', button: 'Yeni şifre belirle', note: 'Bağlantı 1 saat geçerlidir. Bunu siz istemediyseniz bu e-postayı yok sayın — şifreniz değişmeyecek.' },
    ar: { subject: 'إعادة تعيين كلمة المرور — Muslims.cc', intro: 'طُلبت إعادة تعيين كلمة المرور لحسابك في Muslims.cc. اضغط على الرابط لتعيين كلمة مرور جديدة:', button: 'تعيين كلمة مرور جديدة', note: 'الرابط صالح لمدة ساعة واحدة. إن لم تطلب ذلك فتجاهل الرسالة — لن تتغير كلمة المرور.' },
  },
  // Kimsə mövcud e-poçtla qeydiyyatdan keçməyə çalışdı (cavab hesabın varlığını açmasın deyə
  // ekranda "poçtunuzu yoxlayın" deyilir, sahibinə isə bu məktub gedir)
  exists: {
    az: { subject: 'Hesabınız artıq var — Muslims.cc', intro: 'Bu e-poçtla Muslims.cc-də yenidən qeydiyyat cəhdi olub. Hesabınız artıq var — daxil olun və ya şifrəni bərpa edin:', button: 'Daxil ol', note: 'Bunu siz etməmisinizsə, heç nə etməyin — hesabınız təhlükəsizdir.' },
    en: { subject: 'You already have an account — Muslims.cc', intro: 'Someone tried to sign up to Muslims.cc with this email. You already have an account — sign in or reset your password:', button: 'Sign in', note: 'If this was not you, no action is needed — your account is safe.' },
    ru: { subject: 'У вас уже есть аккаунт — Muslims.cc', intro: 'Кто-то пытался зарегистрироваться на Muslims.cc с этим e-mail. У вас уже есть аккаунт — войдите или сбросьте пароль:', button: 'Войти', note: 'Если это были не вы, ничего делать не нужно — ваш аккаунт в безопасности.' },
    tr: { subject: 'Zaten bir hesabınız var — Muslims.cc', intro: 'Biri bu e-postayla Muslims.cc\'ye kaydolmaya çalıştı. Zaten bir hesabınız var — giriş yapın veya şifrenizi sıfırlayın:', button: 'Giriş yap', note: 'Bu siz değilseniz bir şey yapmanıza gerek yok — hesabınız güvende.' },
    ar: { subject: 'لديك حساب بالفعل — Muslims.cc', intro: 'حاول أحدهم التسجيل في Muslims.cc بهذا البريد. لديك حساب بالفعل — سجّل الدخول أو أعد تعيين كلمة المرور:', button: 'تسجيل الدخول', note: 'إن لم تكن أنت فلا حاجة لأي إجراء — حسابك آمن.' },
  },
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const pickLang = (lang) => (LANGS.includes(lang) ? lang : 'en')

/** Şablon → { subject, text, html }. vars.url — məktubdakı keçid (yalnız https/http). */
function render(kind, lang, { url } = {}) {
  const tpl = T[kind]
  if (!tpl) throw new Error('unknown template')
  const l = pickLang(lang)
  const t = tpl[l]
  const safeUrl = /^https?:\/\/[^\s"'<>]+$/.test(String(url || '')) ? String(url) : ''
  const dir = l === 'ar' ? 'rtl' : 'ltr'
  const text = `${t.intro}\n\n${safeUrl}\n\n${t.note}\n\n— Muslims.cc`
  const html = `<!doctype html><html lang="${l}" dir="${dir}"><body style="margin:0;padding:24px;background:#f6f7f5;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1d2a24">` +
    `<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:28px">` +
    `<p style="font-size:18px;font-weight:600;margin:0 0 16px">Muslims.cc</p>` +
    `<p style="font-size:15px;line-height:1.6;margin:0 0 20px">${esc(t.intro)}</p>` +
    (safeUrl ? `<p style="margin:0 0 20px"><a href="${esc(safeUrl)}" style="display:inline-block;background:#0f6b4f;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">${esc(t.button)}</a></p>` +
      `<p style="font-size:12px;color:#5b6b63;word-break:break-all;margin:0 0 20px">${esc(safeUrl)}</p>` : '') +
    `<p style="font-size:13px;color:#5b6b63;line-height:1.5;margin:0">${esc(t.note)}</p>` +
    `</div></body></html>`
  return { subject: t.subject, text, html }
}

/**
 * opts.apiKey   — RESEND_API_KEY (yoxdursa göndəriş sönülüdür)
 * opts.from     — göndərən (susmaya görə noreply@muslims.cc)
 * opts.fetchImpl — testlər üçün
 * opts.onMessage — açar YOXDURSA hər "göndərilən" məktub buna verilir (test qarmağı)
 */
function createMailer({ apiKey = process.env.RESEND_API_KEY, from = DEFAULT_FROM, fetchImpl = (...a) => fetch(...a), onMessage = null, log = console } = {}) {
  const enabled = Boolean(apiKey)
  let warned = false

  async function send({ to, subject, text, html, kind = 'custom' }) {
    if (!enabled) {
      if (onMessage) { onMessage({ to, subject, text, html, kind }); return { ok: true, skipped: true } }
      if (!warned) { warned = true; log.warn('XƏBƏRDARLIQ: RESEND_API_KEY yoxdur — e-poçt göndərilmir (hesablar email_verified=0 qalır)') }
      return { ok: false, skipped: true }
    }
    try {
      const r = await fetchImpl(RESEND_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [to], subject, text, html }),
        signal: AbortSignal.timeout(10000),
      })
      if (!r.ok) log.error(`mail ${kind}: Resend ${r.status}`)
      return { ok: r.ok }
    } catch (e) {
      log.error(`mail ${kind}: ${e && e.name}`)
      return { ok: false }
    }
  }

  return {
    enabled,
    send,
    /** Şablonla göndər. Xəta atmır (nəticə { ok }). onMessage qarmağı sinxron çağırılır. */
    sendTemplate(kind, lang, to, vars) {
      const m = render(kind, lang, vars)
      return send({ to, ...m, kind })
    },
  }
}

module.exports = { createMailer, render, LANGS, RESEND_URL }
