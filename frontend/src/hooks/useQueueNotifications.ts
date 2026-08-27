import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Page, Status, TruckRequest, User } from '../types';

let notificationAudioContext: AudioContext | null = null;
let notificationAudio: HTMLAudioElement | null = null;
const notificationSoundUrl = '/sounds/alert.wav';

export type QueueSnapshot = {
  status: Status | null;
  rows: TruckRequest[];
  alerts: TruckRequest[];
  count: number;
  isPending: boolean;
  error: Error | null;
  refetch: () => void;
  acknowledge: (id: string) => void;
};

function playNotificationChime(count: number) {
  if (count < 1 || typeof window.AudioContext === 'undefined') return;
  const context = notificationAudioContext ?? new window.AudioContext();
  notificationAudioContext = context;
  void context.resume().then(() => {
    const start = context.currentTime + 0.03;
    for (let item = 0; item < count; item += 1) {
      const offset = item * 0.48;
      for (const [note, frequency] of [[0, 659.25], [0.12, 880]] as const) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, start + offset + note);
        gain.gain.exponentialRampToValueAtTime(0.12, start + offset + note + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + note + 0.28);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(start + offset + note);
        oscillator.stop(start + offset + note + 0.3);
      }
    }
  }).catch(() => undefined);
}

function playNotificationSound(count: number) {
  if (count < 1) return;
  if (typeof window.Audio === 'undefined') {
    playNotificationChime(count);
    return;
  }
  let failed = false;
  for (let item = 0; item < count; item += 1) {
    window.setTimeout(() => {
      const audio = (notificationAudio?.cloneNode(true) as HTMLAudioElement | null) ?? new Audio(notificationSoundUrl);
      audio.volume = 0.85;
      void audio.play().catch(() => {
        if (!failed) {
          failed = true;
          playNotificationChime(count);
        }
      });
    }, item * 520);
  }
}

export function useQueueNotifications(user: User): QueueSnapshot {
  const status: Status | null = user.role === 'fte_ops' ? 'PENDING' : user.role === 'fte_mm' ? 'APPROVED' : user.role === 'doc_officer' || user.role === 'dock_officer' ? 'FOR_DOCKING' : null;
  const knownIds = useRef<Set<string> | null>(null);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(() => new Set());
  const query = useQuery({
    queryKey: ['requests', 'notification-queue', status],
    queryFn: () => api<Page<TruckRequest>>(`/requests?status=${status}&per_page=100&sort=created_at&direction=desc`),
    enabled: status !== null,
    refetchInterval: status ? 5_000 : false,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!status) return;
    const unlock = () => {
      notificationAudio ??= new Audio(notificationSoundUrl);
      notificationAudio.preload = 'auto';
      notificationAudio.load();
      if (typeof window.AudioContext !== 'undefined') {
        notificationAudioContext ??= new window.AudioContext();
        void notificationAudioContext.resume();
      }
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [status]);

  useEffect(() => {
    if (!query.data) return;
    const current = new Set(query.data.data.map(request => request.id));
    if (knownIds.current === null) {
      knownIds.current = current;
      return;
    }
    const newCount = query.data.data.filter(request => !knownIds.current?.has(request.id)).length;
    knownIds.current = new Set([...knownIds.current, ...current]);
    if (newCount) playNotificationSound(newCount);
  }, [query.data]);

  const rows = query.data?.data ?? [];
  const alerts = useMemo(() => rows.filter(request => !acknowledged.has(request.id)), [acknowledged, rows]);

  return {
    status,
    rows,
    alerts,
    count: query.data?.total ?? 0,
    isPending: status !== null && query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    acknowledge: id => setAcknowledged(current => new Set([...current, id])),
  };
}
