# 📱 Muslims.cc Mobile — Setup

## Admin məzmunu (web ilə eyni server)

Mobile saytın serverindən oxuyur (`https://muslims.cc/api/content/...`, [src/api/content.js](src/api/content.js)) — admin paneldən web-də əlavə edilən kitab/video/hədis mobile-da da görünür (tətbiq ön plana qayıdanda yenidən soruşulur). Yalnız oxuma.

### Abunələr

| Modul | Funksiya | Faylda |
|---|---|---|
| Books | `subscribeToBooks(cb)` | [data/books.js](src/data/books.js) |
| Videos | `subscribeToVideos(cb)` | [data/videos.js](src/data/videos.js) |
| Hadiths (custom) | `subscribeToCustomHadiths(cb)` | [data/hadiths.js](src/data/hadiths.js) |
| Duas (custom) | `subscribeToCustomDuas(cb)` | [data/duas.js](src/data/duas.js) |

İstifadə:
```js
useEffect(() => {
  const unsubscribe = subscribeToBooks(items => setBooks(items))
  return () => unsubscribe?.()
}, [])
```

## 🤖 AI Chat (Gemini)

Mobil AI Köməkçi (əvvəl "MuslimAI") **web-lə eyni Vercel endpoint** istifadə edir. Görünən ad və xəbərdarlıq mətni `src/config/brand.js`-dəki `BRAND.aiName` / `BRAND.aiDisclaimer`-dən gəlir — AI cavabları ümumi məlumatdır, fətva deyil.

[app.json](app.json) → `expo.extra.apiUrl`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://muslim-cc.vercel.app"
    }
  }
}
```

Vercel deploy URL-i ilə əvəz edin. Sonra hər iki tərəfdə eyni `/api/ask-ai` endpoint çağrılır:
- Eyni Gemini sistem prompt
- Eyni 5 dildə İslami cavab
- Eyni rate limiting (5 mesaj/dəq, 30s cooldown — lokal AsyncStorage-də)

## ♿ Accessibility

[AccessibilityScreen](src/screens/AccessibilityScreen.js) web-lə paralel:
- 6 hazır profil (zəif görmə, disleksiya, motor, rəngkorluk, sakit, tutmalardan qoruma)
- 4 səviyyəli mətn ölçüsü
- Tema (auto/light/dark)
- Canlı önizləmə
- 6 toggle (kontrast, link, fokus, böyük düymə, animasiya, media)
- AsyncStorage-də saxlanır

## 🚀 Run

```bash
cd mobile
npm install
npx expo start
```

Expo Go ilə QR kod oxudub telefonda yoxlayın.

## 📦 Build (production)

```bash
# EAS Build
npm i -g eas-cli
eas login
eas build:configure
eas build --platform android
eas build --platform ios
```

## ⚠️ Vacib qeydlər

1. **AI Chat üçün endpoint** mütləq deploy edilməlidir
2. **Notifications** — namaz xatırlatmaları cihazda planlaşdırılır (Expo Notifications); server push-u yoxdur
