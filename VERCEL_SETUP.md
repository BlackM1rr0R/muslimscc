# 🚀 Vercel Setup — AI Bot + Push Notifications

100% pulsuz arxitektura: **Vercel Serverless Functions** + **Gemini API** + **Firebase Cloud Messaging**.

---

## 📋 Tələblər (hamısı pulsuzdur)

1. **Vercel hesabı** → [vercel.com](https://vercel.com) (kart tələb etmir)
2. **Google Gemini API açarı** → [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
3. **Firebase Admin SDK açarı** (yalnız push notification üçün) → Firebase Console
4. **Firebase Cloud Messaging VAPID açarı** → Firebase Console

---

## 1️⃣ Gemini API açarı al

1. [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) açın
2. Google hesabı ilə daxil olun
3. **"Create API key"** düyməsini basın
4. Açarı kopyalayın və saxlayın (məs. `AIzaSy...`)

✅ **Pulsuz limitlər:** 15 sorğu/dəqiqə, 1 milyon token/gün — sizin layihə üçün kifayət

---

## 2️⃣ Firebase VAPID açarı (Web Push üçün)

1. [Firebase Console](https://console.firebase.google.com) → layihənizi seçin
2. ⚙️ **Project Settings** → **Cloud Messaging** tab
3. **"Web Push certificates"** bölməsi
4. **"Generate key pair"** düyməsini basın
5. Yaranan açarı kopyalayın (uzun bir BASE64 sətir)

📝 Bu açarı `.env` faylınızda `VITE_FCM_VAPID_KEY=...` kimi əlavə edin

---

## 3️⃣ Firebase Admin SDK service account

Push notification göndərmək üçün server tərəfində Firebase Admin-ə giriş lazımdır.

1. Firebase Console → **Project Settings** → **Service accounts** tab
2. **"Generate new private key"** düyməsini basın → JSON faylı yüklənəcək
3. JSON-da bu 3 dəyər lazımdır:
   - `project_id`
   - `client_email`
   - `private_key`

⚠️ **Bu fayl çox təhlükəlidir** — GitHub-a YÜKLƏMƏYIN. Yalnız Vercel env-də saxlanmalıdır.

---

## 4️⃣ Lokal .env qurun

`.env.example` faylını `.env` adı ilə kopyalayın və doldurun:

```bash
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=muslim-cc.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=muslim-cc
VITE_FIREBASE_STORAGE_BUCKET=muslim-cc.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc...

VITE_FCM_VAPID_KEY=BFx...
VITE_API_URL=https://your-project.vercel.app
VITE_ADMIN_TOKEN=siz-secret-bir-soz-yazin-1234
```

---

## 5️⃣ `public/firebase-messaging-sw.js` yeniləyin

`public/firebase-messaging-sw.js` faylını açın və `firebase.initializeApp({...})` daxilindəki dəyərləri **öz Firebase konfiqurasiyanız** ilə əvəz edin (eyni dəyərlər `.env`-dəkilərlə).

---

## 6️⃣ Vercel-ə deploy

### A) GitHub-dan auto-deploy (Recommended)

1. [vercel.com/new](https://vercel.com/new) açın
2. GitHub-a qoşulun → `muslimscc` repo-nu seçin
3. **"Import"** basın
4. **Build settings** (avtomatik təyin olunacaq):
   - Framework: **Vite**
   - Build command: `npm run build`
   - Output: `dist`

5. **"Environment Variables"** bölməsinə bunları əlavə edin:

| Key | Value |
|---|---|
| `GEMINI_API_KEY` | (Gemini açarınız) |
| `FIREBASE_PROJECT_ID` | (JSON-dan project_id) |
| `FIREBASE_CLIENT_EMAIL` | (JSON-dan client_email) |
| `FIREBASE_PRIVATE_KEY` | (JSON-dan private_key — `\n` saxlayın) |
| `ADMIN_TOKEN` | (sizin müəyyən etdiyiniz gizli açar) |
| `ALLOWED_ORIGIN` | `https://muslims.cc` |
| `VITE_FIREBASE_API_KEY` | (`.env`-dəki) |
| `VITE_FIREBASE_AUTH_DOMAIN` | (`.env`-dəki) |
| `VITE_FIREBASE_PROJECT_ID` | (`.env`-dəki) |
| `VITE_FIREBASE_STORAGE_BUCKET` | (`.env`-dəki) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | (`.env`-dəki) |
| `VITE_FIREBASE_APP_ID` | (`.env`-dəki) |
| `VITE_FCM_VAPID_KEY` | (`.env`-dəki) |
| `VITE_API_URL` | (deploy-dan sonra alacağınız Vercel URL) |
| `VITE_ADMIN_TOKEN` | (`ADMIN_TOKEN` ilə eyni) |

6. **"Deploy"** basın
7. ~2 dəqiqə sonra siteniz hazır olacaq: `https://muslim-cc-xxx.vercel.app`

### B) Vercel CLI ilə

```bash
npm i -g vercel
vercel login
vercel
# soruşacaq: project setup → Y, link to existing → N, name → muslim-cc
vercel --prod
```

---

## 7️⃣ Domeni qoşmaq (muslims.cc)

1. Vercel Dashboard → layihəniz → **Settings** → **Domains**
2. `muslims.cc` daxil edin
3. DNS sağlayıcınızda Vercel-in göstərdiyi A və CNAME qeydlərini əlavə edin
4. SSL avtomatik aktiv olur

---

## 8️⃣ Firebase Authorized Domains

1. Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Əlavə edin:
   - `muslims.cc`
   - `your-project.vercel.app`
   - `localhost` (lokal test üçün)

---

## 9️⃣ Firestore Security Rules (vacibdir!)

Firebase Console → **Firestore Database** → **Rules** tab → bunu yapışdırın:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Hamı oxuya bilər, yalnız adminlər yaza bilər
    match /{collection}/{doc} {
      allow read: if true;
      allow write: if false; // Yalnız admin SDK ilə yazılır
    }

    // FCM tokenləri — hər kəs öz tokenini yaza bilər
    match /fcm_tokens/{tokenId} {
      allow read: if false; // Yalnız server oxuyur
      allow write: if true;
    }
  }
}
```

⚠️ Bu sadə qaydadır. Admin login mütləq backend-də yoxlanmalıdır.

---

## ✅ Test

1. `https://muslims.cc` açın
2. 5 saniyə sonra bildiriş banner-i görünməlidir → **Aktivləşdir**
3. Brauzer FCM token aldıqdan sonra Firestore-da `fcm_tokens` kolleksiyasında token görünməlidir
4. Admin panel → 🔔 Push Bildirişlər → test mesaj göndərin
5. AI Köməkçi səhifəsində sual verin

---

## 🐛 Problem həlli

**Bildiriş banner görünmür:**
- HTTPS aktivdir? (PWA/notification üçün vacibdir)
- Brauzer dəstəkləyirmi? (Safari iOS 16.4+ dəstəkləyir)
- `VITE_FCM_VAPID_KEY` doludur?

**AI cavab vermir:**
- Vercel logs → Functions → ask-ai → xəta var?
- `GEMINI_API_KEY` doğrudur?
- `VITE_API_URL` Vercel domeninizdir?

**Push işləmir:**
- `firebase-messaging-sw.js`-də Firebase config sizin layihənizinkidir?
- `FIREBASE_PRIVATE_KEY` Vercel-də `\n` ilə düzgün yazılıb?
- CORS xətası? → `ALLOWED_ORIGIN` Vercel-də frontend domeni ilə uyğunlaşır?

---

## 💰 Xərclər

| Xidmət | Limit | Sizin layihə üçün |
|---|---|---|
| Vercel Hobby | 100GB-h/ay, sınırsız deploy | ✅ Pulsuz |
| Gemini API | 1M token/gün | ✅ Pulsuz |
| Firebase FCM | Sınırsız | ✅ Pulsuz |
| Firestore | 50K read/gün, 20K write/gün | ✅ Pulsuz tier |

**Aylıq xərc: 0 ₼** 🎉
