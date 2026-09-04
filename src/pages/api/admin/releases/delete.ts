import type { APIRoute } from 'astro';
import { getSupabase } from '../../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const accessToken = cookies.get('sb-access-token')?.value;
  if (!accessToken) return new Response('unauthenticated', { status: 401 });

  const supabase = getSupabase();
  await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: cookies.get('sb-refresh-token')?.value ?? '',
  });

  const form = await request.formData();
  const id = form.get('id');
  if (!id) return redirect('/admin/releases');

  const { error } = await supabase.from('app_config').delete().eq('id', id);
  if (error) {
    console.error('delete release error:', error.message);
    return redirect('/admin/releases?error=delete_failed');
  }
  return redirect('/admin/releases?deleted=1');
};
