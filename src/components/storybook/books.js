// ═══════════════════════════════════════════════════════
// Hekayə kitablarının bədii "pasportu" (StoryBooks.jsx) — hər kitabın rəng
// palitrası, səhnə addımları (beats) və üz qabığı üçün addım.
//
// beats[i].at — hekayə mətninin hansı nisbətindən (0…1) bu səhnə başlayır.
// Nisbətlər ingiliscə mətndəki cümlələrin başlanğıcına görə seçilib; bütün
// dillərdə hekayə eyni ardıcıllıqla danışıldığı üçün digər dillərə də uyğundur.
// Səhnədə HEÇ VAXT canlı təsviri yoxdur (insan, peyğəmbər, mələk, heyvan, quş,
// balıq, həşərat) — yalnız təbiət, bitkilər, əşyalar və rəmzlər (sahibin qərarı).
// ═══════════════════════════════════════════════════════

export const BOOK_ART = {
  adam: {
    pal: { a: '#2f7a5c', b: '#173f33', c: '#f4c862', d: '#f39aa6', paper: '#fff8ea' },
    beats: [{ at: 0, k: 'names' }, { at: 0.16, k: 'light' }, { at: 0.45, k: 'garden' }, { at: 0.6, k: 'dusk' }, { at: 0.77, k: 'dawn' }],
    cover: 0,
  },
  nuh: {
    pal: { a: '#1d6f7a', b: '#0d3943', c: '#ff8e6b', d: '#ffd59a', paper: '#f6fbf8' },
    beats: [{ at: 0, k: 'village' }, { at: 0.2, k: 'build' }, { at: 0.28, k: 'flood' }, { at: 0.46, k: 'mountain' }, { at: 0.64, k: 'storm' }, { at: 0.85, k: 'judi' }],
    cover: 5,
  },
  ibrahim: {
    pal: { a: '#2a3470', b: '#141a3d', c: '#ff8a3d', d: '#f7a1bd', paper: '#fdf6ee' },
    beats: [{ at: 0, k: 'stones' }, { at: 0.2, k: 'broken' }, { at: 0.3, k: 'silent' }, { at: 0.62, k: 'fire' }, { at: 0.83, k: 'cool' }],
    cover: 4,
  },
  'ibrahim-and-ismail': {
    pal: { a: '#b8664f', b: '#5a2d2a', c: '#f5c35a', d: '#f1b7a0', paper: '#fff6ea' },
    beats: [{ at: 0, k: 'build' }, { at: 0.39, k: 'dua' }],
    cover: 1,
  },
  musa: {
    pal: { a: '#1f6f8f', b: '#0e3550', c: '#f2c66b', d: '#8fd8c8', paper: '#f5fbfb' },
    beats: [{ at: 0, k: 'river' }, { at: 0.29, k: 'palace' }, { at: 0.57, k: 'shore' }, { at: 0.7, k: 'hope' }, { at: 0.81, k: 'parted' }],
    cover: 4,
  },
  yusuf: {
    pal: { a: '#24306b', b: '#111838', c: '#f2c14e', d: '#e9b07a', paper: '#fdf8ec' },
    beats: [{ at: 0, k: 'dream' }, { at: 0.24, k: 'tent' }, { at: 0.38, k: 'well' }, { at: 0.6, k: 'egypt' }, { at: 0.7, k: 'caravan' }],
    cover: 0,
  },
  yunus: {
    pal: { a: '#11566b', b: '#062a38', c: '#ff8a72', d: '#9fe3d0', paper: '#f3fbfa' },
    beats: [{ at: 0, k: 'ship' }, { at: 0.19, k: 'deep' }, { at: 0.29, k: 'dark' }, { at: 0.67, k: 'shore' }],
    cover: 1,
  },
  sulayman: {
    pal: { a: '#3f8c4a', b: '#1d4a2a', c: '#f6c94e', d: '#ff9e7a', paper: '#fbfbea' },
    beats: [{ at: 0, k: 'wind' }, { at: 0.2, k: 'valley' }, { at: 0.29, k: 'homes' }, { at: 0.58, k: 'thanks' }],
    cover: 2,
  },
  isa: {
    pal: { a: '#5a4f9e', b: '#251f4d', c: '#f3cf6a', d: '#9ad7c4', paper: '#fbf7ff' },
    beats: [{ at: 0, k: 'path' }, { at: 0.19, k: 'cradle' }, { at: 0.27, k: 'night' }, { at: 0.44, k: 'light' }],
    cover: 3,
  },
}

/** Səhifə nömrəsinə görə kamera sürüşməsi (eyni səhnədə ardıcıl səhifələr fərqli görünsün) */
export const CAMS = [0, 0.7, -0.6, 0.35, -0.3, 0.9, -0.85]
