import type { APIRoute } from 'astro';
import { getSupabase } from '../../../../lib/supabase.ts';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

async function tryUploadFile(
  supabase: ReturnType<typeof getSupabase>,
  file: unknown,
  version: string,
  platform: 'windows' | 'android',
): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > 524288000) throw new Error(`${platform} file too large (max 500 MB)`);

  const safeVersion = (version || 'untitled').replace(/[^a-zA-Z0-9._-]/g, '_');
  const ext = file.name.split('.').pop() || (platform === 'windows' ? 'zip' : 'apk');
  const fileName = `${platform}-${Date.now()}.${ext}`;
  const objectPath = `releases/${safeVersion}/${fileName}`;

  const { error } = await supabase.storage.from('releases').upload(objectPath, file, {
    upsert: true,
    contentType: file.type || undefined,
  });
  if (error) throw new Error(`${platform} upload failed: ${error.message}`);

  const { data } = supabase.storage.from('releases').getPublicUrl(objectPath);
  return data.publicUrl;
}

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
  if (!min_version) {
    return redirect(`/admin/releases${id ? `/${id}` : '/new'}?error=save_failed`);
  }
  const policy = String(form.get('policy') ?? '').trim() || null;
  const notes_markdown = String(form.get('notes_markdown') ?? '');
  const notes_html = md.render(notes_markdown);
  const is_published = form.get('is_published') === 'on';
  const is_force_update = form.get('is_force_update') === 'on';
  const release_date = String(form.get('release_date') ?? new Date().toISOString().slice(0, 10));

  // Handle direct file uploads (fallback when JS is disabled or for small files)
  // Client-side JS already uploads files directly to storage and sets URL fields,
  // but this fallback handles the case where files are POSTed to this endpoint (Vercel 4.5 MB limit applies).
  let windowsUrlFromFile: string | null = null;
  let androidUrlFromFile: string | null = null;
  try {
    windowsUrlFromFile = await tryUploadFile(supabase, form.get('windows_file'), min_version, 'windows');
  } catch (e) {
    console.error('windows file upload error:', e);
    return new Response(`Windows upload failed: ${(e as Error).message}`, { status: 400 });
  }
  try {
    androidUrlFromFile = await tryUploadFile(supabase, form.get('android_file'), min_version, 'android');
  } catch (e) {
    console.error('android file upload error:', e);
    return new Response(`Android upload failed: ${(e as Error).message}`, { status: 400 });
  }

  // URL fields are used if no file was uploaded
  const windowsUrlFromInput = String(form.get('windows_download_url') ?? '').trim() || null;
  const androidUrlFromInput = String(form.get('android_download_url') ?? '').trim() || null;
  const genericInput = String(form.get('download_url') ?? '').trim() || null;

  // download_url is the legacy Android/main column — keep it synced with Android
  const resolvedAndroidUrl = androidUrlFromFile ?? androidUrlFromInput ?? genericInput;
  const resolvedDownloadUrl = resolvedAndroidUrl ?? genericInput;

  const payload = {
    min_version,
    policy: is_force_update ? 'force_update' : policy,
    notes_markdown,
    notes_html,
    is_published,
    release_date,
    download_url:         resolvedDownloadUrl,
    windows_download_url: windowsUrlFromFile ?? windowsUrlFromInput,
    mac_download_url:     String(form.get('mac_download_url') ?? '').trim() || null,
    linux_download_url:   String(form.get('linux_download_url') ?? '').trim() || null,
    android_download_url: resolvedAndroidUrl,
    ios_download_url:     String(form.get('ios_download_url') ?? '').trim() || null,
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
