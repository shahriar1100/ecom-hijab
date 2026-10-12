"use client";

import { useSyncExternalStore } from "react";

export type UserProfile = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  createdAt: string;
};

type StoredUserRecord = UserProfile & {
  password: string;
};

const SESSION_KEY = "noor:auth-user:v1";
const USERS_KEY = "noor:registered-users:v1";
const listeners = new Set<() => void>();

let cachedSessionRaw: string | null | undefined;
let cachedSessionUser: UserProfile | null = null;

function isValidUserProfile(value: unknown): value is UserProfile {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<UserProfile>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.phone === "string" &&
    typeof candidate.createdAt === "string"
  );
}

function readSessionUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (raw === cachedSessionRaw) return cachedSessionUser;
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    cachedSessionRaw = raw;
    cachedSessionUser = isValidUserProfile(parsed) ? parsed : null;
    return cachedSessionUser;
  } catch {
    return null;
  }
}

function writeSessionUser(user: UserProfile | null) {
  if (typeof window === "undefined") return;
  try {
    if (!user) {
      window.localStorage.removeItem(SESSION_KEY);
      cachedSessionRaw = null;
      cachedSessionUser = null;
    } else {
      const raw = JSON.stringify(user);
      window.localStorage.setItem(SESSION_KEY, raw);
      cachedSessionRaw = raw;
      cachedSessionUser = user;
    }
  } catch {
    // Storage writes can fail in restricted browsing modes.
  }
  listeners.forEach((listener) => listener());
}

function readRegisteredUsers(): StoredUserRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as StoredUserRecord[]) : [];
  } catch {
    return [];
  }
}

function writeRegisteredUsers(users: StoredUserRecord[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // Ignore storage write errors.
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (typeof window === "undefined") {
    return () => {
      listeners.delete(listener);
    };
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key === SESSION_KEY || event.key === USERS_KEY || event.key === null) {
      cachedSessionRaw = undefined;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function signupUser(input: {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  password: string;
}): { ok: true; user: UserProfile } | { ok: false; error: string } {
  const cleanName = input.name.trim();
  const cleanPhone = input.phone.trim();
  const cleanEmail = input.email?.trim().toLowerCase() || undefined;
  const cleanAddress = input.address?.trim() || undefined;
  const cleanCity = input.city?.trim() || undefined;

  if (!cleanName || !cleanPhone) {
    return { ok: false, error: "Please enter your full name and phone number." };
  }
  if (input.password.length < 4) {
    return { ok: false, error: "Password must be at least 4 characters long." };
  }

  const users = readRegisteredUsers();
  const existingIndex = users.findIndex(
    (u) => u.phone === cleanPhone || (cleanEmail && u.email?.toLowerCase() === cleanEmail),
  );

  const profile: UserProfile = {
    id: existingIndex >= 0 ? users[existingIndex].id : `USR-${Date.now().toString().slice(-6)}`,
    name: cleanName,
    phone: cleanPhone,
    email: cleanEmail,
    address: cleanAddress,
    city: cleanCity,
    createdAt: existingIndex >= 0 ? users[existingIndex].createdAt : new Date().toISOString(),
  };

  const record: StoredUserRecord = { ...profile, password: input.password };
  if (existingIndex >= 0) {
    users[existingIndex] = record;
  } else {
    users.unshift(record);
  }

  writeRegisteredUsers(users);
  writeSessionUser(profile);

  if (typeof window !== "undefined") {
    void fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "signup",
        id: profile.id,
        name: profile.name,
        phone: profile.phone,
        email: profile.email,
        address: profile.address,
        city: profile.city,
        password: input.password,
      }),
    }).catch(() => {
      // Offline fallback
    });
  }

  return { ok: true, user: profile };
}

export async function signupUserAsync(input: {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  password: string;
}): Promise<{ ok: true; user: UserProfile } | { ok: false; error: string }> {
  const localResult = signupUser(input);
  if (!localResult.ok) return localResult;

  try {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "signup",
        id: localResult.user.id,
        name: localResult.user.name,
        phone: localResult.user.phone,
        email: localResult.user.email,
        address: localResult.user.address,
        city: localResult.user.city,
        password: input.password,
      }),
    });
    const data = (await res.json()) as { ok?: boolean; user?: UserProfile };
    if (res.ok && data.ok && data.user) {
      writeSessionUser(data.user);
      return { ok: true, user: data.user };
    }
  } catch {
    // Keep local signup result
  }
  return localResult;
}

export function loginUser(input: {
  identifier: string;
  password: string;
}): { ok: true; user: UserProfile } | { ok: false; error: string } {
  const cleanId = input.identifier.trim().toLowerCase();
  if (!cleanId || !input.password) {
    return { ok: false, error: "Please enter your phone/email and password." };
  }

  const users = readRegisteredUsers();
  const match = users.find(
    (u) => u.phone.toLowerCase() === cleanId || (u.email && u.email.toLowerCase() === cleanId),
  );

  if (!match) {
    return {
      ok: false,
      error: "No account found with this phone or email. Please sign up first or continue as a guest.",
    };
  }
  if (match.password !== input.password) {
    return { ok: false, error: "Incorrect password. Please try again." };
  }

  const profile: UserProfile = {
    id: match.id,
    name: match.name,
    phone: match.phone,
    email: match.email,
    address: match.address,
    city: match.city,
    createdAt: match.createdAt,
  };
  writeSessionUser(profile);
  return { ok: true, user: profile };
}

export async function loginUserAsync(input: {
  identifier: string;
  password: string;
}): Promise<{ ok: true; user: UserProfile } | { ok: false; error: string }> {
  const cleanId = input.identifier.trim();
  if (!cleanId || !input.password) {
    return { ok: false, error: "Please enter your phone/email and password." };
  }

  try {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "login",
        identifier: cleanId,
        password: input.password,
      }),
    });
    const data = (await res.json()) as { ok?: boolean; user?: UserProfile; error?: string };
    if (res.ok && data.ok && data.user) {
      const users = readRegisteredUsers();
      const idx = users.findIndex((u) => u.id === data.user!.id || u.phone === data.user!.phone);
      const record: StoredUserRecord = { ...data.user, password: input.password };
      if (idx >= 0) {
        users[idx] = record;
      } else {
        users.unshift(record);
      }
      writeRegisteredUsers(users);
      writeSessionUser(data.user);
      return { ok: true, user: data.user };
    }
    // If server returned 401 and local storage has a matching user (e.g. created before server sync), check local fallback
    const localAttempt = loginUser(input);
    if (localAttempt.ok) {
      // Push local account to server so future logins work across devices
      void fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "signup",
          ...localAttempt.user,
          password: input.password,
        }),
      }).catch(() => {});
      return localAttempt;
    }
    return {
      ok: false,
      error: data.error || localAttempt.error,
    };
  } catch {
    return loginUser(input);
  }
}

export function updateUserProfile(updates: Partial<Omit<UserProfile, "id" | "createdAt">>): UserProfile | null {
  const current = readSessionUser();
  if (!current) return null;

  const updated: UserProfile = {
    ...current,
    name: updates.name !== undefined ? updates.name.trim() || current.name : current.name,
    phone: updates.phone !== undefined ? updates.phone.trim() || current.phone : current.phone,
    email: updates.email !== undefined ? updates.email.trim() || undefined : current.email,
    address: updates.address !== undefined ? updates.address.trim() || undefined : current.address,
    city: updates.city !== undefined ? updates.city.trim() || undefined : current.city,
  };

  const users = readRegisteredUsers();
  const idx = users.findIndex((u) => u.id === current.id);
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...updated };
    writeRegisteredUsers(users);
  }
  writeSessionUser(updated);

  if (typeof window !== "undefined") {
    void fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update-profile",
        id: updated.id,
        name: updated.name,
        phone: updated.phone,
        email: updated.email,
        address: updated.address,
        city: updated.city,
      }),
    }).catch(() => {});
  }

  return updated;
}

export async function changeUserPasswordAsync(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const current = readSessionUser();
  if (!current) {
    return { ok: false, error: "Please sign in first to change your password." };
  }
  if (!input.currentPassword || !input.newPassword) {
    return { ok: false, error: "Please enter both your current and new password." };
  }
  if (input.newPassword.length < 4) {
    return { ok: false, error: "New password must be at least 4 characters long." };
  }

  try {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "change-password",
        id: current.id,
        phone: current.phone,
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || "Could not update password." };
    }
  } catch {
    // Fallback to local update if offline
  }

  const users = readRegisteredUsers();
  const idx = users.findIndex((u) => u.id === current.id || u.phone === current.phone);
  if (idx >= 0) {
    users[idx] = { ...users[idx], password: input.newPassword };
    writeRegisteredUsers(users);
  }
  return { ok: true };
}

export function logoutUser() {
  writeSessionUser(null);
}

export function useAuth() {
  const user = useSyncExternalStore(
    subscribe,
    () => readSessionUser(),
    () => null,
  );
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return { user, ready };
}
