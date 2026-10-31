// ═══════════════════════════════════════════════════════
// Səhabələrin vəfat ili — /sahaba siyahısındakı "vəfat illəri" qrafiki və
// profildəki "Bir baxışda" sətri üçün (SahabePage.jsx).
//
// Mənbə: İbn Həcər, "Təqribut-Təhzib" və "əl-İsabə fi təmyizis-səhabə";
// əz-Zəhəbi, "Siyəru əlamin-nubəla". Alimlər ili ixtilaf etdikdə (məs.
// Əbu Hureyrə: 57, 58 və ya 59) İbn Həcərin üstün tutduğu və ya ən məşhur
// il yazılır və approx: true qoyulur. Xədicə (r.a.) hicrətdən 3 il əvvəl
// vəfat edib — h: -3. Miladi il təxmini çevrilmədir (hicri ilin çox hissəsi).
//
// Açar — slugOf(s) (src/data/sahaba.js): "abu-bakr-as-siddiq" və s.
// ═══════════════════════════════════════════════════════
export const SAHABA_DEATH = {
  'abu-bakr-as-siddiq': { h: 13, g: 634 },
  'umar-ibn-al-khattab': { h: 23, g: 644 },
  'uthman-ibn-affan': { h: 35, g: 656 },
  'ali-ibn-abi-talib': { h: 40, g: 661 },
  'khadijah-bint-khuwaylid': { h: -3, g: 619 },
  'aisha-bint-abi-bakr': { h: 57, g: 677, approx: true },
  'fatimah-bint-muhammad': { h: 11, g: 632 },
  'bilal-ibn-rabah': { h: 20, g: 641, approx: true },
  'abu-hurairah': { h: 57, g: 677, approx: true },
  'abdullah-ibn-masud': { h: 32, g: 653 },
  'salman-al-farisi': { h: 34, g: 655, approx: true },
  'abu-dharr-al-ghifari': { h: 32, g: 653 },
  'muadh-ibn-jabal': { h: 18, g: 639 },
  'zaid-ibn-harithah': { h: 8, g: 629 },
  'khalid-ibn-al-walid': { h: 21, g: 642 },
  'saad-ibn-abi-waqqas': { h: 55, g: 675 },
  'talha-ibn-ubaydullah': { h: 36, g: 656 },
  'zubayr-ibn-al-awwam': { h: 36, g: 656 },
  'anas-ibn-malik': { h: 93, g: 712, approx: true },
  'abu-ubaidah-ibn-al-jarrah': { h: 18, g: 639 },
}

// Raşid xəlifələrin xilafət illəri (hicri): Əbu Bəkr 11–13, Ömər 13–23,
// Osman 23–35, Əli 35–40 — qrafikdə fon zolağı.
export const RASHIDUN_SPAN = { from: 11, to: 40 }
