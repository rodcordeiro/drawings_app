import { useCallback, useEffect, useRef, useState } from 'react';
import { Image } from 'react-native';
import { getRandomPhoto, UnsplashError, type UnsplashPhoto } from '@/services/unsplash';
import type { UnsplashSettings } from '@/stores/unsplashSettings';
import { shuffleTerms } from '@/utils/unsplash.util';

export type SessionStatus = 'loading_initial' | 'ready' | 'transitioning' | 'waiting_next' | 'recoverable_error';
type Request = { controller: AbortController; id: number };
const sleep = (ms: number, signal: AbortSignal) => new Promise<void>((resolve, reject) => {
  if (signal.aborted) { reject(new Error('Cancelled')); return; }
  const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, ms);
  const abort = () => { clearTimeout(timer); reject(new Error('Cancelled')); };
  signal.addEventListener('abort', abort, { once: true });
});
export function useUnsplashSession(settings?: UnsplashSettings) {
  const [currentPhoto, setCurrentPhoto] = useState<UnsplashPhoto>();
  const [nextPhoto, setNextPhoto] = useState<UnsplashPhoto>();
  const [status, setStatus] = useState<SessionStatus>('loading_initial');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [generation, setGeneration] = useState(0);
  const seenPhotoIds = useRef(new Set<string>());
  const termBag = useRef<string[]>([]);
  const current = useRef<UnsplashPhoto | undefined>(undefined);
  const nextRef = useRef<UnsplashPhoto | undefined>(undefined);
  const currentLoaded = useRef(false);
  const nextLoaded = useRef(false);
  const busy = useRef(false);
  const disposed = useRef(false);
  const requestId = useRef(0);
  const requests = useRef(new Set<AbortController>());
  const cooldownUntil = useRef(0);
  const [readyGeneration, setReadyGeneration] = useState(0);

  const newRequest = useCallback((): Request => {
    const controller = new AbortController();
    requests.current.add(controller);
    return { controller, id: ++requestId.current };
  }, []);
  const finishRequest = useCallback((request: Request) => {
    requests.current.delete(request.controller);
  }, []);
  const selectTerm = useCallback((config: UnsplashSettings): string | undefined => {
    if (!config.searchTerms.length) return undefined;
    if (!termBag.current.length) termBag.current = shuffleTerms(config.searchTerms);
    return termBag.current.pop();
  }, []);
  const fetchWithRetry = useCallback(async (config: UnsplashSettings, query: string | undefined, signal: AbortSignal) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      if (signal.aborted) throw new Error('Cancelled');
      if (Date.now() < cooldownUntil.current) throw new UnsplashError('rate_limited', 'Aguarde o limite de requisições.', cooldownUntil.current);
      try { return await getRandomPhoto({query, contentFilter: config.contentFilter, signal}); }
      catch (cause) {
        if (cause instanceof UnsplashError && cause.code === 'rate_limited') {
          cooldownUntil.current = cause.retryAfter && Number.isFinite(cause.retryAfter) ? cause.retryAfter : Date.now() + 60_000;
          throw cause;
        }
        if (!(cause instanceof UnsplashError) || !['network', 'server'].includes(cause.code) || attempt === 2) throw cause;
        await sleep(400 * (2 ** attempt), signal);
      }
    }
    throw new Error('Tentativas esgotadas');
  }, []);
  const obtainUnique = useCallback(async (config: UnsplashSettings, signal: AbortSignal) => {
    const terms = config.searchTerms.length ? Array.from({length: config.searchTerms.length}, () => selectTerm(config)) : [undefined];
    let fallback = false;
    for (const query of terms) {
      for (let duplicates = 0; duplicates < 3; duplicates++) {
        try {
          const photo = await fetchWithRetry(config, query, signal);
          if (!seenPhotoIds.current.has(photo.id) && photo.id !== current.current?.id && photo.id !== nextRef.current?.id) return {photo, fallback};
        } catch (cause) {
          if (cause instanceof UnsplashError && cause.code === 'no_result') break;
          throw cause;
        }
      }
    }
    if (config.searchTerms.length) {
      fallback = true;
      for (let duplicates = 0; duplicates < 3; duplicates++) {
        const photo = await fetchWithRetry(config, undefined, signal);
        if (!seenPhotoIds.current.has(photo.id) && photo.id !== current.current?.id && photo.id !== nextRef.current?.id) return {photo, fallback};
      }
    }
    throw new UnsplashError('no_result', 'Não há novas fotografias disponíveis. Tente novamente.');
  }, [fetchWithRetry, selectTerm]);
  const loadPhoto = useCallback(async (photo: UnsplashPhoto, signal: AbortSignal) => {
    if (signal.aborted) throw new Error('Cancelled');
    await Image.prefetch(photo.imageUrl);
    if (signal.aborted) throw new Error('Cancelled');
  }, []);
  const prefetchNext = useCallback(async (config: UnsplashSettings) => {
    if (disposed.current || nextRef.current || !current.current) return;
    const originId = current.current.id;
    const request = newRequest();
    try {
      const {photo} = await obtainUnique(config, request.controller.signal);
      await loadPhoto(photo, request.controller.signal);
      if (disposed.current || request.controller.signal.aborted || nextRef.current || current.current?.id !== originId || photo.id === current.current?.id) return;
      nextLoaded.current = true;
      nextRef.current = photo;
      setNextPhoto(photo);
    } catch { /* Retain current image. Manual/automatic next can retry. */ }
    finally { finishRequest(request); }
  }, [finishRequest, loadPhoto, newRequest, obtainUnique]);
  const begin = useCallback(async (config: UnsplashSettings) => {
    if (busy.current || disposed.current) return;
    busy.current = true;
    setStatus('loading_initial');
    setError('');
    const request = newRequest();
    try {
      const result = await obtainUnique(config, request.controller.signal);
      await loadPhoto(result.photo, request.controller.signal);
      if (disposed.current || request.controller.signal.aborted) return;
      current.current = result.photo;
      currentLoaded.current = false;
      seenPhotoIds.current.add(result.photo.id);
      setCurrentPhoto(result.photo);
      setGeneration(g => g + 1);
      setNotice(result.fallback ? 'Nenhum termo retornou foto; busca aleatória utilizada.' : '');
      setStatus('transitioning');
    } catch (cause) {
      if (!disposed.current && !request.controller.signal.aborted) { setError(cause instanceof Error ? cause.message : 'Falha na busca.'); setStatus('recoverable_error'); }
    } finally { busy.current = false; finishRequest(request); }
  }, [finishRequest, loadPhoto, newRequest, obtainUnique]);
  const next = useCallback(async (config: UnsplashSettings) => {
    if (busy.current || disposed.current || !current.current) return;
    busy.current = true;
    setError('');
    setStatus('waiting_next');
    const request = newRequest();
    try {
      const candidate = nextLoaded.current && nextRef.current
        ? {photo: nextRef.current, fallback: false}
        : await obtainUnique(config, request.controller.signal);
      if (!nextLoaded.current || candidate.photo !== nextRef.current) await loadPhoto(candidate.photo, request.controller.signal);
      if (disposed.current || request.controller.signal.aborted) return;
      nextLoaded.current = false;
      nextRef.current = undefined;
      setNextPhoto(undefined);
      current.current = candidate.photo;
      currentLoaded.current = false;
      seenPhotoIds.current.add(candidate.photo.id);
      setCurrentPhoto(candidate.photo);
      setGeneration(g => g + 1);
      setNotice(candidate.fallback ? 'Termos sem resultados; busca aleatória utilizada.' : '');
      setStatus('transitioning');
    } catch (cause) {
      if (!disposed.current && !request.controller.signal.aborted) { setError(cause instanceof Error ? cause.message : 'Falha ao avançar.'); setStatus('recoverable_error'); }
    } finally { busy.current = false; finishRequest(request); }
  }, [finishRequest, loadPhoto, newRequest, obtainUnique]);
  const markLoaded = useCallback((config: UnsplashSettings, photoId: string) => {
    if (photoId !== current.current?.id || currentLoaded.current || disposed.current) return;
    currentLoaded.current = true;
    setStatus('ready');
    setReadyGeneration(g => g + 1);
    void prefetchNext(config);
  }, [prefetchNext]);
  const markFailed = useCallback((photoId: string) => {
    if (photoId !== current.current?.id || disposed.current) return;
    setError('A imagem não carregou. Tente a próxima.');
    setStatus('recoverable_error');
  }, []);
  useEffect(() => {
    return () => {
      disposed.current = true;
      requests.current.forEach(controller => controller.abort());
      requests.current.clear();
    };
  }, []);
  const initialized = useRef(false);
  useEffect(() => {
    if (settings && !initialized.current) {
      initialized.current = true;
      void begin(settings);
    }
  }, [settings, begin]);
  const retry = useCallback((config: UnsplashSettings) => current.current ? next(config) : begin(config), [begin, next]);
  return {currentPhoto, nextPhoto, status, error, notice, generation, readyGeneration, seenPhotoIds: seenPhotoIds.current, next, retry, markLoaded, markFailed};
}
