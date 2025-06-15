
-- 1. احذف جميع صلاحيات الأدمن لأي مستخدم آخر
delete from public.user_roles where role = 'admin';

-- 2. عين صلاحية الأدمن للمستخدم صاحب الإيميل المطلوب (لو كان الحساب تم إنشاؤه بالفعل)
insert into public.user_roles (user_id, role)
select id, 'admin'::user_role from auth.users where lower(email) = lower('Ahmed.sa.mohamed@gmail.com')
on conflict (user_id, role) do update set role = 'admin';
