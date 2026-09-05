import type { APIRoute } from 'astro';
import { getSupabase } from '../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_json' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const description = String(body.description ?? '').trim();
  if (description.length < 3) {
    return new Response(
      JSON.stringify({ ok: false, error: 'description_required' }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    );
  }
  if (description.length > 2000) {
    return new Response(
      JSON.stringify({ ok: false, error: 'description_too_long' }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    );
  }

  const email = String(body.email ?? '').trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(
      JSON.stringify({ ok: false, error: 'email_invalid' }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    );
  }

  // Try to identify the signed-in admin (optional context only).
  const accessToken = cookies.get('sb-access-token')?.value;
  const supabase = getSupabase();
  let reporterId: string | null = null;
  if (accessToken) {
    const { data } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: cookies.get('sb-refresh-token')?.value ?? '',
    });
    if (data.user) reporterId = data.user.id;
  }

  // Latest published release id (best-effort, may be null).
  let releaseId: number | null = null;
  let version: string | null = null;
  const { data: latest } = await supabase
    .from('app_config')
    .select('id, min_version')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latest) {
    releaseId = latest.id;
    version = latest.min_version ?? null;
  }

  const { error } = await supabase.from('broken_link_reports').insert({
    release_id: releaseId,
    version,
    platform: body.platform ? String(body.platform).slice(0, 32) : null,
    user_email: email || null,
    description: description.slice(0, 2000),
    user_agent: request.headers.get('user-agent')?.slice(0, 500) ?? null,
    page_url: body.page_url ? String(body.page_url).slice(0, 500) : null,
    // user_id column doesn't exist; keep it null on insert
  });

  if (error) {
    console.error('broken_link_reports insert error:', error.message);
    return new Response(
      JSON.stringify({ ok: false, error: 'db_error', detail: error.message }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    );
  }

  return new Response(
    JSON.stringify({ ok: true, reporter: reporterId ? 'admin' : 'anon', release_id: releaseId, version }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
};
