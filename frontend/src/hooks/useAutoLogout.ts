import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const TIMEOUT_MS = 60 * 60 * 1000;       // 1 hour
const WARN_BEFORE_MS = 5 * 60 * 1000;    // warn 5 minutes before
const THROTTLE_MS = 30 * 1000;           // only reset timer every 30s of activity

export function useAutoLogout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const logoutTimer = useRef<ReturnType<typeof setTimeout>>();
  const warnTimer = useRef<ReturnType<typeof setTimeout>>();
  const lastReset = useRef<number>(Date.now());
  const warnToastShown = useRef(false);

  const schedule = useCallback(() => {
    clearTimeout(logoutTimer.current);
    clearTimeout(warnTimer.current);
    warnToastShown.current = false;

    // Warning toast 5 minutes before logout
    warnTimer.current = setTimeout(() => {
      if (!warnToastShown.current) {
        warnToastShown.current = true;
        toast({
          title: 'Session expiring soon',
          description: 'You will be logged out in 5 minutes due to inactivity. Move your mouse or press a key to stay signed in.',
          duration: 15000,
        });
      }
    }, TIMEOUT_MS - WARN_BEFORE_MS);

    // Auto logout after 1 hour of inactivity
    logoutTimer.current = setTimeout(async () => {
      await signOut();
      navigate('/auth?session=expired', { replace: true });
    }, TIMEOUT_MS);
  }, [signOut, navigate, toast]);

  useEffect(() => {
    if (!user) return;

    const events: string[] = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastReset.current > THROTTLE_MS) {
        lastReset.current = now;
        schedule();
      }
    };

    events.forEach(e => document.addEventListener(e, handleActivity, { passive: true }));
    schedule(); // Start timer on mount / user change

    return () => {
      events.forEach(e => document.removeEventListener(e, handleActivity));
      clearTimeout(logoutTimer.current);
      clearTimeout(warnTimer.current);
    };
  }, [user, schedule]);
}
