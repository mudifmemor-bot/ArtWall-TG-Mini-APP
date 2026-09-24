import { TelegramUser, Artwork } from "../types";

/**
 * Fetch all registered users from the persistent server storage
 */
export async function fetchRegisteredUsers(): Promise<TelegramUser[]> {
  try {
    const res = await fetch("/api/users");
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    const data: TelegramUser[] = await res.json();
    return data;
  } catch (err) {
    console.warn("Could not fetch users from server, falling back to local storage:", err);
    try {
      const saved = localStorage.getItem("artwall_users_directory");
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  }
}

/**
 * Save or update a registered user to the persistent server storage
 */
export async function registerOrUpdateUser(user: TelegramUser): Promise<TelegramUser> {
  try {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    if (!res.ok) {
      throw new Error(`Failed to save user: ${res.status}`);
    }
    const data = await res.json();
    return data.user || user;
  } catch (err) {
    console.error("Error saving user to server API:", err);
    return user;
  }
}

/**
 * Batch update users (e.g. from Google Sheet pull)
 */
export async function batchSaveUsers(users: TelegramUser[]): Promise<TelegramUser[]> {
  try {
    const res = await fetch("/api/users/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ users }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.users || users;
    }
  } catch (err) {
    console.error("Batch save error:", err);
  }
  return users;
}

/**
 * Fetch community artworks from persistent server storage
 */
export async function fetchServerArtworks(): Promise<Artwork[]> {
  try {
    const res = await fetch("/api/artworks");
    if (!res.ok) throw new Error(`Artworks API error: ${res.status}`);
    const data: Artwork[] = await res.json();
    return data;
  } catch (err) {
    console.warn("Could not fetch server artworks:", err);
    return [];
  }
}

/**
 * Save new artwork created by an artist
 */
export async function saveServerArtwork(artwork: Artwork): Promise<boolean> {
  try {
    const res = await fetch("/api/artworks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(artwork),
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to save artwork to server:", err);
    return false;
  }
}

/**
 * Delete artwork from server
 */
export async function deleteServerArtwork(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/artworks/${id}`, { method: "DELETE" });
    return res.ok;
  } catch (err) {
    console.error("Failed to delete artwork:", err);
    return false;
  }
}
