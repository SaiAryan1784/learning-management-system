import { useEffect, useRef } from "react";

const IDLE_TIMEOUT = 20 * 60 * 1000; // 20 min

export default function useIdleLogout(logout) {
  const logoutRef = useRef(logout);
  logoutRef.current = logout;
  const timer = useRef(null);

  useEffect(() => {
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
  }, []);
}
