# orphan-care-supabase

نظام ويب عربي لإدارة بيانات الأيتام وطلبات الكفالة باستخدام:

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase Database
- Supabase Storage
- Supabase Auth

## الميزات

- واجهة عامة لتقديم طلب كفالة بدون تسجيل دخول.
- رفع الأوراق الثبوتية إلى Supabase Storage.
- شاشة تحميل بتأثير تبرع/طفل/قلوب.
- دخول إدارة محمي عبر Supabase Auth.
- لوحة تحكم بإحصائيات.
- إدارة الأيتام: إضافة، تعديل، حذف، بحث، فلترة.
- استيراد Excel حسب قالب الأيتام المرفق.
- مراجعة طلبات الكفالة الجديدة واعتمادها أو رفضها.
- فتح الملفات المرفوعة من الإدارة عبر روابط موقعة مؤقتة.

## التشغيل السريع

```bash
npm install
npm run dev
```

## إعداد Supabase

راجع الملف:

```txt
SETUP_STEP_BY_STEP.md
```

ثم شغّل SQL:

```txt
supabase/schema.sql
```

وبعد إنشاء مستخدم المدير من Supabase Auth، شغّل:

```txt
supabase/create-admin.sql
```

بعد تعديل القيم المطلوبة داخله.

## متغيرات البيئة

يجب وجود ملف `.env.local`:

```env
VITE_SUPABASE_URL=https://hizrvkxubfiobjhrbmcn.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_EbSPC5UDSZbUwt7_kZw0yg_BoczEwoM
```

## أمان

- لا تضع Service Role Key داخل الواجهة.
- Bucket الملفات خاص وليس عامًا.
- قراءة الملفات من الإدارة تتم عبر Signed URL قصير المدة.
- RLS مفعل على الجداول.
