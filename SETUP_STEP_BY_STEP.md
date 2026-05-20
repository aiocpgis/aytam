# تشغيل مشروع إدارة الأيتام مع Supabase

## 1) الحزم

إذا لم تثبت الحزم بعد:

```bash
npm install
```

إذا كنت داخل مشروعك الحالي وثبتت Supabase فقط، تأكد من وجود هذه الحزم أيضًا:

```bash
npm install react-router-dom lucide-react xlsx
npm install -D tailwindcss@3.4.17 postcss autoprefixer
```

## 2) ملف البيئة

تأكد أن الملف `.env.local` موجود في جذر المشروع ويحتوي:

```env
VITE_SUPABASE_URL=https://hizrvkxubfiobjhrbmcn.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_EbSPC5UDSZbUwt7_kZw0yg_BoczEwoM
```

بعد تعديل `.env.local` يجب إيقاف السيرفر وتشغيله من جديد.

## 3) إنشاء قاعدة البيانات والتخزين

افتح Supabase Dashboard ثم SQL Editor، وشغّل الملف:

```txt
supabase/schema.sql
```

هذا الملف ينشئ الجداول والسياسات وBucket باسم:

```txt
orphan-documents
```

## 4) إنشاء حساب المدير

من Supabase Dashboard:

Authentication > Users > Add user

أنشئ المستخدم المدير بالبريد وكلمة المرور التي تريدها.

بعدها انسخ User ID الخاص بالمستخدم، ثم شغّل SQL التالي بعد تعديله:

```sql
insert into public.admin_users (id, email, name, role)
values (
  'USER_ID_HERE',
  'ADMIN_EMAIL_HERE',
  'Super Admin',
  'super_admin'
);
```

أو استخدم الملف:

```txt
supabase/create-admin.sql
```

## 5) التشغيل

```bash
npm run dev
```

الروابط:

```txt
/              واجهة تقديم طلب كفالة عامة
/admin/login   دخول الإدارة
/admin         لوحة الإدارة
```

## 6) ملاحظات مهمة

- لا تستخدم `NEXT_PUBLIC_` لأن المشروع Vite وليس Next.js.
- لا تستخدم `@supabase/ssr` هنا؛ يكفي `@supabase/supabase-js`.
- لا تضع Service Role Key داخل React أبدًا.
- رفع الملفات يتم إلى Storage Bucket خاص، وفتح الملفات من الإدارة يتم عبر Signed URL مؤقت.
