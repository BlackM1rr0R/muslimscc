// ═══════════════════════════════════════════════════════
// İslami söz lüğəti — terminlər, ərəb yazılışı, transliterasiya və
// 5 dildə tərif.
//
// GlossaryPage.jsx-dən OLDUĞU KİMİ çıxarıldı ki, qlobal axtarış
// (GlobalSearch) da bu terminləri tapa bilsin. Mətnləri burada redaktə et.
// ═══════════════════════════════════════════════════════

export const GLOSSARY = [
  {
    term: 'Tövhid', ar: 'التوحيد', translit: 'Tawhid',
    def: {
      az: 'Allahı tək tanımaq: Rübubiyyətdə (yaratmaq, ruzi vermək, idarə etmək yalnız Ona aiddir), Uluhiyyətdə (ibadət yalnız Ona edilir) və Əsma-sifatda (Onun adları və sifətləri təhrifsiz, təətilsiz, keyfiyyət soruşmadan və bənzətmədən isbat edilir). İslamın ən əsas prinsipidir.',
      en: 'Singling out Allah in His Lordship (He alone creates, provides and governs), in worship (all worship is for Him alone), and in His Names and Attributes (affirmed without distortion, denial, asking how, or likening Him to creation). The most fundamental principle of Islam.',
      ru: 'Признание единственности Аллаха в господстве (лишь Он творит, наделяет уделом и управляет), в поклонении (всякое поклонение — только Ему) и в именах и атрибутах (они утверждаются без искажения, отрицания, вопроса «как» и уподобления творению). Самый фундаментальный принцип Ислама.',
      ar: 'إفراد الله بالربوبية (الخلق والرزق والتدبير) وبالألوهية (العبادة) وبالأسماء والصفات (إثباتها من غير تحريف ولا تعطيل ولا تكييف ولا تمثيل). وهو أهم أصول الإسلام.',
      tr: 'Allah\'ı Rubûbiyette (yaratma, rızık verme ve idare yalnız O\'na aittir), Ulûhiyette (ibadet yalnız O\'na yapılır) ve İsim ve Sıfatlarda (tahrif, tatil, keyfiyet sormadan ve benzetmeden ispat edilir) tek kılmak. İslam\'ın en temel ilkesidir.',
    }
  },
  {
    term: 'Şirk', ar: 'الشرك', translit: 'Shirk',
    def: {
      az: 'Allaha şərik qoşmaq: Allaha məxsus olan bir şeyi (ibadət, dua, nəzir, qurban və s.) başqasına yönəltmək. İslamda ən böyük günahdır; tövbəsiz ölənə bağışlanmaz (Nisa 4:48).',
      en: 'Associating partners with Allah: directing anything that belongs to Allah alone (worship, supplication, vows, sacrifice, etc.) to another. The greatest sin in Islam; it is not forgiven for one who dies upon it without repentance (An-Nisa 4:48).',
      ru: 'Придание Аллаху сотоварищей: обращение того, что принадлежит только Аллаху (поклонение, мольба, обет, жертвоприношение и т. д.), к кому-то другому. Величайший грех в Исламе; он не прощается тому, кто умер с ним без покаяния (ан-Ниса 4:48).',
      ar: 'الإشراك بالله: صرف شيء مما يختص بالله (كالعبادة والدعاء والنذر والذبح) لغيره. وهو أعظم الذنوب، ولا يُغفر لمن مات عليه دون توبة (النساء: 48).',
      tr: 'Allah\'a ortak koşmak: yalnız Allah\'a ait olan bir şeyi (ibadet, dua, adak, kurban vb.) başkasına yöneltmek. İslam\'da en büyük günahtır; tövbe etmeden ölen için bağışlanmaz (Nisâ 4:48).',
    }
  },
  {
    term: 'Bidət', ar: 'البدعة', translit: 'Bid\'ah',
    def: {
      az: 'Dində olmayan yenilik. Peyğəmbərin (s.a.s) və səhabələrin etmədiyi, Allaha yaxınlaşmaq niyyəti ilə dinə əlavə edilən ibadət formaları. Peyğəmbər (s.a.s) buyurub: «Hər bidət zəlalətdir» (Müslim 867).',
      en: 'Innovation in religion. Forms of worship added to the religion as a means of drawing closer to Allah that were not practiced by the Prophet (PBUH) and his companions. The Prophet (PBUH) said: «Every innovation is misguidance» (Muslim 867).',
      ru: 'Нововведение в религии. Формы поклонения, добавленные в религию ради приближения к Аллаху, которые не практиковали Пророк (мир ему) и его сподвижники. Пророк (мир ему) сказал: «Всякое нововведение — заблуждение» (Муслим 867).',
      ar: 'الابتداع في الدين. ما أُحدث في الدين من العبادات بقصد التقرب إلى الله ولم يفعله النبي ﷺ وأصحابه. قال ﷺ: «وكل بدعة ضلالة» (مسلم 867).',
      tr: 'Dinde yenilik. Hz. Peygamber (s.a.s) ve ashabının yapmadığı, Allah\'a yaklaşma niyetiyle dine eklenen ibadet şekilleri. Peygamber (s.a.s) şöyle buyurmuştur: «Her bidat sapıklıktır» (Müslim 867).',
    }
  },
  {
    term: 'İman', ar: 'الإيمان', translit: 'Iman',
    def: {
      az: 'Allaha, mələklərə, kitablara, peyğəmbərlərə, axirət gününə və qədərə inanmaq. Əhli-Sünnəyə görə iman qəlblə təsdiq, dillə söz və əzalarla əməldir; itaətlə artır, günahla azalır (Buxari, «Kitab əl-İman», 1-ci bab).',
      en: 'Believing in Allah, His angels, books, prophets, the Last Day and divine decree. According to Ahl as-Sunnah, faith is belief in the heart, speech of the tongue and action of the limbs; it increases with obedience and decreases with sin (Bukhari, «Book of Faith», chapter 1).',
      ru: 'Вера в Аллаха, ангелов, Писания, пророков, Последний день и предопределение. Согласно Ахль ас-Сунна, вера — это убеждённость сердцем, слово языком и дела членами тела; она увеличивается от покорности и уменьшается от грехов (Бухари, «Книга веры», глава 1).',
      ar: 'الإيمان بالله وملائكته وكتبه ورسله واليوم الآخر والقدر. وهو عند أهل السنة: اعتقاد بالقلب وقول باللسان وعمل بالجوارح، يزيد بالطاعة وينقص بالمعصية (البخاري، كتاب الإيمان، الباب الأول).',
      tr: 'Allah\'a, meleklere, kitaplara, peygamberlere, ahiret gününe ve kadere inanmak. Ehl-i Sünnet\'e göre iman kalple tasdik, dille ikrar ve azalarla ameldir; itaatle artar, günahla azalır (Buhari, «İman Kitabı», 1. bab).',
    }
  },
  {
    term: 'İslam', ar: 'الإسلام', translit: 'Islam',
    def: {
      az: 'Allaha təslim olmaq. Beş əsas üzərində qurulub: şəhadət, namaz, oruc, zəkat və həcc.',
      en: 'Submission to the will of Allah. Built upon five pillars: testimony, prayer, fasting, charity, and pilgrimage.',
      ru: 'Покорность воле Аллаха. Основан на пяти столпах: свидетельство, молитва, пост, милостыня и паломничество.',
      ar: 'الاستسلام لإرادة الله. يقوم على خمسة أركان: الشهادة والصلاة والصيام والزكاة والحج.',
      tr: 'Allah\'ın iradesine teslim olmak. Beş esas üzerine kurulmuştur: şehadet, namaz, oruç, zekat ve hac.',
    }
  },
  {
    term: 'İhsan', ar: 'الإحسان', translit: 'Ihsan',
    def: {
      az: 'Yaxşılıq, gözəl davranış. Allaha onu görürmüş kimi ibadət etmək.',
      en: 'Excellence in worship. Worshipping Allah as if you see Him, knowing He sees you.',
      ru: 'Совершенство в поклонении. Поклоняться Аллаху так, как будто ты видишь Его, зная, что Он видит тебя.',
      ar: 'الإتقان في العبادة. أن تعبد الله كأنك تراه فإن لم تكن تراه فإنه يراك.',
      tr: 'İbadette mükemmellik. Allah\'a O\'nu görüyormuşçasına ibadet etmek.',
    }
  },
  {
    term: 'Sünnə', ar: 'السنة', translit: 'Sunnah',
    def: {
      az: 'Hz. Peyğəmbərin (s.a.s) söz, əməl və təqrir yolu. Qurandən sonra ikinci mənbə.',
      en: 'The way of Prophet Muhammad (PBUH) including his sayings, actions, and approvals. The second source after the Quran.',
      ru: 'Путь Пророка Мухаммада (мир ему), включая его высказывания, действия и одобрения. Второй источник после Корана.',
      ar: 'طريقة النبي ﷺ من أقوال وأفعال وتقريرات. المصدر الثاني بعد القرآن.',
      tr: 'Hz. Peygamber\'in (s.a.s) söz, fiil ve takrirleri. Kuran\'dan sonra ikinci kaynak.',
    }
  },
  {
    term: 'Fərz', ar: 'الفرض', translit: 'Fard',
    def: {
      az: 'Vacib, məcburi ibadət. Allahın qəti əmri ilə yerinə yetirilməsi lazım olan əməl.',
      en: 'Obligatory act. An action that must be performed as commanded by Allah.',
      ru: 'Обязательное действие. Действие, которое необходимо выполнить по повелению Аллаха.',
      ar: 'العمل الواجب. ما أمر الله بفعله أمراً جازماً.',
      tr: 'Zorunlu ibadet. Allah\'ın kesin emriyle yapılması gereken amel.',
    }
  },
  {
    term: 'Vacib', ar: 'الواجب', translit: 'Wajib',
    def: {
      az: 'Fərzə yaxın dərəcədə vacib olan əməl. Tərk edənə günah yazılır.',
      en: 'A near-obligatory act, slightly below fard. Abandoning it is sinful.',
      ru: 'Почти обязательное действие, чуть ниже фарда. Оставление его является грехом.',
      ar: 'عمل قريب من الفرض. يأثم تاركه.',
      tr: 'Farza yakın derecede zorunlu amel. Terk eden günahkâr olur.',
    }
  },
  {
    term: 'Haram', ar: 'الحرام', translit: 'Haram',
    def: {
      az: 'Qadağan olunmuş əməl. Allahın qəti surətdə qadağan etdiyi şeylər.',
      en: 'Forbidden act. Things that Allah has strictly prohibited.',
      ru: 'Запрещённое действие. То, что Аллах строго запретил.',
      ar: 'الفعل المحرم. ما نهى الله عنه نهياً جازماً.',
      tr: 'Yasaklanmış eylem. Allah\'ın kesin olarak yasakladığı şeyler.',
    }
  },
  {
    term: 'Halal', ar: 'الحلال', translit: 'Halal',
    def: {
      az: 'İcazə verilmiş, təmiz. İslam hüququna görə icazə verilmiş əməl və qidalar.',
      en: 'Permissible, lawful. Actions and foods permitted according to Islamic law.',
      ru: 'Дозволенное, законное. Действия и пища, разрешённые по исламскому праву.',
      ar: 'المباح والجائز. الأفعال والأطعمة المسموح بها في الشريعة الإسلامية.',
      tr: 'İzin verilmiş, helal. İslam hukukuna göre izin verilen eylem ve gıdalar.',
    }
  },
  {
    term: 'Məkruh', ar: 'المكروه', translit: 'Makruh',
    def: {
      az: 'Bəyənilməyən, xoşagəlməz əməl. Haram olmasa da, tərk edilməsi daha yaxşıdır.',
      en: 'Disliked act. Not forbidden but better to avoid.',
      ru: 'Нежелательное действие. Не запрещено, но лучше избегать.',
      ar: 'الفعل غير المستحب. ليس حراماً لكن تركه أفضل.',
      tr: 'Hoş karşılanmayan eylem. Haram olmasa da terk edilmesi daha iyidir.',
    }
  },
  {
    term: 'Müstəhəb', ar: 'المستحب', translit: 'Mustahab',
    def: {
      az: 'Bəyənilən, təşviq edilən əməl. Edənə savab, etməyənə günah yoxdur.',
      en: 'Recommended act. Rewarded if done, no sin if omitted.',
      ru: 'Рекомендуемое действие. Вознаграждается за совершение, нет греха за оставление.',
      ar: 'العمل المستحب. يُثاب فاعله ولا يأثم تاركه.',
      tr: 'Tavsiye edilen amel. Yapana sevap, yapmayana günah yoktur.',
    }
  },
  {
    term: 'Namaz', ar: 'الصلاة', translit: 'Salah',
    def: {
      az: 'İslamın ikinci şərti. Gündə beş vaxt qılınan ibadət.',
      en: 'The second pillar of Islam. The ritual prayer performed five times daily.',
      ru: 'Второй столп Ислама. Ритуальная молитва, совершаемая пять раз в день.',
      ar: 'الركن الثاني من أركان الإسلام. الصلاة المفروضة خمس مرات يومياً.',
      tr: 'İslam\'ın ikinci şartı. Günde beş vakit kılınan ibadet.',
    }
  },
  {
    term: 'Oruc', ar: 'الصوم', translit: 'Sawm',
    def: {
      az: 'İslamın üçüncü şərti. Ramazan ayında dan yeri ağarandan gün batana qədər yemək-içməkdən çəkinmək.',
      en: 'The third pillar of Islam. Fasting from dawn to sunset during the month of Ramadan.',
      ru: 'Третий столп Ислама. Воздержание от еды и питья от рассвета до заката в месяц Рамадан.',
      ar: 'الركن الثالث من أركان الإسلام. الامتناع عن الطعام والشراب من الفجر إلى المغرب في رمضان.',
      tr: 'İslam\'ın üçüncü şartı. Ramazan ayında imsak\'tan iftar\'a kadar yeme içmeden uzak durmak.',
    }
  },
  {
    term: 'Zəkat', ar: 'الزكاة', translit: 'Zakat',
    def: {
      az: 'İslamın dördüncü şərti. Müəyyən miqdarda malın kasıblara verilməsi.',
      en: 'The fourth pillar of Islam. Giving a specific portion of wealth to those in need.',
      ru: 'Четвёртый столп Ислама. Отдача определённой доли имущества нуждающимся.',
      ar: 'الركن الرابع من أركان الإسلام. إخراج نصيب محدد من المال للمحتاجين.',
      tr: 'İslam\'ın dördüncü şartı. Belirli miktardaki malın ihtiyaç sahiplerine verilmesi.',
    }
  },
  {
    term: 'Həcc', ar: 'الحج', translit: 'Hajj',
    def: {
      az: 'İslamın beşinci şərti. İmkanı olan müsəlmanın ömründə bir dəfə Məkkəyə ziyarəti.',
      en: 'The fifth pillar of Islam. The annual pilgrimage to Mecca, required once in a lifetime for those who are able.',
      ru: 'Пятый столп Ислама. Ежегодное паломничество в Мекку, обязательное раз в жизни для тех, кто может.',
      ar: 'الركن الخامس من أركان الإسلام. الحج إلى مكة مرة واحدة في العمر لمن استطاع.',
      tr: 'İslam\'ın beşinci şartı. Gücü yeten Müslümanın ömründe bir kez Mekke\'ye ziyareti.',
    }
  },
  {
    term: 'Ümrə', ar: 'العمرة', translit: 'Umrah',
    def: {
      az: 'Kiçik həcc. İlin istənilən vaxtı edilə bilən Məkkə ziyarəti.',
      en: 'The lesser pilgrimage. A visit to Mecca that can be performed at any time of the year.',
      ru: 'Малое паломничество. Посещение Мекки, которое можно совершить в любое время года.',
      ar: 'الحج الأصغر. زيارة مكة التي يمكن أداؤها في أي وقت من السنة.',
      tr: 'Küçük hac. Yılın herhangi bir zamanında yapılabilen Mekke ziyareti.',
    }
  },
  {
    term: 'Quran', ar: 'القرآن', translit: 'Quran',
    def: {
      az: 'Allahın son ilahi kitabı. Hz. Muhəmmədə (s.a.s) nazil olmuş, 114 surədən ibarət müqəddəs kitab.',
      en: 'The final divine book of Allah. The holy book revealed to Prophet Muhammad (PBUH), consisting of 114 surahs.',
      ru: 'Последняя божественная книга Аллаха. Священная книга, ниспосланная Пророку Мухаммаду (мир ему), состоящая из 114 сур.',
      ar: 'آخر كتاب أنزله الله. الكتاب المقدس الذي أُنزل على النبي ﷺ ويتكون من 114 سورة.',
      tr: 'Allah\'ın son ilahi kitabı. Hz. Muhammed\'e (s.a.s) indirilen, 114 sureden oluşan kutsal kitap.',
    }
  },
  {
    term: 'Hədis', ar: 'الحديث', translit: 'Hadith',
    def: {
      az: 'Hz. Peyğəmbərin (s.a.s) söz, əməl və təqrirləri. İslam hüququnun ikinci mənbəyi.',
      en: 'The sayings, actions, and approvals of Prophet Muhammad (PBUH). The second source of Islamic jurisprudence.',
      ru: 'Высказывания, действия и одобрения Пророка Мухаммада (мир ему). Второй источник исламского права.',
      ar: 'أقوال وأفعال وتقريرات النبي ﷺ. المصدر الثاني للتشريع الإسلامي.',
      tr: 'Hz. Peygamber\'in (s.a.s) söz, fiil ve takrirleri. İslam hukukunun ikinci kaynağı.',
    }
  },
  {
    term: 'Təfsir', ar: 'التفسير', translit: 'Tafsir',
    def: {
      az: 'Quranın izahı, şərhi. Quran ayələrinin mənalarının araşdırılması və açıqlanması.',
      en: 'Exegesis of the Quran. The scholarly interpretation and explanation of Quranic verses.',
      ru: 'Толкование Корана. Научное объяснение и интерпретация аятов Корана.',
      ar: 'تفسير القرآن. البحث في معاني آيات القرآن وشرحها.',
      tr: 'Kuran\'ın tefsiri. Kuran ayetlerinin anlamlarının araştırılması ve açıklanması.',
    }
  },
  {
    term: 'Fiqh', ar: 'الفقه', translit: 'Fiqh',
    def: {
      az: 'İslam hüququ. Quran və sünnədən çıxarılan əməli hökmlərin elmi.',
      en: 'Islamic jurisprudence. The science of deriving practical rulings from the Quran and Sunnah.',
      ru: 'Исламская юриспруденция. Наука о выведении практических норм из Корана и Сунны.',
      ar: 'الفقه الإسلامي. علم استنباط الأحكام العملية من القرآن والسنة.',
      tr: 'İslam hukuku. Kuran ve sünnetten pratik hükümlerin çıkarılması ilmi.',
    }
  },
  {
    term: 'Tövbə', ar: 'التوبة', translit: 'Tawbah',
    def: {
      az: 'Günahlardan qayıtmaq, peşman olmaq. Allahdan bağışlanma diləyərək günahı tərk etmək.',
      en: 'Repentance. Turning back to Allah from sins, seeking His forgiveness and abandoning the sin.',
      ru: 'Покаяние. Возвращение к Аллаху от грехов, просьба о прощении и оставление греха.',
      ar: 'الرجوع عن الذنوب. طلب المغفرة من الله والإقلاع عن الذنب.',
      tr: 'Günahlardan dönmek, pişman olmak. Allah\'tan bağışlanma dileyerek günahı terk etmek.',
    }
  },
  {
    term: 'Təvəkkül', ar: 'التوكل', translit: 'Tawakkul',
    def: {
      az: 'Allaha güvənmək, təslim olmaq. Səbəblərə sarılıb nəticəni Allaha buraxmaq.',
      en: 'Reliance on Allah. Taking the necessary means while trusting the outcome to Allah.',
      ru: 'Упование на Аллаха. Принятие необходимых мер с доверием результата Аллаху.',
      ar: 'الاعتماد على الله. الأخذ بالأسباب مع تفويض النتيجة لله.',
      tr: 'Allah\'a güvenmek. Sebeplere sarılıp sonucu Allah\'a bırakmak.',
    }
  },
  {
    term: 'İxlas', ar: 'الإخلاص', translit: 'Ikhlas',
    def: {
      az: 'Səmimiyyət, xalis niyyət. Əməlləri yalnız Allahın razılığı üçün etmək.',
      en: 'Sincerity, pure intention. Performing deeds solely for the sake of Allah.',
      ru: 'Искренность, чистое намерение. Совершение дел исключительно ради довольства Аллаха.',
      ar: 'الصدق والنية الخالصة. أداء الأعمال ابتغاء مرضاة الله وحده.',
      tr: 'Samimiyet, halis niyet. Amelleri yalnızca Allah rızası için yapmak.',
    }
  },
  {
    term: 'Təqva', ar: 'التقوى', translit: 'Taqwa',
    def: {
      az: 'Allah qorxusu, çəkinmə. Allahın əmrlərini yerinə yetirib qadağalarından çəkinmək.',
      en: 'God-consciousness, piety. Obeying Allah\'s commands and avoiding His prohibitions.',
      ru: 'Богобоязненность, благочестие. Соблюдение заповедей Аллаха и избегание Его запретов.',
      ar: 'خشية الله والورع. طاعة أوامر الله واجتناب نواهيه.',
      tr: 'Allah korkusu, sakınma. Allah\'ın emirlerini yerine getirip yasaklarından kaçınmak.',
    }
  },
  {
    term: 'Cənnət', ar: 'الجنة', translit: 'Jannah',
    def: {
      az: 'Cənnət, behişt. Axirətdə möminlərin mükafatlandırılacağı əbədi məkan.',
      en: 'Paradise. The eternal abode of reward for believers in the Hereafter.',
      ru: 'Рай. Вечная обитель вознаграждения для верующих в загробной жизни.',
      ar: 'الجنة. الدار الأبدية لمكافأة المؤمنين في الآخرة.',
      tr: 'Cennet. Ahirette müminlerin ödüllendirileceği ebedi mekan.',
    }
  },
  {
    term: 'Cəhənnəm', ar: 'جهنم', translit: 'Jahannam',
    def: {
      az: 'Cəhənnəm. Axirətdə kafir və günahkarların cəzalandırılacağı yer.',
      en: 'Hell. The place of punishment for disbelievers and sinners in the Hereafter.',
      ru: 'Ад. Место наказания для неверующих и грешников в загробной жизни.',
      ar: 'النار. مكان عقاب الكافرين والعاصين في الآخرة.',
      tr: 'Cehennem. Ahirette kafir ve günahkarların cezalandırılacağı yer.',
    }
  },
  {
    term: 'Qiyamət', ar: 'القيامة', translit: 'Qiyamah',
    def: {
      az: 'Qiyamət günü. Dünyanın sonu və bütün insanların dirildilərək hesab verəcəyi gün.',
      en: 'The Day of Judgment. The end of the world when all people will be resurrected and held accountable.',
      ru: 'Судный день. Конец мира, когда все люди будут воскрешены и призваны к ответу.',
      ar: 'يوم القيامة. نهاية العالم وبعث الناس جميعاً للحساب.',
      tr: 'Kıyamet günü. Dünyanın sonu ve tüm insanların diriltilerek hesap vereceği gün.',
    }
  },
  {
    term: 'Sirat', ar: 'الصراط', translit: 'Sirat',
    def: {
      az: 'Sirat körpüsü. Axirətdə cəhənnəmin üzərindən keçən körpü.',
      en: 'The Bridge. A bridge over Hellfire that everyone must cross on the Day of Judgment.',
      ru: 'Мост Сират. Мост над Адом, через который все должны пройти в Судный день.',
      ar: 'الصراط المستقيم. جسر فوق النار يمر عليه الجميع يوم القيامة.',
      tr: 'Sırat köprüsü. Ahirette cehennemin üzerinden geçen köprü.',
    }
  },
  {
    term: 'Səhabə', ar: 'الصحابة', translit: 'Sahabah',
    def: {
      az: 'Hz. Peyğəmbəri (s.a.s) iman edərək görən və müsəlman kimi vəfat edən şəxslər. İslamın ilk və ən fəzilətli nəsli. Peyğəmbər (s.a.s) buyurub: «Səhabələrimi söyməyin» (Buxari 3673).',
      en: 'The Companions of Prophet Muhammad (PBUH): those who met him as believers and died as Muslims. The first and most virtuous generation of Islam. The Prophet (PBUH) said: «Do not revile my Companions» (Bukhari 3673).',
      ru: 'Сподвижники Пророка Мухаммада (мир ему): те, кто встретил его, уверовав в него, и умер мусульманином. Первое и самое достойное поколение Ислама. Пророк (мир ему) сказал: «Не поносите моих сподвижников» (Бухари 3673).',
      ar: 'أصحاب النبي ﷺ: من لقيه مؤمنًا به ومات على الإسلام. وهم خير أجيال الأمة. قال ﷺ: «لا تسبوا أصحابي» (البخاري 3673).',
      tr: 'Hz. Peygamber\'i (s.a.s) iman ederek gören ve Müslüman olarak vefat eden kişiler. İslam\'ın ilk ve en faziletli nesli. Peygamber (s.a.s) şöyle buyurmuştur: «Ashabıma sövmeyin» (Buhari 3673).',
    }
  },
  {
    term: 'Tabiun', ar: 'التابعون', translit: 'Tabi\'un',
    def: {
      az: 'Səhabələri görüb müsəlman olan nəsil. İslamın ikinci nəsli.',
      en: 'The generation that met the Companions and accepted Islam. The second generation of Muslims.',
      ru: 'Поколение, встретившее сподвижников и принявшее Ислам. Второе поколение мусульман.',
      ar: 'الجيل الذي لقي الصحابة وآمن بالإسلام. الجيل الثاني من المسلمين.',
      tr: 'Sahabeleri görüp Müslüman olan nesil. İslam\'ın ikinci nesli.',
    }
  },
  // ── Aqidah (Creed) ──
  {
    term: 'Qədər', ar: 'القدر', translit: 'Qadr',
    def: {
      az: 'İlahi tale, qədər. Allahın hər şeyi əzəldən bilməsi və təqdir etməsi.',
      en: 'Divine predestination. Allah\'s eternal knowledge and decree of all things.',
      ru: 'Божественное предопределение. Извечное знание Аллаха и Его предначертание всего сущего.',
      ar: 'القضاء والقدر. علم الله الأزلي وتقديره لكل شيء.',
      tr: 'İlahi kader. Allah\'ın her şeyi ezelden bilmesi ve takdir etmesi.',
    }
  },
  {
    term: 'Qəza', ar: 'القضاء', translit: 'Qada',
    def: {
      az: 'Allahın hökm etməsi. İlahi qərarların gerçəkləşməsi.',
      en: 'Divine decree. The realization and execution of Allah\'s decisions.',
      ru: 'Божественное решение. Осуществление и исполнение решений Аллаха.',
      ar: 'حكم الله وإرادته. تحقق المقدرات الإلهية.',
      tr: 'Allah\'ın hükmü. İlahi kararların gerçekleşmesi.',
    }
  },
  {
    term: 'Yəqin', ar: 'اليقين', translit: 'Yaqin',
    def: {
      az: 'Qəti inanc, şübhəsiz iman. Heç bir şübhəsi olmayan möhkəm etiqad.',
      en: 'Certainty in faith. Firm, unwavering conviction without any doubt.',
      ru: 'Твёрдая убеждённость. Непоколебимая вера без каких-либо сомнений.',
      ar: 'الاعتقاد الجازم. الإيمان الراسخ الذي لا يخالطه شك.',
      tr: 'Kesin inanç. Hiçbir şüphesi olmayan sağlam iman.',
    }
  },
  {
    term: 'Qeyb', ar: 'الغيب', translit: 'Ghayb',
    def: {
      az: 'Görünməyən aləm. İnsan duyğularının dərk edə bilmədiyi, yalnız Allahın bildiyi şeylər.',
      en: 'The unseen. That which is beyond human perception, known only to Allah.',
      ru: 'Сокровенное. То, что находится за пределами человеческого восприятия и известно только Аллаху.',
      ar: 'عالم الغيب. ما لا تدركه الحواس البشرية ولا يعلمه إلا الله.',
      tr: 'Görünmeyen âlem. İnsan algısının ötesinde, yalnızca Allah\'ın bildiği şeyler.',
    }
  },
  {
    term: 'Fitrə', ar: 'الفطرة', translit: 'Fitrah',
    def: {
      az: 'Təbii yaradılış. İnsanın Allahı tanımaq üzrə yaradılmış təbiəti.',
      en: 'Innate nature. The natural disposition upon which humans are created, inclined toward recognizing Allah.',
      ru: 'Врождённая природа. Естественная предрасположенность человека к познанию Аллаха.',
      ar: 'الطبيعة الفطرية. الخلقة التي فطر الله الناس عليها من معرفته.',
      tr: 'Fıtrat, doğal yaratılış. İnsanın Allah\'ı tanıma üzere yaratılmış doğası.',
    }
  },
  {
    term: 'Ruh', ar: 'الروح', translit: 'Ruh',
    def: {
      az: 'Ruh, can. Allahın yaratdığı və bədənə üfürdüyü, bədəni canlandıran məxluq. «Ruhumdan üfürdüm» (Hicr 15:29) ifadəsi şərəfləndirmə izafətidir: ruh Allahın sifəti deyil, Onun məxluqudur.',
      en: 'The soul, spirit. A creation of Allah that He breathed into the body, giving it life. «I breathed into him of My spirit» (Al-Hijr 15:29) is an attribution of honor: the soul is not an attribute of Allah but His creation.',
      ru: 'Душа, дух. Творение Аллаха, которое Он вдохнул в тело, оживляя его. Слова «вдохнул в него от Моего духа» (аль-Хиджр 15:29) — присоединение ради почёта: душа не атрибут Аллаха, а Его творение.',
      ar: 'الروح. مخلوق خلقه الله ونفخه في الجسد فحيي به. وإضافتها إلى الله في قوله: «ونفخت فيه من روحي» (الحجر: 29) إضافة تشريف، فهي مخلوقة وليست صفة لله.',
      tr: 'Ruh, can. Allah\'ın yarattığı ve bedene üflediği, bedeni canlandıran mahluk. «Ona ruhumdan üfledim» (Hicr 15:29) ifadesi şereflendirme izafetidir: ruh Allah\'ın sıfatı değil, O\'nun yarattığıdır.',
    }
  },
  {
    term: 'Nəfs', ar: 'النفس', translit: 'Nafs',
    def: {
      az: 'Nəfs, ego. İnsanın daxili istəkləri və meylləri; üç mərtəbəsi var: əmmarə, ləvvamə və mutməinnə.',
      en: 'The self, ego. The inner desires and inclinations of a person; it has three levels: commanding, self-reproaching, and tranquil.',
      ru: 'Душа, эго. Внутренние желания и склонности человека; имеет три уровня: повелевающая, порицающая и умиротворённая.',
      ar: 'النفس. الرغبات والميول الداخلية للإنسان؛ لها ثلاث مراتب: الأمارة واللوامة والمطمئنة.',
      tr: 'Nefis, ego. İnsanın iç istekleri ve eğilimleri; üç mertebesi vardır: emmare, levvame ve mutmainne.',
    }
  },
  {
    term: 'Bərzəx', ar: 'البرزخ', translit: 'Barzakh',
    def: {
      az: 'Qəbir həyatı. Ölümlə qiyamət arasındakı aralıq dövr.',
      en: 'The intermediate realm. The period between death and the Day of Resurrection.',
      ru: 'Промежуточный мир. Период между смертью и Днём Воскресения.',
      ar: 'عالم البرزخ. الفترة بين الموت ويوم القيامة.',
      tr: 'Kabir hayatı. Ölüm ile kıyamet arasındaki ara dönem.',
    }
  },
  {
    term: 'Mizan', ar: 'الميزان', translit: 'Mizan',
    def: {
      az: 'Tərəzi. Qiyamət günü əməllərin çəkiləcəyi ilahi tərəzi.',
      en: 'The Scale. The divine scale on which deeds will be weighed on the Day of Judgment.',
      ru: 'Весы. Божественные весы, на которых будут взвешены деяния в Судный день.',
      ar: 'الميزان. الذي توزن فيه أعمال العباد يوم القيامة.',
      tr: 'Terazi. Kıyamet gününde amellerin tartılacağı ilahi terazi.',
    }
  },
  {
    term: 'Şəfaət', ar: 'الشفاعة', translit: 'Shafa\'ah',
    def: {
      az: 'Şəfaət, vasitəçilik. Qiyamət günü peyğəmbərlərin və salehlərin möminlər üçün Allahdan bağışlanma diləməsi. Şəfaət yalnız Allahın izni ilə və Onun razı olduğu kəs üçün olur (Bəqərə 2:255; Nəcm 53:26).',
      en: 'Intercession. The act of prophets and righteous people seeking Allah\'s forgiveness on behalf of believers on the Day of Judgment. It occurs only with Allah\'s permission and for those He is pleased with (Al-Baqarah 2:255; An-Najm 53:26).',
      ru: 'Заступничество. Просьба пророков и праведников о прощении верующих перед Аллахом в Судный день. Оно бывает лишь с дозволения Аллаха и за тех, кем Он доволен (аль-Бакара 2:255; ан-Наджм 53:26).',
      ar: 'الشفاعة. طلب الأنبياء والصالحين العفو من الله للمؤمنين يوم القيامة. ولا تكون إلا بإذن الله ولمن يرضى عنه (البقرة: 255؛ النجم: 26).',
      tr: 'Şefaat. Kıyamet gününde peygamberlerin ve salih kişilerin müminler için Allah\'tan bağışlanma dilemesi. Ancak Allah\'ın izniyle ve O\'nun razı olduğu kimse için olur (Bakara 2:255; Necm 53:26).',
    }
  },
  {
    term: 'Ərş', ar: 'العرش', translit: 'Arsh',
    def: {
      az: 'Allahın Ərşi. Məxluqatın ən böyüyü və ən ucası olan həqiqi taxt; Allah onun üzərinə istiva etmişdir (Taha 20:5) — necəliyi soruşulmadan və məxluqa bənzədilmədən.',
      en: 'The Throne of Allah. A real throne, the greatest and highest of all creations; Allah rose over it (Ta-Ha 20:5) without asking how and without likening Him to creation.',
      ru: 'Трон Аллаха. Настоящий трон, величайшее и наивысшее из творений; Аллах вознёсся над ним (Та Ха 20:5) — без вопроса «как» и без уподобления творению.',
      ar: 'عرش الله. سرير حقيقي، وهو أعظم المخلوقات وأعلاها، استوى الله عليه (طه: 5) استواءً يليق بجلاله من غير تكييف ولا تمثيل.',
      tr: 'Allah\'ın Arşı. Yaratılmışların en büyüğü ve en yücesi olan gerçek taht; Allah onun üzerine istiva etmiştir (Tâhâ 20:5) — nasıl olduğu sorulmadan ve yaratılmışlara benzetilmeden.',
    }
  },
  {
    term: 'Kürsi', ar: 'الكرسي', translit: 'Kursi',
    def: {
      az: 'Kürsi. İbn Abbasın (r.a.) səhih rəvayətinə görə «iki qədəmin yeri»dir; Ərşdən kiçik, göylərdən və yerdən böyükdür (Bəqərə 2:255).',
      en: 'The Footstool. According to the authentic report from Ibn Abbas (RA), it is «the place of the two Feet»; it is smaller than the Throne but greater than the heavens and earth (Al-Baqarah 2:255).',
      ru: 'Курси (Подножие). Согласно достоверному сообщению от Ибн Аббаса (да будет доволен им Аллах), это «место двух Стоп»; оно меньше Трона, но больше небес и земли (аль-Бакара 2:255).',
      ar: 'الكرسي. قال ابن عباس رضي الله عنهما: «الكرسي موضع القدمين» (صححه الألباني موقوفًا في مختصر العلو)؛ وهو أصغر من العرش وأكبر من السماوات والأرض (البقرة: 255).',
      tr: 'Kürsî. İbn Abbas\'tan (r.a.) gelen sahih rivayete göre «iki ayağın yeri»dir; Arş\'tan küçük, göklerden ve yerden büyüktür (Bakara 2:255).',
    }
  },
  {
    term: 'Lövhi-Məhfuz', ar: 'اللوح المحفوظ', translit: 'Lawh Mahfuz',
    def: {
      az: 'Qorunmuş lövhə. Allahın qəza və qədərlərinin, keçmiş və gələcək hər şeyin yazıldığı ilahi lövhə.',
      en: 'The Preserved Tablet. The divine tablet on which Allah\'s decrees and all past and future events are written.',
      ru: 'Хранимая Скрижаль. Божественная скрижаль, на которой записаны все решения Аллаха и все прошлые и будущие события.',
      ar: 'اللوح المحفوظ. اللوح الذي كُتبت فيه مقادير كل شيء من الماضي والمستقبل.',
      tr: 'Levh-i Mahfuz. Allah\'ın kaza ve kaderlerinin, geçmiş ve gelecek her şeyin yazıldığı ilahi levha.',
    }
  },
  // ── Fiqh (Jurisprudence) ──
  {
    term: 'Təharət', ar: 'الطهارة', translit: 'Tahara',
    def: {
      az: 'Təmizlik, paklıq. İbadət üçün bədən və paltarın təmiz olması şərti.',
      en: 'Ritual purity, cleanliness. The prerequisite of bodily and clothing purity for acts of worship.',
      ru: 'Ритуальная чистота. Условие чистоты тела и одежды для совершения поклонения.',
      ar: 'الطهارة. شرط نظافة البدن والثوب لأداء العبادات.',
      tr: 'Taharet, temizlik. İbadet için beden ve elbise temizliği şartı.',
    }
  },
  {
    term: 'Qüsl', ar: 'الغسل', translit: 'Ghusl',
    def: {
      az: 'Boy dəstəmazı. Bütün bədənin su ilə yuyulması ilə əldə olunan böyük təharət.',
      en: 'Full ritual bath. Major purification achieved by washing the entire body with water.',
      ru: 'Полное ритуальное омовение. Большое очищение путём омовения всего тела водой.',
      ar: 'الغسل. الطهارة الكبرى بغسل جميع البدن بالماء.',
      tr: 'Boy abdesti. Tüm bedenin su ile yıkanmasıyla elde edilen büyük taharet.',
    }
  },
  {
    term: 'Təyəmmüm', ar: 'التيمم', translit: 'Tayammum',
    def: {
      az: 'Torpaqla təmizlənmə. Su olmadıqda və ya istifadəsi zərərli olduqda torpaqla edilən təharət.',
      en: 'Dry ablution. Purification using clean earth or sand when water is unavailable or harmful to use.',
      ru: 'Сухое омовение. Очищение чистой землёй или песком при отсутствии воды или вреде от её использования.',
      ar: 'التيمم. التطهر بالتراب عند عدم وجود الماء أو عند الضرر من استخدامه.',
      tr: 'Teyemmüm. Su bulunmadığında veya kullanımı zararlı olduğunda toprakla yapılan taharet.',
    }
  },
  {
    term: 'Azan', ar: 'الأذان', translit: 'Adhan',
    def: {
      az: 'Namaza çağırış. Namaz vaxtının girməsini xəbər verən səsli elan.',
      en: 'The call to prayer. The vocal announcement declaring the time of prayer has arrived.',
      ru: 'Призыв к молитве. Голосовое объявление о наступлении времени молитвы.',
      ar: 'الأذان. النداء الذي يُعلن دخول وقت الصلاة.',
      tr: 'Ezan. Namaz vaktinin girdiğini haber veren sesli ilan.',
    }
  },
  {
    term: 'İqamə', ar: 'الإقامة', translit: 'Iqamah',
    def: {
      az: 'Namaza başlamağa çağırış. Fərz namazından dərhal əvvəl oxunan ikinci azan.',
      en: 'The second call to prayer. Recited immediately before the obligatory prayer begins.',
      ru: 'Второй призыв к молитве. Произносится непосредственно перед началом обязательной молитвы.',
      ar: 'الإقامة. النداء الثاني الذي يُقال قبل بدء الصلاة المفروضة مباشرة.',
      tr: 'Kamet. Farz namazından hemen önce okunan ikinci ezan.',
    }
  },
  {
    term: 'Qiblə', ar: 'القبلة', translit: 'Qiblah',
    def: {
      az: 'Namaz istiqaməti. Müsəlmanların namaz qılarkən üzlərini tutduğu Kəbə istiqaməti.',
      en: 'The direction of prayer. The direction of the Kaaba in Mecca, which Muslims face during prayer.',
      ru: 'Направление молитвы. Направление Каабы в Мекке, в сторону которой мусульмане обращаются во время молитвы.',
      ar: 'القبلة. اتجاه الكعبة في مكة الذي يتوجه إليه المسلمون في الصلاة.',
      tr: 'Kıble. Müslümanların namaz kılarken yöneldikleri Kâbe istikameti.',
    }
  },
  {
    term: 'Rükət', ar: 'الركعة', translit: 'Rak\'ah',
    def: {
      az: 'Namazın bir vahidi. Qiyam, rüku, iki səcdə və aralarındakı zikrlərdən ibarət ibadət vahidi.',
      en: 'A unit of prayer. A cycle consisting of standing, bowing, two prostrations, and the supplications between them.',
      ru: 'Единица молитвы. Цикл, состоящий из стояния, поясного поклона, двух земных поклонов и молитв между ними.',
      ar: 'الركعة. وحدة الصلاة المكونة من القيام والركوع والسجدتين والأذكار بينهما.',
      tr: 'Rekât. Kıyam, rükû, iki secde ve aralarındaki zikirlerden oluşan namaz birimi.',
    }
  },
  {
    term: 'Səcdə', ar: 'السجود', translit: 'Sujud',
    def: {
      az: 'Səcdə. Namazda alnı, burnu, əlləri, dizləri və ayaq barmaqlarını yerə qoymaqla edilən ibadət hərəkəti.',
      en: 'Prostration. The act of placing the forehead, nose, hands, knees, and toes on the ground during prayer.',
      ru: 'Земной поклон. Действие, при котором лоб, нос, руки, колени и пальцы ног касаются земли во время молитвы.',
      ar: 'السجود. وضع الجبهة والأنف واليدين والركبتين وأطراف القدمين على الأرض في الصلاة.',
      tr: 'Secde. Namazda alın, burun, eller, dizler ve ayak parmaklarını yere koymakla yapılan ibadet hareketi.',
    }
  },
  {
    term: 'Rüku', ar: 'الركوع', translit: 'Ruku',
    def: {
      az: 'Rüku. Namazda əyilərək əlləri dizlərə qoymaq və Allahı təsbih etmək.',
      en: 'Bowing. Bending forward with hands on the knees during prayer while glorifying Allah.',
      ru: 'Поясной поклон. Наклон вперёд с руками на коленях во время молитвы с восхвалением Аллаха.',
      ar: 'الركوع. الانحناء مع وضع اليدين على الركبتين وتسبيح الله في الصلاة.',
      tr: 'Rükû. Namazda eğilerek elleri dizlere koymak ve Allah\'ı tesbih etmek.',
    }
  },
  {
    term: 'Qunut', ar: 'القنوت', translit: 'Qunut',
    def: {
      az: 'Qunut duası. Namazda, xüsusilə vitr namazında oxunan xüsusi dua.',
      en: 'Qunut supplication. A special prayer recited during prayer, particularly in the Witr prayer.',
      ru: 'Молитва Кунут. Особая мольба, произносимая во время молитвы, особенно в намазе Витр.',
      ar: 'دعاء القنوت. دعاء خاص يُقرأ في الصلاة وخاصة في صلاة الوتر.',
      tr: 'Kunut duası. Namazda, özellikle vitir namazında okunan özel dua.',
    }
  },
  {
    term: 'Cənazə', ar: 'الجنازة', translit: 'Janazah',
    def: {
      az: 'Cənazə namazı. Ölmüş müsəlman üçün qılınan kollektiv namaz.',
      en: 'Funeral prayer. The congregational prayer performed for a deceased Muslim.',
      ru: 'Погребальная молитва. Коллективная молитва, совершаемая за умершего мусульманина.',
      ar: 'صلاة الجنازة. الصلاة الجماعية على المسلم المتوفى.',
      tr: 'Cenaze namazı. Vefat eden Müslüman için kılınan cemaat namazı.',
    }
  },
  {
    term: 'Kəfən', ar: 'الكفن', translit: 'Kafan',
    def: {
      az: 'Kəfən. Ölünün sarıldığı ağ parça; dəfn prosesinin vacib hissəsi.',
      en: 'Burial shroud. The white cloth in which the deceased is wrapped; an essential part of the burial process.',
      ru: 'Саван. Белая ткань, в которую оборачивают умершего; обязательная часть погребения.',
      ar: 'الكفن. القماش الأبيض الذي يُلف فيه الميت؛ جزء واجب من عملية الدفن.',
      tr: 'Kefen. Ölünün sarıldığı beyaz kumaş; defin sürecinin zorunlu parçası.',
    }
  },
  {
    term: 'Nikah', ar: 'النكاح', translit: 'Nikah',
    def: {
      az: 'İslami evlənmə müqaviləsi. Kişi ilə qadın arasında şəriətə uyğun bağlanan ailə müqaviləsi.',
      en: 'Islamic marriage contract. A lawful union between a man and a woman according to Islamic law.',
      ru: 'Исламский брачный договор. Законный союз между мужчиной и женщиной по исламскому праву.',
      ar: 'عقد الزواج الإسلامي. العقد الشرعي بين الرجل والمرأة.',
      tr: 'İslami evlilik akdi. Erkek ile kadın arasında şeriata uygun kurulan aile sözleşmesi.',
    }
  },
  {
    term: 'Talaq', ar: 'الطلاق', translit: 'Talaq',
    def: {
      az: 'Boşanma. İslam hüququna görə nikah müqaviləsinin pozulması.',
      en: 'Divorce. The dissolution of the marriage contract according to Islamic law.',
      ru: 'Развод. Расторжение брачного договора по исламскому праву.',
      ar: 'الطلاق. فسخ عقد الزواج وفق الشريعة الإسلامية.',
      tr: 'Boşanma. İslam hukukuna göre nikâh akdinin sona erdirilmesi.',
    }
  },
  {
    term: 'Mehr', ar: 'المهر', translit: 'Mahr',
    def: {
      az: 'Mehr. Kişinin evlənərkən qadına verməsi vacib olan maddi hədiyyə.',
      en: 'Bridal gift. A mandatory gift of money or property that the groom gives to the bride upon marriage.',
      ru: 'Махр. Обязательный подарок в виде денег или имущества, который жених даёт невесте при заключении брака.',
      ar: 'المهر. العطية المالية الواجبة التي يقدمها الزوج للزوجة عند الزواج.',
      tr: 'Mehir. Erkeğin evlenirken kadına vermesi gereken zorunlu maddi hediye.',
    }
  },
  {
    term: 'Xülə', ar: 'الخلع', translit: 'Khula',
    def: {
      az: 'Xülə. Qadının mehr və ya əvəz ödəyərək əldə etdiyi boşanma növü.',
      en: 'Khula divorce. A form of divorce initiated by the wife in exchange for returning the mahr or compensation.',
      ru: 'Хула. Вид развода по инициативе жены в обмен на возврат махра или компенсации.',
      ar: 'الخلع. نوع من الطلاق تطلبه الزوجة مقابل إعادة المهر أو تعويض.',
      tr: 'Hul\'. Kadının mehri veya bedeli iade ederek elde ettiği boşanma türü.',
    }
  },
  {
    term: 'İddə', ar: 'العدة', translit: 'Iddah',
    def: {
      az: 'Gözləmə müddəti. Boşanma və ya ərin ölümündən sonra qadının yenidən evlənə bilməyəcəyi müddət.',
      en: 'Waiting period. The period a woman must observe after divorce or her husband\'s death before she can remarry.',
      ru: 'Период ожидания. Период, который женщина должна выждать после развода или смерти мужа, прежде чем вступить в новый брак.',
      ar: 'العدة. المدة التي تنتظرها المرأة بعد الطلاق أو وفاة الزوج قبل الزواج مرة أخرى.',
      tr: 'İddet. Boşanma veya eşin vefatından sonra kadının yeniden evlenemeyeceği bekleme süresi.',
    }
  },
  {
    term: 'Nəfəqə', ar: 'النفقة', translit: 'Nafaqah',
    def: {
      az: 'Ailə xərcləri. Kişinin həyat yoldaşı və uşaqlarının maddi ehtiyaclarını qarşılama öhdəliyi.',
      en: 'Financial maintenance. A husband\'s obligation to provide for the material needs of his wife and children.',
      ru: 'Содержание семьи. Обязанность мужа обеспечивать материальные потребности жены и детей.',
      ar: 'النفقة. التزام الزوج بالإنفاق على زوجته وأولاده.',
      tr: 'Nafaka. Erkeğin eşi ve çocuklarının maddi ihtiyaçlarını karşılama yükümlülüğü.',
    }
  },
  {
    term: 'Hədanə', ar: 'الحضانة', translit: 'Hadanah',
    def: {
      az: 'Uşaqlara qəyyumluq. Boşanmadan sonra uşaqların himayə və baxım hüququ.',
      en: 'Child custody. The right to care for and raise children after divorce.',
      ru: 'Опека над детьми. Право на заботу и воспитание детей после развода.',
      ar: 'الحضانة. حق رعاية الأطفال وتربيتهم بعد الطلاق.',
      tr: 'Çocuk velayeti. Boşanmadan sonra çocukların bakım ve yetiştirilme hakkı.',
    }
  },
  {
    term: 'Vəsiyyət', ar: 'الوصية', translit: 'Wasiyyah',
    def: {
      az: 'Vəsiyyət. İnsanın ölümündən sonra malının necə paylanacağına dair göstərişi; malın üçdə birindən çox ola bilməz.',
      en: 'Bequest, will. A person\'s instructions for distributing their wealth after death; it cannot exceed one-third of the estate.',
      ru: 'Завещание. Указания человека о распределении его имущества после смерти; не может превышать одну треть наследства.',
      ar: 'الوصية. ما يوصي به الإنسان في ماله بعد وفاته؛ لا تتجاوز ثلث التركة.',
      tr: 'Vasiyet. Kişinin ölümünden sonra malının nasıl dağıtılacağına dair talimatı; malın üçte birini geçemez.',
    }
  },
  {
    term: 'Miras', ar: 'الميراث', translit: 'Mirath',
    def: {
      az: 'Miras. İslam hüququna görə vəfat edənin malının varisləri arasında paylanması qaydaları.',
      en: 'Inheritance. The rules governing the distribution of a deceased person\'s estate among heirs according to Islamic law.',
      ru: 'Наследование. Правила распределения имущества умершего между наследниками по исламскому праву.',
      ar: 'الميراث. أحكام توزيع تركة المتوفى بين الورثة وفق الشريعة الإسلامية.',
      tr: 'Miras. İslam hukukuna göre vefat edenin malının varisler arasında paylaştırılması kuralları.',
    }
  },
  {
    term: 'Vəqf', ar: 'الوقف', translit: 'Waqf',
    def: {
      az: 'Xeyriyyə fondu. Malın Allah yolunda əbədi olaraq xeyriyyə məqsədlərinə ayrılması.',
      en: 'Endowment. The permanent dedication of property for charitable purposes in the way of Allah.',
      ru: 'Вакф, пожертвование. Бессрочное выделение имущества на благотворительные цели на пути Аллаха.',
      ar: 'الوقف. تخصيص المال بشكل دائم لأغراض خيرية في سبيل الله.',
      tr: 'Vakıf. Malın Allah yolunda kalıcı olarak hayır amaçlarına tahsis edilmesi.',
    }
  },
  {
    term: 'Hibə', ar: 'الهبة', translit: 'Hibah',
    def: {
      az: 'Hədiyyə, bəxşiş. Əvəzsiz olaraq başqasına mal bağışlamaq.',
      en: 'Gift, donation. Giving property to another person without expecting compensation.',
      ru: 'Дар, подарок. Безвозмездная передача имущества другому человеку.',
      ar: 'الهبة. التبرع بالمال لشخص آخر دون عوض.',
      tr: 'Hibe, bağış. Karşılıksız olarak başkasına mal bağışlamak.',
    }
  },
  // ── Quran Sciences ──
  {
    term: 'Təcvid', ar: 'التجويد', translit: 'Tajwid',
    def: {
      az: 'Quranı düzgün oxuma elmi. Hərflərin məxrəc və sifətlərinə riayət edərək Quranı gözəl oxumaq.',
      en: 'The science of Quran recitation. The art of reciting the Quran correctly, observing proper pronunciation of each letter.',
      ru: 'Наука правильного чтения Корана. Искусство чтения Корана с соблюдением правильного произношения каждой буквы.',
      ar: 'علم التجويد. فن قراءة القرآن مع مراعاة مخارج الحروف وصفاتها.',
      tr: 'Tecvid. Harflerin mahreç ve sıfatlarına riayet ederek Kuran\'ı güzel okuma ilmi.',
    }
  },
  {
    term: 'Hifz', ar: 'الحفظ', translit: 'Hifz',
    def: {
      az: 'Quranı əzbərləmə. Quranı bütövlüklə əzbərləyən şəxsə "hafiz" deyilir.',
      en: 'Memorization of the Quran. A person who has memorized the entire Quran is called a "hafiz."',
      ru: 'Заучивание Корана наизусть. Человек, выучивший весь Коран, называется «хафизом».',
      ar: 'حفظ القرآن. من حفظ القرآن كاملاً يُسمى حافظاً.',
      tr: 'Kuran\'ı ezberleme. Kuran\'ı tamamen ezberleyen kişiye "hafız" denir.',
    }
  },
  {
    term: 'Əsbab ən-Nüzul', ar: 'أسباب النزول', translit: 'Asbab an-Nuzul',
    def: {
      az: 'Nazil olma səbəbləri. Quran ayələrinin hansı hadisə və ya sual nəticəsində endirildiyi.',
      en: 'Occasions of revelation. The events or questions that prompted the revelation of specific Quranic verses.',
      ru: 'Причины ниспослания. События или вопросы, послужившие поводом для ниспослания конкретных аятов Корана.',
      ar: 'أسباب النزول. الأحداث أو الأسئلة التي نزلت بسببها آيات قرآنية معينة.',
      tr: 'Nüzul sebepleri. Kuran ayetlerinin hangi olay veya soru üzerine indirildiği.',
    }
  },
  {
    term: 'Nasix', ar: 'الناسخ', translit: 'Nasikh',
    def: {
      az: 'Nəsx edən. Əvvəlki hökmü ləğv edən yeni ayə və ya hökm.',
      en: 'The abrogating. A new verse or ruling that supersedes a previous one.',
      ru: 'Отменяющее. Новый аят или положение, отменяющее предыдущее.',
      ar: 'الناسخ. الآية أو الحكم الجديد الذي يُلغي حكماً سابقاً.',
      tr: 'Nâsih. Önceki hükmü kaldıran yeni ayet veya hüküm.',
    }
  },
  {
    term: 'Mənsux', ar: 'المنسوخ', translit: 'Mansukh',
    def: {
      az: 'Nəsx edilmiş. Başqa bir ayə ilə hökmü ləğv olunmuş əvvəlki ayə.',
      en: 'The abrogated. A previous verse whose ruling has been superseded by a later revelation.',
      ru: 'Отменённое. Предыдущий аят, положение которого было отменено более поздним откровением.',
      ar: 'المنسوخ. الآية التي أُلغي حكمها بآية لاحقة.',
      tr: 'Mensûh. Hükmü başka bir ayetle kaldırılmış önceki ayet.',
    }
  },
  {
    term: 'Möhkəm', ar: 'المحكم', translit: 'Muhkam',
    def: {
      az: 'Açıq mənalı ayə. Mənası aydın və birmənalı olan Quran ayələri.',
      en: 'Clear, unambiguous verse. Quranic verses whose meaning is definitive and evident.',
      ru: 'Ясный аят. Аяты Корана с определённым и однозначным смыслом.',
      ar: 'المحكم. الآيات القرآنية ذات المعنى الواضح والمحدد.',
      tr: 'Muhkem. Anlamı açık ve kesin olan Kuran ayetleri.',
    }
  },
  {
    term: 'Mütəşabih', ar: 'المتشابه', translit: 'Mutashabih',
    def: {
      az: 'Mənası bəzi insanlara aydın olmayan ayələr; möhkəm ayələrə qaytarılaraq anlaşılır (Ali İmran 3:7). Allahın sifət ayələrinin mənası məlumdur, keyfiyyəti isə yalnız Allaha məlumdur.',
      en: 'Verses whose meaning is unclear to some people; they are understood by referring them back to the clear (muhkam) verses (Al Imran 3:7). The meanings of the verses on Allah\'s attributes are known, while their «how» is known only to Allah.',
      ru: 'Аяты, смысл которых неясен для некоторых людей; они понимаются через возвращение к ясным (мухкам) аятам (Аль Имран 3:7). Смысл аятов об атрибутах Аллаха известен, а их образ («как») ведом лишь Аллаху.',
      ar: 'المتشابه. الآيات التي يخفى معناها على بعض الناس، فتُرد إلى المحكم ليتضح معناها (آل عمران: 7). وآيات الصفات معلومة المعنى، أما كيفيتها فلا يعلمها إلا الله.',
      tr: 'Müteşabih. Anlamı bazı insanlara açık olmayan ayetler; muhkem ayetlere döndürülerek anlaşılır (Âl-i İmrân 3:7). Allah\'ın sıfat ayetlerinin anlamı bilinir, keyfiyeti ise yalnız Allah\'a malumdur.',
    }
  },
  {
    term: 'Məkki', ar: 'المكي', translit: 'Makki',
    def: {
      az: 'Məkkə dövründə nazil olan surələr. Hicrətdən əvvəl endirilən ayə və surələr.',
      en: 'Meccan surahs. The chapters and verses revealed before the migration to Medina.',
      ru: 'Мекканские суры. Главы и аяты, ниспосланные до переселения в Медину.',
      ar: 'السور المكية. السور والآيات التي نزلت قبل الهجرة إلى المدينة.',
      tr: 'Mekkî sureler. Hicretten önce indirilen ayet ve sureler.',
    }
  },
  {
    term: 'Mədəni', ar: 'المدني', translit: 'Madani',
    def: {
      az: 'Mədinə dövründə nazil olan surələr. Hicrətdən sonra endirilən ayə və surələr.',
      en: 'Medinan surahs. The chapters and verses revealed after the migration to Medina.',
      ru: 'Мединские суры. Главы и аяты, ниспосланные после переселения в Медину.',
      ar: 'السور المدنية. السور والآيات التي نزلت بعد الهجرة إلى المدينة.',
      tr: 'Medenî sureler. Hicretten sonra indirilen ayet ve sureler.',
    }
  },
  {
    term: 'Cüz', ar: 'الجزء', translit: 'Juz',
    def: {
      az: 'Quranın otuzda bir hissəsi. Quran 30 cüzə bölünmüşdür.',
      en: 'One-thirtieth of the Quran. The Quran is divided into 30 equal parts called juz.',
      ru: 'Одна тридцатая часть Корана. Коран разделён на 30 равных частей, называемых джузами.',
      ar: 'الجزء. واحد من ثلاثين قسماً متساوياً للقرآن الكريم.',
      tr: 'Cüz. Kuran\'ın otuzda bir parçası. Kuran 30 cüze ayrılmıştır.',
    }
  },
  {
    term: 'Hizb', ar: 'الحزب', translit: 'Hizb',
    def: {
      az: 'Quranın altmışda bir hissəsi. Hər cüz iki hizbə bölünür, cəmi 60 hizb.',
      en: 'One-sixtieth of the Quran. Each juz is divided into two hizbs, totaling 60 hizbs.',
      ru: 'Одна шестидесятая часть Корана. Каждый джуз делится на два хизба, всего 60 хизбов.',
      ar: 'الحزب. واحد من ستين قسماً للقرآن؛ كل جزء ينقسم إلى حزبين.',
      tr: 'Hizb. Kuran\'ın altmışta bir parçası. Her cüz iki hizbe ayrılır, toplamda 60 hizb.',
    }
  },
  {
    term: 'Mənzil', ar: 'المنزل', translit: 'Manzil',
    def: {
      az: 'Quranın yeddidə bir hissəsi. Quranı bir həftəyə xətm etmək üçün 7 mənzilə bölünməsi.',
      en: 'One-seventh of the Quran. A division of the Quran into 7 parts for completing its recitation in one week.',
      ru: 'Одна седьмая часть Корана. Деление Корана на 7 частей для полного прочтения за одну неделю.',
      ar: 'المنزل. تقسيم القرآن إلى سبعة أقسام لختمه في أسبوع.',
      tr: 'Menzil. Kuran\'ın yedide bir parçası. Kuran\'ı bir haftada hatmetmek için 7 menzile bölünmesi.',
    }
  },
  {
    term: 'Səcdə Tilavət', ar: 'سجدة التلاوة', translit: 'Sajdah Tilawah',
    def: {
      az: 'Tilavət səcdəsi. Quranda səcdə ayəsi oxunduqda və ya dinlənildikdə edilən səcdə. Alimlərin çoxuna görə sünnədir (Ömər r.a.: «Allah səcdəni bizə fərz etməyib, istəsək edərik» — Buxari 1077); Hənəfilərə görə vacibdir.',
      en: 'Prostration of recitation. A prostration made when reciting or hearing a verse of prostration in the Quran. Most scholars hold it is sunnah (Umar (RA): «Allah has not made prostration obligatory on us unless we wish» — Bukhari 1077); the Hanafis hold it is obligatory.',
      ru: 'Земной поклон при чтении. Поклон, совершаемый при чтении или слушании аята поклона в Коране. Большинство учёных считают его сунной (Умар: «Аллах не вменил нам поклон в обязанность, но если пожелаем — совершим» — Бухари 1077); ханафиты считают его обязательным.',
      ar: 'سجدة التلاوة. السجود عند قراءة أو سماع آية سجدة في القرآن. وهي سنة عند جمهور العلماء لقول عمر رضي الله عنه: «إن الله لم يفرض السجود إلا أن نشاء» (البخاري 1077)، وأوجبها الحنفية.',
      tr: 'Tilavet secdesi. Kuran\'da secde ayeti okunduğunda veya dinlendiğinde yapılan secde. Âlimlerin çoğunluğuna göre sünnettir (Hz. Ömer: «Allah secdeyi bize farz kılmadı, dilersek yaparız» — Buhari 1077); Hanefilere göre vaciptir.',
    }
  },
  // ── Hadith Sciences ──
  {
    term: 'İsnad', ar: 'الإسناد', translit: 'Isnad',
    def: {
      az: 'Sənəd, rəvayətçilər silsiləsi. Hədisi Peyğəmbərə (s.a.s) qədər çatdıran ravilərin adları.',
      en: 'Chain of narration. The chain of narrators who transmitted a hadith back to the Prophet (PBUH).',
      ru: 'Цепочка передатчиков. Цепь рассказчиков, передавших хадис до Пророка (мир ему).',
      ar: 'الإسناد. سلسلة الرواة الذين نقلوا الحديث إلى النبي ﷺ.',
      tr: 'İsnad. Hadisi Peygamber\'e (s.a.s) kadar ulaştıran ravilerin silsilesi.',
    }
  },
  {
    term: 'Mətn', ar: 'المتن', translit: 'Matn',
    def: {
      az: 'Hədisin mətni. İsnaddan sonra gələn hədisin əsas məzmunu.',
      en: 'The text of the hadith. The actual content of the hadith that comes after the chain of narration.',
      ru: 'Текст хадиса. Основное содержание хадиса, следующее за цепочкой передатчиков.',
      ar: 'المتن. المحتوى الأساسي للحديث الذي يأتي بعد الإسناد.',
      tr: 'Metin. İsnaddan sonra gelen hadisin asıl içeriği.',
    }
  },
  {
    term: 'Səhih', ar: 'الصحيح', translit: 'Sahih',
    def: {
      az: 'Doğru, etibarlı hədis. Sənədi qırılmadan Peyğəmbərə çatan və raviləri etibarlı olan hədis.',
      en: 'Authentic hadith. A hadith with an unbroken chain of trustworthy narrators reaching the Prophet.',
      ru: 'Достоверный хадис. Хадис с непрерывной цепочкой надёжных передатчиков до Пророка.',
      ar: 'الحديث الصحيح. الحديث المتصل السند بالرواة الثقات إلى النبي ﷺ.',
      tr: 'Sahih hadis. Senedi kesintisiz olarak Peygamber\'e ulaşan ve ravileri güvenilir olan hadis.',
    }
  },
  {
    term: 'Həsən', ar: 'الحسن', translit: 'Hasan',
    def: {
      az: 'Yaxşı hədis. Səhih hədisin şərtlərinə yaxın, lakin ravilərdən birinin hafizəsi bir az zəif olan hədis.',
      en: 'Good hadith. A hadith close to the sahih level but with a narrator whose memory is slightly less precise.',
      ru: 'Хороший хадис. Хадис, близкий к достоверному, но с передатчиком, чья память чуть менее точна.',
      ar: 'الحديث الحسن. الحديث القريب من الصحيح لكن فيه راوٍ خفّ ضبطه قليلاً.',
      tr: 'Hasen hadis. Sahih hadise yakın ancak ravilerinden birinin hafızası biraz zayıf olan hadis.',
    }
  },
  {
    term: 'Zəif', ar: 'الضعيف', translit: 'Da\'if',
    def: {
      az: 'Zəif hədis. Sənədində və ya mətnində problem olan, dəlil kimi istifadə olunmayan hədis.',
      en: 'Weak hadith. A hadith with a deficiency in its chain or content, not used as primary evidence.',
      ru: 'Слабый хадис. Хадис с недостатком в цепочке передатчиков или содержании, не используемый как основное доказательство.',
      ar: 'الحديث الضعيف. الحديث الذي فيه خلل في السند أو المتن ولا يُحتج به.',
      tr: 'Zayıf hadis. Senedinde veya metninde sorun olan, delil olarak kullanılmayan hadis.',
    }
  },
  {
    term: 'Mövzu', ar: 'الموضوع', translit: 'Mawdu',
    def: {
      az: 'Uydurma hədis. Peyğəmbərə (s.a.s) yalan nisbət verilmiş söz; hədis hesab olunmur.',
      en: 'Fabricated hadith. A statement falsely attributed to the Prophet (PBUH); not considered a hadith at all.',
      ru: 'Подложный хадис. Высказывание, ложно приписанное Пророку (мир ему); вообще не считается хадисом.',
      ar: 'الحديث الموضوع. كلام مكذوب على النبي ﷺ ولا يُعدّ حديثاً.',
      tr: 'Mevzu hadis. Peygamber\'e (s.a.s) yalan olarak nispet edilen söz; hadis sayılmaz.',
    }
  },
  {
    term: 'Mütəvatir', ar: 'المتواتر', translit: 'Mutawatir',
    def: {
      az: 'Mütəvatir hədis. Hər təbəqədə yalan üzrə ittifaq etmələri mümkün olmayan çox sayda ravinin rəvayət etdiyi hədis.',
      en: 'Mutawatir hadith. A hadith narrated by such a large number of people at every level that fabrication is impossible.',
      ru: 'Мутаватир хадис. Хадис, переданный на каждом уровне таким большим числом людей, что подделка невозможна.',
      ar: 'الحديث المتواتر. الحديث الذي رواه عدد كبير في كل طبقة يستحيل تواطؤهم على الكذب.',
      tr: 'Mütevatir hadis. Her tabakada yalan üzere anlaşmaları mümkün olmayan çok sayıda ravinin rivayet ettiği hadis.',
    }
  },
  {
    term: 'Ahad', ar: 'الآحاد', translit: 'Ahad',
    def: {
      az: 'Ahad hədis. Mütəvatir dərəcəsinə çatmayan, bir və ya bir neçə ravinin rəvayət etdiyi hədis. Əhli-Sünnəyə görə səhih ahad hədis həm hökmlərdə, həm də əqidədə dəlildir.',
      en: 'Solitary hadith. A hadith narrated by one or a few narrators, not reaching the level of mutawatir. According to Ahl as-Sunnah, an authentic ahad hadith is proof both in rulings and in creed.',
      ru: 'Единичный хадис. Хадис, переданный одним или несколькими передатчиками, не достигающий уровня мутаватир. Согласно Ахль ас-Сунна, достоверный единичный хадис является доводом и в законоположениях, и в вероубеждении.',
      ar: 'حديث الآحاد. الحديث الذي لم يبلغ درجة المتواتر ورواه عدد قليل من الرواة. وهو إذا صح حجة عند أهل السنة في الأحكام والعقائد.',
      tr: 'Âhad hadis. Mütevatir derecesine ulaşmayan, bir veya birkaç ravinin rivayet ettiği hadis. Ehl-i Sünnet\'e göre sahih âhad hadis hem hükümlerde hem de akidede delildir.',
    }
  },
  {
    term: 'Mürsəl', ar: 'المرسل', translit: 'Mursal',
    def: {
      az: 'Mürsəl hədis. Tabiunun səhabəni atlayaraq birbaşa Peyğəmbərdən rəvayət etdiyi hədis.',
      en: 'Mursal hadith. A hadith in which a tabi\'i narrates directly from the Prophet, omitting the companion.',
      ru: 'Мурсаль хадис. Хадис, в котором табиин передаёт непосредственно от Пророка, пропуская сподвижника.',
      ar: 'الحديث المرسل. حديث يرويه التابعي عن النبي ﷺ مباشرة دون ذكر الصحابي.',
      tr: 'Mürsel hadis. Tabiînin sahabiyi atlayarak doğrudan Peygamber\'den rivayet ettiği hadis.',
    }
  },
  {
    term: 'Müttəsil', ar: 'المتصل', translit: 'Muttasil',
    def: {
      az: 'Sənədi kəsilməyən hədis. Bütün ravilərinin bir-birindən eşitdiyi qırılmamış sənəd silsiləsi.',
      en: 'Connected hadith. A hadith with an unbroken chain where each narrator heard from the previous one.',
      ru: 'Непрерывный хадис. Хадис с непрерывной цепочкой, где каждый передатчик слышал от предыдущего.',
      ar: 'الحديث المتصل. الحديث الذي اتصل سنده بسماع كل راوٍ ممن فوقه.',
      tr: 'Muttasıl hadis. Tüm ravilerinin bir öncekinden işittiği kesintisiz sened silsilesi.',
    }
  },
  {
    term: 'Müəlləq', ar: 'المعلق', translit: 'Mu\'allaq',
    def: {
      az: 'Müəlləq hədis. Sənədin əvvəlindən bir və ya bir neçə ravinin düşdüyü hədis.',
      en: 'Suspended hadith. A hadith in which one or more narrators are omitted from the beginning of the chain.',
      ru: 'Подвешенный хадис. Хадис, в котором один или несколько передатчиков пропущены в начале цепочки.',
      ar: 'الحديث المعلق. الحديث الذي حُذف من أول سنده راوٍ أو أكثر.',
      tr: 'Muallak hadis. Senedin başından bir veya birkaç ravinin düştüğü hadis.',
    }
  },
  {
    term: 'Münqəti', ar: 'المنقطع', translit: 'Munqati',
    def: {
      az: 'Münqəti hədis. Sənədinin ortasında bir və ya bir neçə ravisi düşmüş hədis.',
      en: 'Disconnected hadith. A hadith with one or more narrators missing from the middle of the chain.',
      ru: 'Прерванный хадис. Хадис, в середине цепочки которого пропущен один или несколько передатчиков.',
      ar: 'الحديث المنقطع. الحديث الذي سقط من وسط سنده راوٍ أو أكثر.',
      tr: 'Munkatı hadis. Senedin ortasından bir veya birkaç ravisi düşmüş hadis.',
    }
  },
  // ── Tasawwuf / Ihsan ──
  {
    term: 'Zühd', ar: 'الزهد', translit: 'Zuhd',
    def: {
      az: 'Dünyadan üz çevirmə. Dünya nemətlərinə bağlanmayıb axirəti üstün tutmaq.',
      en: 'Asceticism, detachment from worldly life. Preferring the Hereafter over worldly pleasures.',
      ru: 'Аскетизм, отрешённость от мирского. Предпочтение будущей жизни мирским удовольствиям.',
      ar: 'الزهد. الإعراض عن متاع الدنيا وتفضيل الآخرة.',
      tr: 'Züht, dünyadan yüz çevirme. Dünya nimetlerine bağlanmayıp ahireti üstün tutmak.',
    }
  },
  {
    term: 'Xuşu', ar: 'الخشوع', translit: 'Khushu',
    def: {
      az: 'Qəlb hüzuru, təvazö. İbadətdə qəlbin tam Allaha yönəlməsi və bədənin sakit olması.',
      en: 'Humility and concentration in worship. Complete focus of the heart toward Allah and stillness of the body during prayer.',
      ru: 'Смирение и сосредоточенность в поклонении. Полная обращённость сердца к Аллаху и покой тела во время молитвы.',
      ar: 'الخشوع. تركيز القلب على الله والسكينة في الجوارح أثناء العبادة.',
      tr: 'Huşu. İbadette kalbin tamamen Allah\'a yönelmesi ve bedenin sakin olması.',
    }
  },
  {
    term: 'Muraqəbə', ar: 'المراقبة', translit: 'Muraqabah',
    def: {
      az: 'Allahın nəzarətini hiss etmə. Hər an Allahın görüb bildiyi şüuru ilə yaşamaq.',
      en: 'Watchful awareness of Allah. Living with the consciousness that Allah sees and knows everything at all times.',
      ru: 'Осознание наблюдения Аллаха. Жизнь с сознанием того, что Аллах видит и знает всё в каждый момент.',
      ar: 'المراقبة. الشعور الدائم بأن الله يراك ويعلم كل شيء.',
      tr: 'Murakabe. Her an Allah\'ın gördüğü ve bildiği bilinciyle yaşamak.',
    }
  },
  {
    term: 'Mühasibə', ar: 'المحاسبة', translit: 'Muhasabah',
    def: {
      az: 'Özünü hesaba çəkmə. İnsanın öz əməllərini sorğulayaraq nəfsini islah etməsi.',
      en: 'Self-accounting. Examining one\'s own deeds and striving to reform oneself.',
      ru: 'Самоотчёт. Анализ собственных поступков и стремление к самосовершенствованию.',
      ar: 'المحاسبة. مراجعة الإنسان لأعماله وإصلاح نفسه.',
      tr: 'Muhasebe. İnsanın kendi amellerini sorgulayarak nefsini ıslah etmesi.',
    }
  },
  {
    term: 'Şükr', ar: 'الشكر', translit: 'Shukr',
    def: {
      az: 'Şükür, minnətdarlıq. Allahın nemətlərini tanıyıb dillə, qəlblə və əməllə təşəkkür etmək.',
      en: 'Gratitude, thankfulness. Recognizing Allah\'s blessings and expressing thanks through words, heart, and actions.',
      ru: 'Благодарность. Признание благ Аллаха и выражение благодарности словом, сердцем и делом.',
      ar: 'الشكر. الاعتراف بنعم الله والتعبير عن الامتنان بالقلب واللسان والعمل.',
      tr: 'Şükür, minnettarlık. Allah\'ın nimetlerini tanıyıp dil, kalp ve amellerle teşekkür etmek.',
    }
  },
  {
    term: 'Rida', ar: 'الرضا', translit: 'Ridha',
    def: {
      az: 'Razılıq. Allahın qəza və qədərinə qəlbən razı olmaq.',
      en: 'Contentment. Being pleased with Allah\'s decree and divine will from the heart.',
      ru: 'Довольство. Сердечная удовлетворённость предопределением и волей Аллаха.',
      ar: 'الرضا. القبول القلبي بقضاء الله وقدره.',
      tr: 'Rıza. Allah\'ın kaza ve kaderine gönülden razı olmak.',
    }
  },
  {
    term: 'Təfəkkür', ar: 'التفكر', translit: 'Tafakkur',
    def: {
      az: 'Dərin düşüncə. Allahın yaratdıqları haqqında düşünərək Onun böyüklüyünü dərk etmək.',
      en: 'Contemplation, deep reflection. Pondering over Allah\'s creation to recognize His greatness.',
      ru: 'Размышление, глубокое раздумье. Раздумья о творениях Аллаха для осознания Его величия.',
      ar: 'التفكر. التأمل في مخلوقات الله لإدراك عظمته.',
      tr: 'Tefekkür. Allah\'ın yarattıkları hakkında düşünerek O\'nun büyüklüğünü idrak etmek.',
    }
  },
  // ── General ──
  {
    term: 'Ümmət', ar: 'الأمة', translit: 'Ummah',
    def: {
      az: 'Müsəlman icması. Bütün dünyada İslam dininə inanan insanların birliyi.',
      en: 'The Muslim community. The global community of believers united by the Islamic faith.',
      ru: 'Мусульманская община. Мировое сообщество верующих, объединённых исламской верой.',
      ar: 'الأمة الإسلامية. مجتمع المسلمين في العالم الذين يجمعهم الإيمان بالإسلام.',
      tr: 'Ümmet. Tüm dünyada İslam dinine inanan insanların birliği.',
    }
  },
  {
    term: 'Xəlifə', ar: 'الخليفة', translit: 'Khalifah',
    def: {
      az: 'Xəlifə, canişin. Hz. Peyğəmbərdən (s.a.s) sonra müsəlman cəmiyyətinin rəhbəri.',
      en: 'Caliph, successor. The leader of the Muslim community after the Prophet Muhammad (PBUH).',
      ru: 'Халиф, преемник. Руководитель мусульманской общины после Пророка Мухаммада (мир ему).',
      ar: 'الخليفة. قائد المسلمين بعد وفاة النبي ﷺ.',
      tr: 'Halife. Hz. Peygamber\'den (s.a.s) sonra Müslüman toplumunun lideri.',
    }
  },
  {
    term: 'Şura', ar: 'الشورى', translit: 'Shura',
    def: {
      az: 'Məşvərət. İslami idarəetmədə qərar qəbul edərkən müzakirə və məsləhətləşmə prinsipi.',
      en: 'Consultation. The principle of mutual consultation in Islamic governance and decision-making.',
      ru: 'Совет, консультация. Принцип взаимного совещания в исламском управлении и принятии решений.',
      ar: 'الشورى. مبدأ التشاور في اتخاذ القرارات في الحكم الإسلامي.',
      tr: 'Şûra, meşveret. İslami yönetimde karar alırken danışma ve istişare ilkesi.',
    }
  },
  {
    term: 'Dəvət', ar: 'الدعوة', translit: 'Da\'wah',
    def: {
      az: 'İslama dəvət. İnsanları hikmət və gözəl nəsihətlə İslama çağırmaq.',
      en: 'Invitation to Islam. Calling people to Islam through wisdom and good counsel.',
      ru: 'Призыв к Исламу. Приглашение людей к Исламу мудростью и добрым наставлением.',
      ar: 'الدعوة إلى الإسلام. دعوة الناس إلى الإسلام بالحكمة والموعظة الحسنة.',
      tr: 'İslam\'a davet. İnsanları hikmet ve güzel nasihatle İslam\'a çağırmak.',
    }
  },
  {
    term: 'Cihad', ar: 'الجهاد', translit: 'Jihad',
    def: {
      az: 'Cəhd göstərmək, çalışmaq. Allah yolunda nəfslə, malla və lazım gəldikdə müdafiə ilə səy göstərmək.',
      en: 'Striving in the way of Allah. Struggling against one\'s own ego, spending wealth for good, and defending when necessary.',
      ru: 'Усердие на пути Аллаха. Борьба с собственным эго, расходование средств на благое и защита при необходимости.',
      ar: 'الجهاد. بذل الجهد في سبيل الله بالنفس والمال والدفاع عند الحاجة.',
      tr: 'Allah yolunda çaba göstermek. Nefisle, malla ve gerektiğinde savunmayla gayret etmek.',
    }
  },
  {
    term: 'Hicrət', ar: 'الهجرة', translit: 'Hijrah',
    def: {
      az: 'Köçmə. Hz. Peyğəmbərin (s.a.s) Məkkədən Mədinəyə köçməsi; İslam təqviminin başlanğıcı.',
      en: 'Migration. The Prophet\'s (PBUH) migration from Mecca to Medina; marks the beginning of the Islamic calendar.',
      ru: 'Переселение. Переселение Пророка (мир ему) из Мекки в Медину; начало исламского календаря.',
      ar: 'الهجرة. انتقال النبي ﷺ من مكة إلى المدينة؛ بداية التقويم الإسلامي.',
      tr: 'Hicret. Hz. Peygamber\'in (s.a.s) Mekke\'den Medine\'ye göçü; İslam takviminin başlangıcı.',
    }
  },
  {
    term: 'Mübah', ar: 'المباح', translit: 'Mubah',
    def: {
      az: 'İcazə verilmiş, nə savabı nə günahı olan əməl. İslam hüququnun hökm vermədiyi neytral davranışlar.',
      en: 'Permissible, neutral act. Actions that Islamic law neither encourages nor discourages; no reward or sin attached.',
      ru: 'Дозволенное, нейтральное действие. Действия, которые исламское право не поощряет и не порицает; ни награды, ни греха.',
      ar: 'المباح. الفعل الذي لا ثواب فيه ولا عقاب؛ ما سكت عنه الشرع.',
      tr: 'Mübah. Ne sevabı ne günahı olan eylem. İslam hukukunun hüküm vermediği nötr davranışlar.',
    }
  },
]
