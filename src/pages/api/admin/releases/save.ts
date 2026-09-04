import type { APIRoute } from 'astro';
import { getSupabase } from '../../../../lib/supabase.ts';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const accessToken = cookies.get('sb-access-token')?.value;
  if (!accessToken) {
    return new Response(JSON.stringify({ ok: false, error: 'unauthenticated' }), { status: 401 });
  }

  const supabase = getSupabase();
  const { data: userData, error: userErr } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: cookies.get('sb-refresh-token')?.value ?? '',
  });
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid session' }), { status: 401 });
  }

  const { data: adminRow } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', userData.user.id)
    .maybeSingle();
  if (!adminRow) {
    return new Response(JSON.stringify({ ok: false, error: 'not admin' }), { status: 403 });
  }

  const form = await request.formData();
  const id = form.get('id');
  const min_version = String(form.get('min_version') ?? '').trim();
  const policy = String(form.get('policy') ?? '').trim() || null;
  const notes_markdown = String(form.get('notes_markdown') ?? '');
  const notes_html = md.render(notes_markdown);
  const is_published = form.get('is_published') === 'on';
  const is_force_update = form.get('is_force_update') === 'on';
  const release_date = String(form.get('release_date') ?? new Date().toISOString().slice(0, 10));

  const payload = {
    min_version,
    policy: is_force_update ? 'force_update' : policy,
    notes_markdown,
    notes_html,
    is_published,
    release_date,
    download_url:         String(form.get('download_url') ?? '') || null,
    windows_download_url: String(form.get('windows_download_url') ?? '') || null,
    mac_download_url:     String(form.get('mac_download_url') ?? '') || null,
    linux_download_url:   String(form.get('linux_download_url') ?? '') || null,
    android_download_url: String(form.get('android_download_url') ?? '') || null,
    ios_download_url:     String(form.get('ios_download_url') ?? '') || null,
  };

  let result;
  if (id) {
    result = await supabase.from('app_config').update(payload).eq('id', id);
  } else {
    result = await supabase.from('app_config').insert({ ...payload, created_at: new Date().toISOString() });
  }

  if (result.error) {
    console.error('save release error:', result.error.message);
    return redirect(`/admin/releases${id ? `/${id}` : '/new'}?error=save_failed`);
  }
  return redirect('/admin/releases?saved=1');
};
