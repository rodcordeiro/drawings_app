export type ContentFilter = 'high' | 'low';
export type UnsplashPhoto = { id: string; imageUrl: string; width: number; height: number; photographerName: string; photographerUrl: string; photoUrl: string };
export class UnsplashError extends Error {
  constructor(public code: 'missing_key' | 'unauthorized' | 'rate_limited' | 'network' | 'server' | 'no_result' | 'invalid_payload', message: string, public retryAfter?: number) { super(message); }
}
export async function getRandomPhoto({query, contentFilter = 'high', signal}: {query?: string; contentFilter?: ContentFilter; signal?: AbortSignal}): Promise<UnsplashPhoto> {
  const key = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;
  if (!key) throw new UnsplashError('missing_key', 'Configure a chave pública do Unsplash.');
  const params = new URLSearchParams({content_filter: contentFilter});
  if (query?.trim()) params.set('query', query.trim());
  let response: Response;
  try { response = await fetch('https://api.unsplash.com/photos/random?' + params.toString(), {headers: {Authorization: 'Client-ID ' + key}, signal}); }
  catch { throw new UnsplashError('network', 'Falha de conexão.'); }
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new UnsplashError('unauthorized', 'Acesso não autorizado.');
    if (response.status === 429) {
      const header = response.headers.get('Retry-After');
      const seconds = Number(header);
      throw new UnsplashError('rate_limited', 'Limite de requisições atingido.', header ? (Number.isFinite(seconds) ? Date.now() + seconds * 1000 : Date.parse(header)) : undefined);
    }
    if (response.status === 404) throw new UnsplashError('no_result', 'Nenhuma foto encontrada.');
    throw new UnsplashError(response.status >= 500 ? 'server' : 'invalid_payload', 'Falha na busca.');
  }
  const p = await response.json();
  if (!p?.id || !p?.urls?.regular || !p?.user?.name || !p?.user?.links?.html || !p?.links?.html) throw new UnsplashError('invalid_payload', 'Resposta inválida.');
  return {id: p.id, imageUrl: p.urls.regular, width: p.width, height: p.height, photographerName: p.user.name, photographerUrl: p.user.links.html, photoUrl: p.links.html};
}
