# 📱 Muslims.cc Mobile — Setup

## 🔥 Firebase paylaşımı (web ilə eyni)

Mobile **eyni Firebase layihəsindən** oxuyur — admin paneldən web-də əlavə edilən kitab/video/hədis dərhal mobile-da görünür.

Konfiqurasiya: [mobile/src/firebase/config.js](src/firebase/config.js) — açarlar `muslims-cc` layihəsi ilə eynidir (publik web açarlardır).

### Real-time abunələr

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

Mobile MuslimAI **web-lə eyni Vercel endpoint** istifadə edir.

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
npm install   # firebase paketini quraşdırır
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

1. **Firebase Security Rules** — Firestore Console-da public read icazə verilməlidir:
   ```
   match /{collection}/{doc} {
     allow read: if true;  // hər kəs oxuya bilər
     allow write: if false; // yalnız Admin SDK (web admin panel)
   }
   ```
2. **AI Chat üçün Vercel endpoint** mütləq deploy edilməlidir
3. **Notifications** — Expo Notifications + FCM token Firestore-ə yazılır (web ilə paylaşılmış `fcm_tokens` kolleksiya)
