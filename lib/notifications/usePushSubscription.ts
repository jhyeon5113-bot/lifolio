"use client";

import { useCallback, useEffect, useState } from "react";

// VAPID public keys arrive URL-safe-base64-encoded; PushManager.subscribe's
// applicationServerKey wants raw bytes. Built via `new Uint8Array(length)`
// rather than `Uint8Array.from()` so it's backed by a concrete ArrayBuffer
// (not ArrayBufferLike) — the DOM lib's BufferSource type requires that.
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

export type PushPermissionState = "unsupported" | "default" | "denied" | "granted";

export function usePushSubscription() {
  const [permission, setPermission] = useState<PushPermissionState>("default");

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as PushPermissionState);
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return false;

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      console.error("NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set");
      return false;
    }

    const permissionResult = await Notification.requestPermission();
    setPermission(permissionResult as PushPermissionState);
    if (permissionResult !== "granted") return false;

    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      const json = subscription.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      return res.ok;
    } catch (error) {
      console.error("push subscribe failed:", error);
      return false;
    }
  }, []);

  return { permission, subscribe };
}
