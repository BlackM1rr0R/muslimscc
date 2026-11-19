// Səsli oxu (components/ListenButton.jsx) üçün cihaz səsinin seçimi — saf funksiyalar.
// 5 əsas dil BCP-47 xəritəsindədir; 44 əlavə dil (de, fr, id …) kodu ilə olduğu kimi axtarılır.
const BCP47 = { az: 'az-AZ', en: 'en', ru: 'ru-RU', ar: 'ar-SA', tr: 'tr-TR' }
export const normLang = (l) => String(l || '').toLowerCase().replace('_', '-')

/** Dil kodu → BCP-47 ("az" → "az-AZ", "de" → "de", "pt-BR" → "pt-BR") */
export const bcp47 = (l) => BCP47[normLang(l).split('-')[0]] || l || ''

/** Dil kodu üçün ən uyğun səs: tam uyğunluq → dil prefiksi (əvvəl cihazdakı); yoxdursa null. */
export function pickVoice(voices, code) {
  if (!voices || !voices.length || !code) return null
  const want = normLang(code)
  const base = want.split('-')[0]
  return voices.find(v => normLang(v.lang) === want)
    || voices.find(v => normLang(v.lang).split('-')[0] === base && v.localService)
    || voices.find(v => normLang(v.lang).split('-')[0] === base)
    || null
}
