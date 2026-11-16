# 🏋️ Workout Buddy — Supabase Edition

แอปพลิเคชัน **Full-Stack Workout Tracker** สำหรับบันทึก ติดตาม และวิเคราะห์ผลการออกกำลังกาย ที่อัปเกรดจากโครงสร้างเดิม (MERN / MongoDB) มาใช้ **Supabase (PostgreSQL + Supabase Auth + Row Level Security)** พร้อมปรับปรุง **UX/UI ใหม่ทั้งหมด** ในสไตล์ Modern Athletic Dashboard

---

## ✨ สิ่งที่เปลี่ยนแปลงและอัปเกรดใหม่

### 1. ย้ายฐานข้อมูลและระบบยืนยันตัวตนไปที่ Supabase

- **MongoDB / Mongoose ➜ Supabase PostgreSQL**:
  - เปลี่ยนการจัดเก็บข้อมูลจาก MongoDB Collection มาใช้ตารางเชิงสัมพันธ์ `public.workouts` บน PostgreSQL (`supabase/schema.sql`)
  - ใช้คอลัมน์ `id` (`uuid`), `user_id` (`uuid` อ้างอิง `auth.users`), `title`, `load`, `reps`, `sets`, `category`, `notes`, `created_at` และ `updated_at` พร้อม Trigger อัปเดตเวลาอัตโนมัติ
  - รองรับการบันทึกท่า Bodyweight ที่ `load = 0 kg` ได้อย่างถูกต้อง
- **Custom JWT + bcrypt ➜ Supabase Auth + Google OAuth (PKCE)**:
  - ระบบสมัครสมาชิก (`Signup`) และเข้าสู่ระบบ (`Login`) ทำงานผ่าน **Supabase Auth** (`supabase.auth.signUp`, `signInWithPassword`, `getUser`, `refreshSession`)
  - รองรับการเข้าสู่ระบบด้วย **Google OAuth** (PKCE flow ผ่าน `@supabase/supabase-js` บนเบราว์เซอร์และหน้า Callback `/auth/callback`) พร้อมดึงชื่อและรูปโปรไฟล์จากบัญชี Google มาแสดงบน Navbar
  - รองรับการต่ออายุ Access Token อัตโนมัติผ่าน endpoint `POST /api/user/refresh` เมื่อ JWT หมดอายุ
- **Row Level Security (RLS)**:
  - เปิดใช้งาน RLS บนตาราง `public.workouts` และสร้าง Request-scoped Supabase Client (`req.supabase`) ใน Middleware `requireAuth.js` เพื่อให้ PostgreSQL บังคับสิทธิ์ `(select auth.uid()) = user_id` ในระดับฐานข้อมูลโดยตรง

### 2. ยกเครื่อง UX/UI ใหม่ (Modern Athletic Design)

- **Dark & Light Mode**: ดีไซน์ Dark Theme สไตล์ฟิตเนสเป็นค่าเริ่มต้น พร้อมปุ่มสลับธีม Dark/Light บน Navbar (บันทึกค่าไว้ใน `localStorage`)
- **Summary KPI Dashboard (`WorkoutStats`)**: การ์ดสรุปผล 4 ตัวชี้วัดแบบทันที:
  - **Workouts Logged** (จำนวนรายการฝึกทั้งหมด)
  - **Total Volume** (`Load × Sets × Reps` รวมเป็น `kg`)
  - **Total Reps** (จำนวนครั้งรวมทุกเซต)
  - **Peak Load** (น้ำหนักสูงสุดที่เคยยก)
- **Search, Category Filter & Sorting**: ค้นหาตามชื่อท่าหรือโน้ต กรองตามหมวดหมู่ (`Strength`, `Hypertrophy`, `Cardio`, `Bodyweight`, `Mobility`) และเรียงลำดับได้ทั้งล่าสุด, เก่าสุด, น้ำหนักสูงสุด และ Volume สูงสุด
- **Quick Presets & Live Volume Preview**: มีปุ่ม Quick Presets (เช่น Bench Press, Back Squat, Deadlift, Pull-ups) ช่วยกรอกข้อมูลไวขึ้น และแสดง Volume ที่คำนวณไว้ล่วงหน้าก่อนบันทึก
- **Inline Edit & Safe Delete Confirmation**: แก้ไขข้อมูลท่าออกกำลังกายบนการ์ดได้ทันที (`PATCH /api/workouts/:id`) และมีปุ่มยืนยันก่อนลบเพื่อลดความผิดพลาดจากการกดโดน
- **Auth Experience ใหม่**: หน้า Login / Signup แบบ Split Layout พร้อมปุ่มแสดง/ซ่อนรหัสผ่าน และข้อความแจ้งเตือนที่ชัดเจน (รองรับทั้งโหมดยืนยันอีเมลและโหมด Auto-confirm)

---

## 🛠️ Tech Stack

| ส่วนงาน             | เทคโนโลยีเดิม (Legacy)                        | เทคโนโลยีใหม่ (Current)                                                                                       |
| :------------------ | :-------------------------------------------- | :------------------------------------------------------------------------------------------------------------ |
| **Frontend**        | React, React Router, Plain CSS                | React 19, React Router DOM 7, Context API (`Auth`, `Workouts`, `Theme`), Custom CSS Design System, `date-fns` |
| **Backend**         | Express 5, Mongoose, `bcrypt`, `jsonwebtoken` | Express 5, `@supabase/supabase-js`, `validator`, `cors`, `dotenv`                                             |
| **Database**        | MongoDB Atlas                                 | **Supabase PostgreSQL** (`public.workouts` + Trigger + Index)                                                 |
| **Auth & Security** | Custom JWT (`SECRET`) + Hash ใน DB            | **Supabase Auth** + JWT Verification + **Row Level Security (RLS)**                                           |

---

## 📁 โครงสร้างโปรเจกต์

```text
MERN_Workout_Project/
├── supabase/
│   └── schema.sql                   # SQL สำหรับสร้างตาราง workouts, Trigger และ RLS Policies
├── backend/
│   ├── config/
│   │   └── supabase.js              # การตั้งค่า Supabase Anon / Admin / Per-request RLS Client
│   ├── controllers/
│   │   ├── userController.js        # signup, login, refresh session และข้อมูลผู้ใช้ปัจจุบัน
│   │   └── workoutController.js     # CRUD สำหรับ workouts พร้อมตรวจสอบข้อมูลและ UUID
│   ├── middleware/
│   │   └── requireAuth.js           # ตรวจสอบ Bearer JWT ผ่าน Supabase Auth
│   ├── routers/
│   │   ├── user.js                  # เส้นทาง /api/user/*
│   │   └── Workout.js               # เส้นทาง /api/workouts/* (ต้องผ่าน requireAuth)
│   ├── tests/
│   │   └── api.test.js              # Backend unit tests (node --test)
│   ├── .env                         # ไฟล์ Environment variables สำหรับรันในเครื่อง
│   ├── .env.example                 # ตัวอย่าง Environment variables
│   ├── index.js                     # Express application entry point & /api/health
│   └── package.json
├── frontend/
│   ├── public/
│   │   ├── index.html               # โหลดฟอนต์ Plus Jakarta Sans, Inter, JetBrains Mono
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/
│   │   │   ├── Icons.js             # ชุดไอคอน SVG น้ำหนักเบา
│   │   │   ├── Navbar.js            # แถบนำทาง, ปุ่มสลับธีม Dark/Light, User Pill
│   │   │   ├── WorkoutCard.js       # การ์ดแสดงผล, แก้ไขแบบ Inline และยืนยันก่อนลบ
│   │   │   ├── WorkoutForm.js       # ฟอร์มเพิ่มรายการ, Quick Presets, Volume Preview
│   │   │   └── WorkoutStats.js      # การ์ดสรุป KPI 4 ช่อง
│   │   ├── context/
│   │   │   ├── AuthContext.js       # จัดการสถานะผู้ใช้และ authIsReady
│   │   │   ├── ThemeContext.js      # จัดการธีม Dark / Light
│   │   │   └── WorkoutContext.js    # State ของรายการออกกำลังกาย (SET/CREATE/UPDATE/DELETE)
│   │   ├── hooks/
│   │   │   ├── useAuthContext.js
│   │   │   ├── useGoogleAuth.js     # เริ่มต้น Google OAuth (PKCE) พร้อมตรวจสถานะ Provider
│   │   │   ├── useLogin.js
│   │   │   ├── useLogout.js
│   │   │   ├── useSignup.js
│   │   │   └── useWorkoutContext.js
│   │   ├── lib/
│   │   │   └── supabaseClient.js    # Browser Supabase Client สำหรับ Google OAuth PKCE
│   │   ├── pages/
│   │   │   ├── AuthCallback.js      # หน้า /auth/callback สำหรับแลก PKCE code เป็น session
│   │   │   ├── Home.js              # หน้าหลัก Dashboard, Search/Filter/Sort และ Skeleton
│   │   │   ├── Login.js             # หน้าเข้าสู่ระบบโฉมใหม่ + ปุ่ม Continue with Google
│   │   │   └── Signup.js            # หน้าสมัครสมาชิกโฉมใหม่ + ปุ่ม Continue with Google
│   │   ├── utils/
│   │   │   └── api.js               # authorizedFetch พร้อมระบบ Auto-refresh JWT
│   │   ├── App.js
│   │   ├── App.test.js
│   │   ├── index.css                # Design tokens และ Responsive Layout
│   │   └── index.js
│   ├── .env.example                 # ตัวอย่างตัวแปรฝั่ง Frontend (ไม่บังคับ)
│   └── package.json
└── README.md
```

---

## 🚀 ขั้นตอนการติดตั้งและใช้งาน

### ขั้นตอนที่ 1: เตรียมฐานข้อมูลบน Supabase

1. สร้างโปรเจกต์ใหม่ที่ [Supabase Dashboard](https://supabase.com/dashboard)
2. ไปที่เมนู **SQL Editor** ➜ **New Query**
3. คัดลอกคำสั่งทั้งหมดจากไฟล์ [supabase/schema.sql](supabase/schema.sql) แล้วกด **Run** เพื่อสร้างตาราง `public.workouts`, Trigger `updated_at`, Index และนโยบาย Row Level Security (RLS)
4. ไปที่ **Project Settings** ➜ **API** เพื่อคัดลอกค่า:
   - `Project URL` (`SUPABASE_URL`)
   - `anon` `public` key (`SUPABASE_ANON_KEY`)
   - `service_role` key (`SUPABASE_SERVICE_ROLE_KEY` — _ไม่บังคับ_)

> **หมายเหตุเรื่องการยืนยันอีเมล (Email Confirmation):**
>
> - หากใส่ `SUPABASE_SERVICE_ROLE_KEY` ใน `backend/.env` ระบบจะสร้างบัญชีพร้อมยืนยันอีเมลอัตโนมัติให้เข้าใช้งานได้ทันที
> - หากไม่ใส่ `SUPABASE_SERVICE_ROLE_KEY` และโปรเจกต์ Supabase เปิด **Confirm email** อยู่ (Authentication ➜ Providers ➜ Email) ผู้ใช้จะต้องกดยืนยันลิงก์ในอีเมลก่อนจึงจะ Login ได้ (หรือปิด Confirm email ชั่วคราวระหว่างพัฒนา)

### ขั้นตอนที่ 2: ตั้งค่า Backend (`backend/.env`)

เปิดไฟล์ [backend/.env](backend/.env) (อ้างอิงจาก [backend/.env.example](backend/.env.example)) แล้วกรอกค่าจาก Supabase:

```env
PORT=3003
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=
```

### ขั้นตอนที่ 3: เปิดใช้งาน Google OAuth (ถ้าต้องการใช้ปุ่ม Continue with Google)

1. เข้าไปที่ [Google Cloud Console ➜ Clients](https://console.cloud.google.com/auth/clients) เพื่อสร้าง **OAuth 2.0 Client ID** (Application type: **Web application**)
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `https://<your-project-ref>.supabase.co/auth/v1/callback` *(ดูค่าจริงได้จาก Supabase Dashboard ➜ Authentication ➜ Providers ➜ Google)*
2. นำ **Client ID** และ **Client Secret** ไปเปิดใช้งานที่ Supabase Dashboard ➜ **Authentication** ➜ **Providers** ➜ **Google**
3. ไปที่ **Authentication** ➜ **URL Configuration** ใน Supabase Dashboard:
   - ตั้ง **Site URL**: `http://localhost:3000`
   - เพิ่มใน **Redirect URLs**: `http://localhost:3000/auth/callback`

### ขั้นตอนที่ 4: ติดตั้ง Dependencies และรันโปรเจกต์

เปิด Terminal 2 หน้าต่าง:

**หน้าต่างที่ 1 — รัน Backend API (พอร์ต 3003):**

```bash
cd backend
npm install
npm run dev
```

**หน้าต่างที่ 2 — รัน Frontend (พอร์ต 3000, Proxy ไปที่ 3003):**

```bash
cd frontend
npm install
npm start
```

จากนั้นเปิดเบราว์เซอร์ไปที่ `http://localhost:3000`

---

## 🔌 สรุป API Endpoints

### Health & Info

- `GET /` — ตรวจสอบสถานะเซิร์ฟเวอร์และการเชื่อมต่อการตั้งค่า Supabase
- `GET /api/health` — ตรวจสอบสถานะสุขภาพของ API (`status`, `supabaseConfigured`)

### Authentication (`/api/user`)

- `GET /api/user/config` — คืนค่า Public Supabase URL และ Publishable/Anon Key สำหรับ OAuth บนเบราว์เซอร์ *(ไม่เปิดเผย Service Role Key)*
- `POST /api/user/signup` — สมัครสมาชิก (`{ email, password, displayName? }`)
- `POST /api/user/login` — เข้าสู่ระบบ (`{ email, password }`)
- `POST /api/user/refresh` — ขอ Access Token ใหม่ด้วย `refreshToken`
- `GET /api/user/me` — ดึงข้อมูลผู้ใช้ปัจจุบัน _(ต้องแนบ `Authorization: Bearer <token>`)_

### Workouts (`/api/workouts`) — _ทุกเส้นทางต้องแนบ `Authorization: Bearer <token>`_

- `GET /api/workouts` — ดึงรายการออกกำลังกายทั้งหมดของผู้ใช้ (เรียงจากใหม่ไปเก่า)
- `GET /api/workouts/:id` — ดึงรายการออกกำลังกายตาม UUID
- `POST /api/workouts` — เพิ่มรายการใหม่ (`{ title, load, reps, sets?, category?, notes? }`)
- `PATCH /api/workouts/:id` — แก้ไขรายการออกกำลังกายตาม UUID
- `DELETE /api/workouts/:id` — ลบรายการออกกำลังกายตาม UUID

---

## 🧪 การทดสอบ (Testing & Build)

- **ทดสอบ Backend (Node built-in test runner):**
  ```bash
  cd backend
  npm test
  ```
- **ทดสอบ Frontend และ Build Production:**
  ```bash
  cd frontend
  npm test -- --watchAll=false
  npm run build
  ```
