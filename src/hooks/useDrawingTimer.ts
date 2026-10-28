import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

export type DrawingTimerStatus = 'disabled' | 'paused' | 'running' | 'completed';

type Options = {
  durationSeconds: number;
  enabled?: boolean;
  startPaused?: boolean;
  onComplete?: () => void;
};

const clampDuration = (value: number) =>
  Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;

/**
 * A drift-resistant countdown. Time advances only while the app is active.
 * Call start() after the reference image has actually loaded.
 */
export function useDrawingTimer({
  durationSeconds,
  enabled = true,
  startPaused = true,
  onComplete,
}: Options) {
  const [duration, setDurationState] = useState(() => clampDuration(durationSeconds));
  const [remainingSeconds, setRemainingSeconds] = useState(() => clampDuration(durationSeconds));
  const [status, setStatus] = useState<DrawingTimerStatus>(
    enabled ? (startPaused ? 'paused' : 'running') : 'disabled',
  );
  const deadline = useRef<number | null>(null);
  const remainingRef = useRef(remainingSeconds);
  const statusRef = useRef(status);
  const onCompleteRef = useRef(onComplete);
  const completedRef = useRef(false);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { remainingRef.current = remainingSeconds; }, [remainingSeconds]);
  useEffect(() => { statusRef.current = status; }, [status]);

  const pause = useCallback(() => {
    if (statusRef.current !== 'running') return;
    const left = deadline.current === null
      ? remainingRef.current
      : Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
    deadline.current = null;
    remainingRef.current = left;
    setRemainingSeconds(left);
    statusRef.current = 'paused';
    setStatus('paused');
  }, []);

  const start = useCallback(() => {
    if (!enabled) return;
    completedRef.current = false;
    const left = remainingRef.current > 0 ? remainingRef.current : duration;
    remainingRef.current = left;
    setRemainingSeconds(left);
    deadline.current = Date.now() + left * 1000;
    statusRef.current = 'running';
    setStatus('running');
  }, [duration, enabled]);

  const reset = useCallback((autoStart = false) => {
    deadline.current = null;
    completedRef.current = false;
    remainingRef.current = duration;
    setRemainingSeconds(duration);
    statusRef.current = enabled ? 'paused' : 'disabled';
    setStatus(statusRef.current);
    if (autoStart && enabled) {
      deadline.current = Date.now() + duration * 1000;
      statusRef.current = 'running';
      setStatus('running');
    }
  }, [duration, enabled]);

  const setDuration = useCallback((seconds: number, autoStart = false) => {
    const next = clampDuration(seconds);
    setDurationState(next);
    remainingRef.current = next;
    setRemainingSeconds(next);
    deadline.current = autoStart && enabled ? Date.now() + next * 1000 : null;
    completedRef.current = false;
    statusRef.current = !enabled ? 'disabled' : autoStart ? 'running' : 'paused';
    setStatus(statusRef.current);
  }, [enabled]);

  useEffect(() => {
    setDuration(durationSeconds, false);
  }, [durationSeconds, setDuration]);

  useEffect(() => {
    if (!enabled) {
      deadline.current = null;
      statusRef.current = 'disabled';
      setStatus('disabled');
    } else if (statusRef.current === 'disabled') {
      statusRef.current = 'paused';
      setStatus('paused');
    }
  }, [enabled]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') pause();
    });
    return () => subscription.remove();
  }, [pause]);

  useEffect(() => {
    if (status !== 'running') return;
    if (deadline.current === null) {
      deadline.current = Date.now() + remainingRef.current * 1000;
    }
    const tick = () => {
      if (deadline.current === null || statusRef.current !== 'running') return;
      const left = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      remainingRef.current = left;
      setRemainingSeconds(left);
      if (left === 0 && !completedRef.current) {
        completedRef.current = true;
        deadline.current = null;
        statusRef.current = 'completed';
        setStatus('completed');
        onCompleteRef.current?.();
      }
    };
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [status]);

  return {
    remainingSeconds,
    status,
    durationSeconds: duration,
    start,
    resume: start,
    pause,
    reset,
    setDuration,
  };
}
