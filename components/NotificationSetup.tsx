'use client';

import { useEffect, useState } from 'react';

const LAST_PRACTICE_KEY = 'ubuntu_last_practice';
const NOTIF_ASKED_KEY   = 'ubuntu_notif_asked';
const GAP_MS            = 20 * 60 * 60 * 1000; // 20h

export function markPracticed() {
  try { localStorage.setItem(LAST_PRACTICE_KEY, String(Date.now())); } catch { /* ignore */ }
}

function hoursSinceLastPractice(): number | null {
  try {
    const raw = localStorage.getItem(LAST_PRACTICE_KEY);
    if (!raw) return null;
    return (Date.now() - Number(raw)) / (1000 * 60 * 60);
  } catch { return null; }
}

export default function NotificationSetup() {
  const [banner, setBanner]         = useState<'ask' | 'reminder' | null>(null);
  const [dismissed, setDismissed]   = useState(false);

  useEffect(() => {
    if (dismissed) return;
    if (!('Notification' in window)) return;

    const asked   = localStorage.getItem(NOTIF_ASKED_KEY);
    const hours   = hoursSinceLastPractice();
    const granted = Notification.permission === 'granted';

    // Show reminder banner if granted and hasn't practiced in 20h+
    if (granted && hours !== null && hours >= 20) {
      setBanner('reminder');
      return;
    }
    // Ask for permission once if never asked and no practice yet today
    if (!asked && Notification.permission === 'default') {
      // Wait a bit before asking (not on first second of the session)
      const t = setTimeout(() => setBanner('ask'), 3000);
      return () => clearTimeout(t);
    }
  }, [dismissed]);

  const requestPermission = async () => {
    localStorage.setItem(NOTIF_ASKED_KEY, '1');
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      // Schedule daily reminder via SW
      scheduleDailyReminder();
    }
    dismiss();
  };

  const dismiss = () => { setDismissed(true); setBanner(null); };

  if (!banner || dismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-safe pt-3 pointer-events-none">
      <div className="max-w-md w-full bg-ink text-white rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3 pointer-events-auto animate-fade-in">
        <span className="text-xl shrink-0">{banner === 'ask' ? '🔔' : '⏰'}</span>
        <p className="flex-1 text-sm font-medium leading-snug">
          {banner === 'ask'
            ? 'Activer les rappels quotidiens ?'
            : 'Tu n\'as pas pratiqué aujourd\'hui !'}
        </p>
        {banner === 'ask' ? (
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={dismiss}
              className="text-xs text-white/60 hover:text-white transition-colors px-2 py-1">
              Non
            </button>
            <button type="button" onClick={requestPermission}
              className="text-xs bg-accent px-3 py-1.5 rounded-lg font-semibold hover:bg-accent-dark transition-all">
              Oui
            </button>
          </div>
        ) : (
          <button type="button" onClick={dismiss}
            className="text-white/60 hover:text-white transition-colors text-lg leading-none shrink-0">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

// ── Daily reminder via Service Worker ─────────────────────────────────────────

function scheduleDailyReminder() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.ready.then((reg) => {
    // Ask the SW to schedule a check
    reg.active?.postMessage({ type: 'SCHEDULE_REMINDER', delayMs: GAP_MS });
  });
}
