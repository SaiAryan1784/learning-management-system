import { useEffect, useRef } from "react";

const IDLE_TIMEOUT = 60 * 60 * 1000; // 60 min — only applies to non-"remembered" sessions

// "Remember for 30 days" sessions rely solely on the 30-day token expiry — no inactivity
// logout. `remembered` is reactive auth state (not just a mount-time localStorage read),
// because login/logout happen via client-side navigation without a page reload.
export default function useIdleLogout(logout, remembered) {
  const logoutRef = useRef(logout);
  logoutRef.current = logout;
  const timer = useRef(null);

  useEffect(() => {
    if (remembered) return;

    const resetTimer = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => logoutRef.current(), IDLE_TIMEOUT);
    };

    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [remembered]);
}
