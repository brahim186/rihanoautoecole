
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function generateStrongPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let pass = '';
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  for (let i = 0; i < bytes.length; i++) {
    pass += chars[bytes[i] % chars.length];
  }
  return pass + '!' + Math.floor(10 + Math.random() * 89);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'غير مصرح' }), { status: 401, headers: jsonHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // 1) نتأكدو شكون لي طالب (بالتوكن ديالو)
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await callerClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'غير مصرح' }), { status: 401, headers: jsonHeaders });
    }

    const { data: callerProfile, error: profileError } = await callerClient
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !callerProfile || callerProfile.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'هاد الخدمة خاصة بالسوبر أدمن فقط' }), { status: 403, headers: jsonHeaders });
    }

    // 2) نجيبو company_id لي طلب فيه التبديل
    const body = await req.json().catch(() => ({}));
    const companyId = body.company_id;
    if (!companyId) {
      return new Response(JSON.stringify({ error: 'company_id ناقص' }), { status: 400, headers: jsonHeaders });
    }

    // 3) Client بصلاحيات كاملة (service role) باش نبدلو كلمة السر فعليا
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: targetProfile, error: targetError } = await adminClient
      .from('user_profiles')
      .select('id')
      .eq('company_id', companyId)
      .limit(1)
      .single();

    if (targetError || !targetProfile) {
      return new Response(JSON.stringify({ error: 'ماكاينش مستخدم مرتبط بهاد الشركة' }), { status: 404, headers: jsonHeaders });
    }

    const newPassword = generateStrongPassword();

    const { error: updateError } = await adminClient.auth.admin.updateUserById(targetProfile.id, {
      password: newPassword,
    });
    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), { status: 500, headers: jsonHeaders });
    }

    return new Response(JSON.stringify({ password: newPassword }), { status: 200, headers: jsonHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'خطأ غير متوقع' }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});
