import { useCallback, useState } from "react";

const isSupported =
  typeof window !== "undefined" && "Notification" in window;

// Thin wrapper around the browser Notification API. Returns the current
// permission, a way to request it (must be called from a user gesture), and a
// `notify()` that no-ops unless permission has been granted.
export function useNotification() {
  const [permission, setPermission] = useState(
    isSupported ? Notification.permission : "denied",
  );

  const requestPermission = useCallback(async () => {
    if (!isSupported || permission !== "default") return permission;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, [permission]);

  const notify = useCallback((title, options) => {
    if (!isSupported || Notification.permission !== "granted") return;
    try {
      new Notification(title, options);
    } catch {
      // Some browsers only allow notifications from a service worker; ignore.
    }
  }, []);

  return { permission, requestPermission, notify };
}
