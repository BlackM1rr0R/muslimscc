// ═══════════════════════════════════════════════════════
// E2E köməkçisi: Firebase Authentication-un saxta cavabları
//
// Testdə Firebase şəbəkəsi bağlıdır (fixtures.js). Admin panelinə daxil olmaq
// üçün identitytoolkit / securetoken REST sorğularına saxta cavab verilir.
// Klient SDK ID tokenin imzasını YOXLAMIR (yalnız payload-u oxuyur) — saxta
// JWT-də `admin: true` claim-i panelin açılması üçün kifayətdir. Real
// təhlükəsizlik serverdə (verifyIdToken) və firestore.rules-dadır — bu
// testlər yalnız UI axınını yoxlayır.
// ═══════════════════════════════════════════════════════

const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url')

function fakeIdToken({ uid, email, admin }) {
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: 'https://securetoken.google.com/test', aud: 'test',
    auth_time: now, iat: now, exp: now + 3600,
    user_id: uid, sub: uid, email, email_verified: true,
    firebase: { identities: { email: [email] }, sign_in_provider: 'password' },
    ...(admin ? { admin: true } : {}),
  }
  return `${b64url({ alg: 'RS256', kid: 'test', typ: 'JWT' })}.${b64url(payload)}.c2ln`
}

/**
 * Saxta Auth qur. mode: 'admin' | 'user' (claim-siz) | 'wrong' (yanlış parol).
 * fixtures.js-dəki ümumi "identitytoolkit → abort" marşrutundan SONRA
 * qeydiyyat olunur — Playwright-da sonuncu marşrut birinci işləyir.
 */
export async function fakeFirebaseAuth(page, mode = 'admin') {
  const uid = 'test-admin-uid'
  const email = 'admin@example.com'
  const idToken = () => fakeIdToken({ uid, email, admin: mode === 'admin' })

  await page.route(/identitytoolkit\.googleapis\.com\/v1\/accounts:signInWithPassword/, (route) => {
    if (mode === 'wrong') {
      return route.fulfill({ status: 400, json: { error: { code: 400, message: 'INVALID_LOGIN_CREDENTIALS', errors: [] } } })
    }
    return route.fulfill({ json: {
      kind: 'identitytoolkit#VerifyPasswordResponse', localId: uid, email, displayName: '',
      idToken: idToken(), registered: true, refreshToken: 'fake-refresh', expiresIn: '3600',
    } })
  })
  await page.route(/identitytoolkit\.googleapis\.com\/v1\/accounts:lookup/, (route) => route.fulfill({ json: {
    kind: 'identitytoolkit#GetAccountInfoResponse',
    users: [{
      localId: uid, email, emailVerified: true,
      providerUserInfo: [{ providerId: 'password', email, federatedId: email, rawId: email }],
      lastLoginAt: String(Date.now()), createdAt: String(Date.now()),
    }],
  } }))
  await page.route(/identitytoolkit\.googleapis\.com\/v1\/accounts:sendOobCode/, (route) => route.fulfill({ json: {
    kind: 'identitytoolkit#GetOobConfirmationCodeResponse', email,
  } }))
  await page.route(/securetoken\.googleapis\.com\/v1\/token/, (route) => route.fulfill({ json: {
    access_token: idToken(), expires_in: '3600', token_type: 'Bearer',
    refresh_token: 'fake-refresh', id_token: idToken(), user_id: uid, project_id: 'test',
  } }))
}

/** Giriş formunu doldurub göndər (giriş səhifəsində olmalısan). */
export async function adminSignIn(page, { email = 'admin@example.com', password = 'test-password' } = {}) {
  await page.getByLabel('E-poçt').fill(email)
  await page.getByLabel('Şifrə', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Daxil ol' }).click()
}
