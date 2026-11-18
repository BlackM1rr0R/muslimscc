// H3 — "Mənim kitabxanam" yazıları (5 dil)
export const SHELF_TXT = {
  az: {
    mine: 'Mənim kitabxanam', reading: 'Oxuyuram', want: 'Oxumaq istəyirəm', read: 'Oxudum', none: 'Rəfdə deyil',
    shelf: 'Rəf', page: 'Qaldığım səhifə', pageHint: 'Kitab PDF kimi xarici saytda açılır — səhifəni özünüz yazın.',
    note: 'Şəxsi qeyd', noteHint: (n, max) => `${n} / ${max}`, save: 'Saxla', saved: 'Saxlanıldı', remove: 'Rəfdən çıxar',
    private: 'Yalnız sizə görünür; hesabınızla şifrəli sinxronlanır.', emptyShelf: 'Bu rəf hələ boşdur — kitabın kartını açıb rəf seçin.',
    onShelf: (s) => `Rəf: ${s}`, pageN: (n) => `Səhifə ${n}`, toBooks: 'Kitabxanaya keç', count: (n) => `${n} kitab`,
    lead: 'Oxuduğunuz, oxumaq istədiyiniz və bitirdiyiniz kitablar.', book: 'Kitab', open: 'Kitabı aç',
  },
  en: {
    mine: 'My library', reading: 'Reading', want: 'Want to read', read: 'Read', none: 'Not on a shelf',
    shelf: 'Shelf', page: 'Page I’m on', pageHint: 'Books open as a PDF on an external site — enter the page yourself.',
    note: 'Private note', noteHint: (n, max) => `${n} / ${max}`, save: 'Save', saved: 'Saved', remove: 'Remove from shelf',
    private: 'Only you can see it; synced with your account, end-to-end encrypted.', emptyShelf: 'This shelf is empty — open a book’s card and pick a shelf.',
    onShelf: (s) => `Shelf: ${s}`, pageN: (n) => `Page ${n}`, toBooks: 'Go to the library', count: (n) => (n === 1 ? '1 book' : `${n} books`),
    lead: 'The books you are reading, want to read and have finished.', book: 'Book', open: 'Open the book',
  },
  ru: {
    mine: 'Моя библиотека', reading: 'Читаю', want: 'Хочу прочитать', read: 'Прочитано', none: 'Не на полке',
    shelf: 'Полка', page: 'Страница, на которой я остановился', pageHint: 'Книги открываются как PDF на внешнем сайте — укажите страницу сами.',
    note: 'Личная заметка', noteHint: (n, max) => `${n} / ${max}`, save: 'Сохранить', saved: 'Сохранено', remove: 'Убрать с полки',
    private: 'Видно только вам; синхронизируется с аккаунтом в зашифрованном виде.', emptyShelf: 'Эта полка пока пуста — откройте карточку книги и выберите полку.',
    onShelf: (s) => `Полка: ${s}`, pageN: (n) => `Страница ${n}`, toBooks: 'Перейти в библиотеку', count: (n) => `Книг: ${n}`,
    lead: 'Книги, которые вы читаете, хотите прочитать и уже прочитали.', book: 'Книга', open: 'Открыть книгу',
  },
  ar: {
    mine: 'مكتبتي', reading: 'أقرؤه', want: 'أريد قراءته', read: 'قرأته', none: 'ليس على رف',
    shelf: 'الرف', page: 'الصفحة التي وصلت إليها', pageHint: 'تُفتح الكتب ملفَّ PDF في موقع خارجي — اكتب رقم الصفحة بنفسك.',
    note: 'ملاحظة خاصة', noteHint: (n, max) => `${n} / ${max}`, save: 'حفظ', saved: 'حُفظ', remove: 'إزالة من الرف',
    private: 'لا يراها أحد سواك؛ تُزامَن مع حسابك مشفّرة.', emptyShelf: 'هذا الرف فارغ — افتح بطاقة كتاب واختر رفًّا.',
    onShelf: (s) => `الرف: ${s}`, pageN: (n) => `الصفحة ${n}`, toBooks: 'انتقل إلى المكتبة', count: (n) => `${n} كتب`,
    lead: 'الكتب التي تقرؤها وتريد قراءتها وأتممتها.', book: 'كتاب', open: 'افتح الكتاب',
  },
  tr: {
    mine: 'Kütüphanem', reading: 'Okuyorum', want: 'Okumak istiyorum', read: 'Okudum', none: 'Rafta değil',
    shelf: 'Raf', page: 'Kaldığım sayfa', pageHint: 'Kitaplar harici bir sitede PDF olarak açılır — sayfayı kendiniz yazın.',
    note: 'Kişisel not', noteHint: (n, max) => `${n} / ${max}`, save: 'Kaydet', saved: 'Kaydedildi', remove: 'Raftan çıkar',
    private: 'Yalnızca siz görürsünüz; hesabınızla şifreli olarak eşitlenir.', emptyShelf: 'Bu raf henüz boş — bir kitabın kartını açıp raf seçin.',
    onShelf: (s) => `Raf: ${s}`, pageN: (n) => `Sayfa ${n}`, toBooks: 'Kütüphaneye git', count: (n) => `${n} kitap`,
    lead: 'Okuduğunuz, okumak istediğiniz ve bitirdiğiniz kitaplar.', book: 'Kitap', open: 'Kitabı aç',
  },
}
