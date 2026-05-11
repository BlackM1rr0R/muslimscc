# 🔥 Firebase Setup Təlimatı

Bu təlimat sizə Firebase Firestore-u 5 dəqiqədə qoşmağa kömək edəcək.

## 1️⃣ Firebase Layihəsi Yaratmaq

1. **https://console.firebase.google.com** saytına daxil olun
2. Google hesabınızla giriş edin (pulsuzdur)
3. **"Add project"** (Layihə əlavə et) düyməsini basın
4. Layihə adı: **`muslim-cc`** (və ya istədiyiniz)
5. Google Analytics-ə razılaşa bilərsiniz (məcburi deyil)
6. **"Create project"** basın və gözləyin (~30 saniyə)

## 2️⃣ Web App əlavə etmək

1. Layihə yaradıldıqdan sonra ana səhifədə **`</>`** ikonuna klikləyin
2. App nickname: **`muslim-cc-web`**
3. Hosting-i seçmək məcburi deyil — **"Register app"** basın
4. **firebaseConfig** kodunu görəcəksiniz — bu vacibdir!

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB...",                      // ← bunu kopyalayın
  authDomain: "muslim-cc.firebaseapp.com",   // ← bunu kopyalayın
  projectId: "muslim-cc-12345",              // ← bunu kopyalayın
  storageBucket: "muslim-cc.appspot.com",    // ← bunu kopyalayın
  messagingSenderId: "123456789",            // ← bunu kopyalayın
  appId: "1:123456789:web:abc..."            // ← bunu kopyalayın
}
```

## 3️⃣ .env Faylı Yaratmaq

Layihə kök qovluğunda **`.env`** adlı yeni fayl yaradın və bu dəyərləri yazın:

```env
VITE_FIREBASE_API_KEY=AIzaSyB...
VITE_FIREBASE_AUTH_DOMAIN=muslim-cc.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=muslim-cc-12345
VITE_FIREBASE_STORAGE_BUCKET=muslim-cc.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc...
```

⚠️ **VACİB**: `.env` faylını **GitHub-a YÜKLƏMƏYİN**! `.gitignore`-da artıq əlavə olunub.

## 4️⃣ Firestore Database Qurmaq

1. Sol menyudan **"Firestore Database"** seçin
2. **"Create database"** düyməsini basın
3. **"Start in test mode"** seçin (30 gün hamıya icazə var)
4. Region: ən yaxın olanı seçin
   - Avropa: `eur3 (europe-west)`
   - Rusiya/Türkiyə: `eur3` və ya `asia-south1`
5. **"Enable"** basın

## 5️⃣ Tətbiqi Başlatmaq

```bash
npm run dev
```

İndi:
- Admin paneldə **video əlavə edirsiniz**
- **Hamı dərhal görür** (real-time)
- Mobil tətbiq də eyni Firebase-i çəkir

## 6️⃣ Təhlükəsizlik Qaydaları (1 həftə sonra)

Test mode 30 günə avtomatik bağlanır. Production üçün:

1. Firestore Database → **"Rules"** tab
2. Bu qaydanı yapışdırın:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Hamı oxuya bilər
    match /{document=**} {
      allow read: if true;
      allow write: if false;  // Yazmaq qadağandır
    }
  }
}
```

**Daha yaxşı variant** — Firebase Auth ilə admin authentication:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Hamı oxuya bilər
    match /{document=**} {
      allow read: if true;
    }
    // Yalnız admin yaza bilər
    match /{collection}/{docId} {
      allow write: if request.auth != null
                   && request.auth.token.email == 'admin@yourdomain.com';
    }
  }
}
```

## 🎯 Mobile-da da İstifadə Etmək

Mobile tərəf üçün də eyni Firebase-i çəkmək olar. `mobile/` qovluğunda:

```bash
cd mobile
npm install firebase
```

Sonra `mobile/src/firebase/config.js` faylı yaradıb eyni config-i yapışdırın.

## ❓ Tez-tez Soruşulan Suallar

**S: Pulsuzdumu?**
C: Bəli! Firebase Spark plan tamamilə pulsuzdur:
- 1 GB storage
- 50,000 read / gün
- 20,000 write / gün
- Real-time sinxronlaşdırma daxildir

**S: Layihə Vercel/Netlify-da deploy edirəm. Necə?**
C: Hosting paneldə **Environment Variables** bölməsinə `VITE_FIREBASE_*` dəyişənlərini əlavə edin.

**S: Test mode bitdi, nə edim?**
C: Firestore Rules-u yuxarıdakı kod ilə yeniləyin.

**S: Admin şifrəsini necə dəyişim?**
C: `src/data/videos.js` faylında `ADMIN_PASSWORD = 'muslim2025'` sətrini dəyişin. Daha təhlükəsiz variant — Firebase Auth istifadə edin.

## 🐛 Problem Yaşayırsınız?

- `apiKey not valid` → `.env` faylını yoxlayın, dəyərləri düzgün kopyaladığınızdan əmin olun
- `permission denied` → Firestore Rules-u "test mode"-a qoyduğunuza əmin olun
- `tətbiq açılmır` → `npm run dev` yeniləyin, brauzer cache-ni təmizləyin

---

Hazırdır! İndi admin paneldə nə əlavə etsəniz **bütün istifadəçilər dərhal görəcək** 🎉
