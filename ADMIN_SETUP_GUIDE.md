# ✅ Panduan Setup Admin - Sistem Informasi KKN

## Konfigurasi Saat Ini

Email yang sudah dikonfigurasi sebagai admin:
- ✅ `nicolastzakis@students.universitasmulia.ac.id`
- ✅ `nicolastz127@gmail.com`

Domain email yang diizinkan untuk login:
- ✅ `students.universitasmulia.ac.id`
- ✅ `gmail.com`

---

## Cara Menambahkan Admin Baru

### Metode 1: Hardcoded Admin (Paling Mudah & Otomatis)

**Kapan digunakan:** Untuk admin permanen yang langsung dikenali saat login pertama kali.

**Langkah:**

1. Edit file `packages/server/src/lib/auth-helpers.ts`
2. Tambahkan email ke array `hardcodedAdmins` (sekitar baris 19-23):

```typescript
const hardcodedAdmins = [
  'nicolastzakis@students.universitasmulia.ac.id',
  'nicolastz127@gmail.com',
  'admin-baru@gmail.com', // Tambahkan email baru di sini
].map((e) => e.toLowerCase());
```

3. Save file (server akan auto-reload)
4. User bisa langsung login dan otomatis jadi admin

**Keuntungan:**
- ✅ Otomatis saat login pertama kali
- ✅ Tidak perlu menjalankan script
- ✅ Permanen di kode

---

### Metode 2: Environment Variable

**Kapan digunakan:** Untuk admin yang berbeda per environment (dev/staging/production).

**Langkah:**

1. Edit file `.env.local` di root project
2. Tambahkan atau update baris `ADMIN_EMAILS`:

```bash
ADMIN_EMAILS=nicolastz127@gmail.com,admin-baru@gmail.com,admin-lain@gmail.com
```

3. Pisahkan multiple email dengan koma (`,`)
4. Restart server jika perlu
5. User bisa langsung login dan otomatis jadi admin

**Keuntungan:**
- ✅ Mudah diubah tanpa edit kode
- ✅ Bisa berbeda per environment
- ✅ Tidak perlu commit ke git (karena .env.local di gitignore)

---

### Metode 3: Script Promote User

**Kapan digunakan:** Untuk user yang **sudah pernah login** (sudah ada di database) tapi belum jadi admin.

**Langkah:**

1. Edit file `packages/server/src/scripts/promote-user.ts`
2. Ubah email di baris 8:

```typescript
const email = 'user-yang-mau-dijadikan-admin@gmail.com';
```

3. Jalankan script:

```bash
cd packages/server
pnpm ts-node src/scripts/promote-user.ts
```

4. Jika berhasil, akan muncul:
```
User found, promoting to admin...
User promoted successfully.
```

5. User harus logout dan login lagi untuk mendapat akses admin

**Catatan:**
- ⚠️ User harus sudah pernah login minimal 1 kali (sudah ada di database)
- ⚠️ Jika user belum pernah login, gunakan Metode 1 atau 2

---

### Metode 4: Edit Database Langsung (Advanced)

**Kapan digunakan:** Untuk debugging atau situasi khusus.

**Langkah:**

1. Install SQLite browser atau gunakan command line:

```bash
sqlite3 database.sqlite
```

2. Lihat semua user:

```sql
SELECT id, email, name, role FROM user;
```

3. Update role menjadi admin:

```sql
UPDATE user SET role = 'admin' WHERE email = 'user@gmail.com';
```

4. Verifikasi:

```sql
SELECT id, email, name, role FROM user WHERE email = 'user@gmail.com';
```

5. User harus logout dan login lagi

---

## Menambahkan Domain Email Baru

Jika ingin mengizinkan domain email lain (misalnya `@company.com`):

### 1. Edit `.env.local` di root project:

```bash
VITE_ALLOWED_EMAIL_DOMAINS=students.universitasmulia.ac.id,gmail.com,company.com
```

### 2. Edit `packages/server/.env`:

```bash
VITE_ALLOWED_EMAIL_DOMAINS=students.universitasmulia.ac.id,gmail.com,company.com
```

### 3. Restart server jika perlu

---

## Verifikasi Admin Access

Setelah menambahkan admin, verifikasi dengan:

### ✅ Checklist Verifikasi:

1. **Logout dan login lagi** dengan email admin
2. Cek apakah ada menu **"Admin"** di sidebar
3. Coba akses halaman `/admin`
4. Coba buat program baru
5. Cek log server untuk memastikan role: `(Role: admin)`

### Log Server yang Benar:

```
[ClerkMiddleware] Auth set: nicolastz127@gmail.com (Role: admin)
[AuthResolver] me: returning user nicolastz127@gmail.com with role admin
```

---

## Troubleshooting

### ❌ "Only university email addresses are allowed"

**Penyebab:** Domain email belum ditambahkan ke `VITE_ALLOWED_EMAIL_DOMAINS`

**Solusi:**
1. Tambahkan domain ke `.env.local` dan `packages/server/.env`
2. Hard refresh browser: `Ctrl + Shift + R`
3. Clear cache jika perlu

---

### ❌ User sudah login tapi tidak ada menu Admin

**Solusi:**

1. **Clear localStorage:**
   - Buka Console (F12)
   - Ketik: `localStorage.clear()`
   - Enter

2. **Logout dan login lagi**

3. **Cek database:**
   ```bash
   sqlite3 database.sqlite
   SELECT email, role FROM user WHERE email = 'your-email@gmail.com';
   ```

4. **Jika role masih bukan 'admin':**
   - Gunakan Metode 3 (Script Promote User)
   - Atau edit database langsung

---

### ❌ Script promote-user gagal: "User NOT found"

**Penyebab:** User belum pernah login (belum ada di database)

**Solusi:**
- Gunakan **Metode 1** atau **Metode 2** (Hardcoded Admin atau Environment Variable)
- User akan otomatis jadi admin saat login pertama kali

---

### ❌ Server tidak auto-reload setelah edit kode

**Solusi:**

1. **Restart server manual:**
   - Tekan `Ctrl + C` di terminal server
   - Jalankan lagi: `pnpm dev`

2. **Cek apakah ts-node-dev berjalan:**
   - Pastikan ada log: `[ts-node-dev] Restarting...`

---

## File-File Penting

| File | Fungsi |
|------|--------|
| [`packages/server/src/lib/auth-helpers.ts`](file:///d:/ngoding/Mentoring/baru/prd-project/packages/server/src/lib/auth-helpers.ts) | Hardcoded admin list |
| [`.env.local`](file:///d:/ngoding/Mentoring/baru/prd-project/.env.local) | Environment variables (root) |
| [`packages/server/.env`](file:///d:/ngoding/Mentoring/baru/prd-project/packages/server/.env) | Environment variables (server) |
| [`packages/server/src/scripts/promote-user.ts`](file:///d:/ngoding/Mentoring/baru/prd-project/packages/server/src/scripts/promote-user.ts) | Script untuk promote user ke admin |
| [`packages/server/src/entities/User.ts`](file:///d:/ngoding/Mentoring/baru/prd-project/packages/server/src/entities/User.ts) | User entity (struktur database) |

---

## Role yang Tersedia

Sistem mendukung 4 role:

| Role | Akses |
|------|-------|
| `admin` | Full access ke semua fitur |
| `supervisor` | Supervisi tim, review laporan |
| `leader` | Ketua tim, manage work program |
| `student` | Mahasiswa, submit tugas |
| `pending` | User baru yang belum disetujui |

---

## Tips Keamanan

### ✅ Best Practices:

1. **Jangan commit `.env.local` ke git** (sudah di gitignore)
2. **Gunakan Metode 2 (Environment Variable)** untuk production
3. **Limit jumlah admin** - hanya berikan ke orang yang dipercaya
4. **Review admin list secara berkala**
5. **Gunakan email institusi** untuk admin jika memungkinkan

### ⚠️ Hindari:

- ❌ Hardcode password atau secret key di kode
- ❌ Memberikan admin ke semua orang
- ❌ Menggunakan email pribadi untuk production

---

## Contoh Skenario

### Skenario 1: Menambahkan Dosen sebagai Admin

**Email:** `dosen@universitasmulia.ac.id`

**Langkah:**
1. Domain sudah diizinkan (`students.universitasmulia.ac.id`)
2. Tambahkan ke `auth-helpers.ts`:
   ```typescript
   const hardcodedAdmins = [
     'nicolastzakis@students.universitasmulia.ac.id',
     'nicolastz127@gmail.com',
     'dosen@universitasmulia.ac.id',
   ].map((e) => e.toLowerCase());
   ```
3. Dosen bisa langsung login dan jadi admin

---

### Skenario 2: Menambahkan Admin dari Domain Baru

**Email:** `admin@company.com`

**Langkah:**
1. Tambahkan domain ke `.env.local`:
   ```bash
   VITE_ALLOWED_EMAIL_DOMAINS=students.universitasmulia.ac.id,gmail.com,company.com
   ```
2. Tambahkan email ke `auth-helpers.ts`:
   ```typescript
   const hardcodedAdmins = [
     'nicolastzakis@students.universitasmulia.ac.id',
     'nicolastz127@gmail.com',
     'admin@company.com',
   ].map((e) => e.toLowerCase());
   ```
3. Admin bisa login dengan email company.com

---

### Skenario 3: Promote Student yang Sudah Login

**Email:** `student@students.universitasmulia.ac.id` (sudah pernah login)

**Langkah:**
1. Edit `promote-user.ts`:
   ```typescript
   const email = 'student@students.universitasmulia.ac.id';
   ```
2. Jalankan:
   ```bash
   cd packages/server
   pnpm ts-node src/scripts/promote-user.ts
   ```
3. Student logout dan login lagi → jadi admin

---

## Quick Reference

### Tambah Admin Cepat (Recommended):

```typescript
// File: packages/server/src/lib/auth-helpers.ts
const hardcodedAdmins = [
  'nicolastzakis@students.universitasmulia.ac.id',
  'nicolastz127@gmail.com',
  'EMAIL_BARU_DI_SINI@gmail.com', // ← Tambahkan di sini
].map((e) => e.toLowerCase());
```

### Tambah Domain Cepat:

```bash
# File: .env.local
VITE_ALLOWED_EMAIL_DOMAINS=students.universitasmulia.ac.id,gmail.com,DOMAIN_BARU
```

### Promote User Cepat:

```bash
cd packages/server
# Edit email di src/scripts/promote-user.ts dulu
pnpm ts-node src/scripts/promote-user.ts
```

---

**Dibuat:** 2026-02-04  
**Terakhir diupdate:** 2026-02-04  
**Versi:** 1.0
