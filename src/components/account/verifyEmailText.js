// ═══════════════════════════════════════════════════════
// VE — "e-poçtu təsdiqləyin" qeydi (VerifyEmailNote.jsx) və server xəta kodu (apiErrCode).
// Ayrıca kiçik fayldır: ümmət xətmi səhifəsi communityText.js-in hamısını yükləməsin.
// B1 müqaviləsi: 403 { code|error: 'verify_email' }, 409 { code|error: 'moderated' }.
// ═══════════════════════════════════════════════════════
// "E-poçtu təsdiqləyin" (server 403 { code|error: 'verify_email' }) — dua divarı, açıq profil, ümmət xətmi.
// resend / resent — AccountPage.jsx-dəki eyni yazılar (əlavə dillərin lüğətində artıq var)
export const VE = {
  az: { need: 'Bundan istifadə etmək üçün e-poçtunuzu təsdiqləyin.', resend: 'Məktubu yenidən göndər', resent: 'Təsdiq məktubu göndərildi. Gələnlər qutusunu yoxlayın.', failed: 'Alınmadı. Yenidən cəhd edin.' },
  en: { need: 'Confirm your email to use this.', resend: 'Send the email again', resent: 'Confirmation email sent. Check your inbox.', failed: 'That did not work. Please try again.' },
  ru: { need: 'Подтвердите почту, чтобы пользоваться этим.', resend: 'Отправить письмо ещё раз', resent: 'Письмо с подтверждением отправлено. Проверьте входящие.', failed: 'Не получилось. Попробуйте ещё раз.' },
  tr: { need: 'Bunu kullanmak için e-postanızı onaylayın.', resend: 'E-postayı yeniden gönder', resent: 'Onay e-postası gönderildi. Gelen kutunuzu kontrol edin.', failed: 'Olmadı. Lütfen tekrar deneyin.' },
  ar: { need: 'أكّد بريدك الإلكتروني لاستخدام هذا.', resend: 'أعد إرسال الرسالة', resent: 'أُرسلت رسالة التأكيد. تحقّق من صندوق الوارد.', failed: 'لم ينجح ذلك. حاول مرة أخرى.' },
}

/** Server xətasının kodu: { code } və ya { error } (B1 müqaviləsi: verify_email, moderated) */
export const apiErrCode = (e) => (e && ((typeof e.code === 'string' && e.code) || (e.body && typeof e.body.error === 'string' && e.body.error) || (e.body && typeof e.body.code === 'string' && e.body.code))) || ''
