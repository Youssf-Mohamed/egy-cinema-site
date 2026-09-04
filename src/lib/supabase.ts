import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY. Set them in Vercel env or a local .env file.',
    );
  }
  _client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'egy-cinema-admin-auth',
    },
  });
  return _client;
}

export type PlatformKey =
  | 'download_url'
  | 'windows_download_url'
  | 'mac_download_url'
  | 'linux_download_url'
  | 'android_download_url'
  | 'ios_download_url';

export interface LatestRelease {
  id: number;
  min_version: string;
  release_date: string;
  policy: string | null;
  download_url: string | null;
  windows_download_url: string | null;
  mac_download_url: string | null;
  linux_download_url: string | null;
  android_download_url: string | null;
  ios_download_url: string | null;
  notes_html: string;
  notes_markdown: string;
  is_published: boolean;
  is_force_update?: boolean;
}

export interface PublishedRelease {
  id: number;
  min_version: string;
  release_date: string;
  notes_html: string;
  notes_markdown: string;
}

export async function fetchLatestRelease(): Promise<LatestRelease | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('latest_release')
    .select('*')
    .maybeSingle();
  if (error) {
    console.error('fetchLatestRelease error:', error.message);
    return null;
  }
  return data as LatestRelease | null;
}

export async function fetchPublishedReleases(): Promise<PublishedRelease[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('published_releases')
    .select('id, min_version, release_date, notes_html, notes_markdown')
    .order('release_date', { ascending: false });
  if (error) {
    console.error('fetchPublishedReleases error:', error.message);
    return [];
  }
  return (data ?? []) as PublishedRelease[];
}

export async function fetchAllReleasesForAdmin(): Promise<LatestRelease[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('app_config')
    .select('*')
    .order('id', { ascending: false });
  if (error) {
    console.error('fetchAllReleasesForAdmin error:', error.message);
    return [];
  }
  return (data ?? []) as LatestRelease[];
}

export function platformUrl(
  release: LatestRelease | null | undefined,
  platform: PlatformKey,
): string | null {
  if (!release) return null;
  return release[platform] ?? null;
}
