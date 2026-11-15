// ═══════════════════════════════════════════════════════
// HadithMemorize (v6.9) — sevimli hədisləri kartlarla əzbərləmə (/hadith)
//
// Ön üz: məna (tərcümə) + mənbə; "Ərəbcəni göstər" → hədisin ərəbcə mətni.
// "Bildim" / "Yenə" — Leitner qutuları (utils/hadithSrs.js): 1, 3, 7, 14, 30,
// 60 gün. Yalnız bu cihazda saxlanılır.
// ═══════════════════════════════════════════════════════
import { useMemo, useState } from 'react'
import ReaderDialog from './reader/ReaderDialog'
import { readSrs, writeSrs, dueIds, grade, summary, todayKey, MAX_BOX } from '../utils/hadithSrs'
import { localizeSource } from '../utils/sourceNames'
import { pickUi } from '../utils/uiText'
import { haptic } from '../hooks/useHaptic'
import Icon from './Icon'
import '../styles/HadithMemorize.css'

export const MEM_T = {
  az: { btn: 'Əzbərlə', due: '{n} təkrar gözləyir', none: 'Bu gün təkrar yoxdur', title: 'Hədis əzbərləmə', show: 'Ərəbcəni göstər', know: 'Bildim', again: 'Yenə', done: 'Bugünkü təkrar bitdi!', next: 'Növbəti təkrar: {d}', learned: 'Əzbərlənmiş: {n} / {t}', how: 'Mənanı oxuyun, ərəbcə mətni yadınıza salın, sonra yoxlayın. Bildiyiniz hədis getdikcə daha seyrək (1, 3, 7, 14, 30, 60 gün) təkrar olunur.', only: 'Yalnız bu cihazda saxlanılır.', close: 'Bağla', left: '{n} qaldı' },
  en: { btn: 'Memorize', due: '{n} due for review', none: 'Nothing due today', title: 'Memorize hadith', show: 'Show the Arabic', know: 'I knew it', again: 'Again', done: 'Today’s review is done!', next: 'Next review: {d}', learned: 'Memorized: {n} / {t}', how: 'Read the meaning, recall the Arabic text, then check. Hadith you know come back less and less often (1, 3, 7, 14, 30, 60 days).', only: 'Saved on this device only.', close: 'Close', left: '{n} left' },
  ru: { btn: 'Заучить', due: 'К повторению: {n}', none: 'Сегодня повторять нечего', title: 'Заучивание хадисов', show: 'Показать арабский текст', know: 'Помню', again: 'Ещё раз', done: 'Сегодняшнее повторение завершено!', next: 'Следующее повторение: {d}', learned: 'Выучено: {n} / {t}', how: 'Прочитайте смысл, вспомните арабский текст и проверьте себя. Выученные хадисы повторяются всё реже (1, 3, 7, 14, 30, 60 дней).', only: 'Сохраняется только на этом устройстве.', close: 'Закрыть', left: 'Осталось: {n}' },
  ar: { btn: 'احفظ', due: '{n} للمراجعة', none: 'لا مراجعة اليوم', title: 'حفظ الأحاديث', show: 'أظهر النص', know: 'حفظته', again: 'مرة أخرى', done: 'انتهت مراجعة اليوم!', next: 'المراجعة القادمة: {d}', learned: 'المحفوظ: {n} / {t}', how: 'تذكّر نص الحديث ثم تحقّق. ما تحفظه يُراجَع على فترات أطول (١، ٣، ٧، ١٤، ٣٠، ٦٠ يومًا).', only: 'يُحفظ على هذا الجهاز فقط.', close: 'إغلاق', left: 'بقي {n}' },
  tr: { btn: 'Ezberle', due: '{n} tekrar bekliyor', none: 'Bugün tekrar yok', title: 'Hadis ezberleme', show: 'Arapçayı göster', know: 'Bildim', again: 'Tekrar', done: 'Bugünkü tekrar bitti!', next: 'Sonraki tekrar: {d}', learned: 'Ezberlenen: {n} / {t}', how: 'Anlamı okuyun, Arapça metni hatırlayın, sonra kontrol edin. Bildiğiniz hadisler giderek daha seyrek (1, 3, 7, 14, 30, 60 gün) tekrar edilir.', only: 'Yalnızca bu cihazda saklanır.', close: 'Kapat', left: '{n} kaldı' },
}
const fill = (s, o) => Object.entries(o).reduce((a, [k, v]) => a.replace(`{${k}}`, v), s)

/** Sevimlilər zolağı üçün: { due, label } */
export function memorizeStatus(ids, lang) {
  const u = pickUi(MEM_T, lang, 'en')
  const n = dueIds(ids, readSrs()).length
  return { due: n, label: n ? fill(u.due, { n }) : u.none }
}

export default function HadithMemorize({ open, onClose, items, lang }) {
  const u = pickUi(MEM_T, lang, 'en')
  const [state, setState] = useState(readSrs)
  const [shown, setShown] = useState(false)
  const ids = useMemo(() => items.map(h => h.id), [items])
  const byId = useMemo(() => new Map(items.map(h => [h.id, h])), [items])
  const queue = useMemo(() => (open ? dueIds(ids, state) : []), [open, ids, state])
  const cur = queue.length ? byId.get(queue[0]) : null
  const sum = summary(ids, state)
  const answer = (ok) => {
    haptic(ok ? 8 : 4)
    const next = grade(state, cur.id, ok)
    writeSrs(next)
    setState(next)
    setShown(false)
  }
  const text = cur ? (cur.text || '').trim() : ''
  const box = cur ? (state[cur.id]?.b ?? -1) : -1
  const nextLabel = sum.next ? new Date(`${sum.next}T12:00:00`).toLocaleDateString(lang, { day: 'numeric', month: 'long' }) : ''
  return (
    <ReaderDialog open={open} onClose={onClose} labelledBy="hmem-title" labels={{ close: u.close, prev: '', next: '' }}
      className="hmem" contentKey={cur ? `${cur.id}-${todayKey()}` : 'done'}
      head={<h2 id="hmem-title" className="hfull__title">{u.title}</h2>}
      footer={<span className="hmem__learned ui-num">{fill(u.learned, { n: sum.learned, t: ids.length })}</span>}>
      <div className="hmem__body" data-testid="hadith-memorize">
        {cur ? (
          <>
            <div className="hmem__meta">
              <span className="hmem__boxes" aria-hidden="true">
                {Array.from({ length: MAX_BOX + 1 }, (_, i) => <i key={i} className={i <= box ? 'on' : ''} />)}
              </span>
              <span className="ui-num">{fill(u.left, { n: queue.length })}</span>
            </div>
            {lang !== 'ar' && text && <p className="hmem__text">{text}</p>}
            <p className="hmem__src">— {localizeSource(cur.source, lang)}</p>
            {shown || lang === 'ar'
              ? <p className="hmem__ar ui-arabic" lang="ar" dir="rtl" data-testid="hmem-ar">{cur.ar}</p>
              : (
                <button type="button" className="ui-btn ui-btn--secondary hmem__show" onClick={() => setShown(true)}>
                  <Icon name="eye" className="ui-btn__icon" /> {u.show}
                </button>
              )}
            {(shown || lang === 'ar') && (
              <div className="hmem__actions">
                <button type="button" className="ui-btn ui-btn--secondary" onClick={() => answer(false)}>{u.again}</button>
                <button type="button" className="ui-btn ui-btn--primary" onClick={() => answer(true)}>{u.know}</button>
              </div>
            )}
            <p className="hmem__how">{u.how}</p>
          </>
        ) : (
          <div className="hmem__done" data-testid="hmem-done">
            <span className="hmem__star" aria-hidden="true">✦</span>
            <p className="hmem__done-t">{u.done}</p>
            {nextLabel && <p>{fill(u.next, { d: nextLabel })}</p>}
            <p className="hmem__how">{u.only}</p>
          </div>
        )}
      </div>
    </ReaderDialog>
  )
}
