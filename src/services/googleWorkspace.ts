import { TelegramUser, GoogleDriveFile, GoogleWorkspaceState } from "../types";

export const GOOGLE_CLIENT_ID =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) ||
  "403275370796-bphaihaics3di457f97ilg0mepb5c00n.apps.googleusercontent.com";

export const GOOGLE_SCOPES =
  "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email";

interface StoredTokenData {
  token: string;
  expiresAt: number;
  email?: string;
  name?: string;
  picture?: string;
}

const TOKEN_KEY = "artwall_google_token";
const SPREADSHEET_ID_KEY = "artwall_google_spreadsheet_id";
const DRIVE_FOLDER_ID_KEY = "artwall_google_drive_folder_id";

/**
 * Retrieves valid unexpired token from local cache
 */
export function getStoredGoogleToken(): string | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const data: StoredTokenData = JSON.parse(raw);
    // Buffer of 60 seconds
    if (Date.now() < data.expiresAt - 60000) {
      return data.token;
    }
  } catch (e) {
    console.warn("Failed to read stored Google token", e);
  }
  return null;
}

/**
 * Gets cached workspace state for UI display
 */
export function getStoredWorkspaceState(): GoogleWorkspaceState {
  try {
    const rawToken = localStorage.getItem(TOKEN_KEY);
    const tokenData: StoredTokenData | null = rawToken ? JSON.parse(rawToken) : null;
    const isTokenValid = Boolean(tokenData && Date.now() < tokenData.expiresAt - 60000);
    const spreadsheetId = localStorage.getItem(SPREADSHEET_ID_KEY) || undefined;
    const driveFolderId = localStorage.getItem(DRIVE_FOLDER_ID_KEY) || undefined;
    const lastSyncedAt = localStorage.getItem("artwall_google_last_sync") || undefined;

    return {
      isConnected: isTokenValid,
      userEmail: tokenData?.email,
      userName: tokenData?.name,
      userPicture: tokenData?.picture,
      spreadsheetId,
      spreadsheetUrl: spreadsheetId ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` : undefined,
      lastSyncedAt,
      driveFolderId,
    };
  } catch (e) {
    return { isConnected: false };
  }
}

/**
 * Requests Google OAuth Access Token via Google Identity Services client popup
 */
export function requestGoogleAccessToken(prompt?: "consent" | "select_account"): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.google?.accounts?.oauth2) {
      return reject(
        new Error("Google Identity Services library is not loaded. Please ensure your internet connection allows accounts.google.com.")
      );
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GOOGLE_SCOPES,
        callback: async (response) => {
          if (response.error) {
            return reject(new Error(response.error.message || response.error));
          }
          if (!response.access_token) {
            return reject(new Error("No access token returned from Google."));
          }

          const token = response.access_token;
          const expiresIn = response.expires_in ? Number(response.expires_in) : 3500;
          const expiresAt = Date.now() + expiresIn * 1000;

          // Fetch user profile info
          let email: string | undefined;
          let name: string | undefined;
          let picture: string | undefined;

          try {
            const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (profileRes.ok) {
              const profile = await profileRes.json();
              email = profile.email;
              name = profile.name;
              picture = profile.picture;
            }
          } catch (err) {
            console.warn("Could not fetch Google profile:", err);
          }

          const tokenData: StoredTokenData = {
            token,
            expiresAt,
            email,
            name,
            picture,
          };
          localStorage.setItem(TOKEN_KEY, JSON.stringify(tokenData));
          resolve(token);
        },
        error_callback: (err) => {
          reject(err);
        },
      });

      client.requestAccessToken({ prompt: prompt || "" });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Helper to ensure an active access token is available
 */
export async function ensureGoogleToken(): Promise<string> {
  const existing = getStoredGoogleToken();
  if (existing) return existing;
  return requestGoogleAccessToken();
}

/**
 * Disconnect Google integration
 */
export function disconnectGoogle(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SPREADSHEET_ID_KEY);
  localStorage.removeItem(DRIVE_FOLDER_ID_KEY);
  localStorage.removeItem("artwall_google_last_sync");
}

// ----------------------------------------------------
// GOOGLE SHEETS INTEGRATION
// ----------------------------------------------------

/**
 * Creates or syncs the full platform user list into a Google Spreadsheet
 */
export async function syncUsersToGoogleSheet(
  users: TelegramUser[],
  existingSpreadsheetId?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; updatedCount: number }> {
  const token = await ensureGoogleToken();
  let spreadsheetId = existingSpreadsheetId || localStorage.getItem(SPREADSHEET_ID_KEY) || undefined;

  // Verify existing spreadsheet exists and is accessible
  if (spreadsheetId) {
    try {
      const checkRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!checkRes.ok) {
        spreadsheetId = undefined;
      }
    } catch {
      spreadsheetId = undefined;
    }
  }

  // Create a new spreadsheet if none exists or accessible
  if (!spreadsheetId) {
    const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          title: "Art Wall AR - User Directory & Collectors",
        },
        sheets: [
          {
            properties: {
              title: "Users",
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
        ],
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      throw new Error(err?.error?.message || "Failed to create Google Spreadsheet");
    }

    const createData = await createRes.json();
    spreadsheetId = createData.spreadsheetId;
    localStorage.setItem(SPREADSHEET_ID_KEY, spreadsheetId!);
  }

  // Prepare user records with professional columns
  const headerRow = [
    "User ID",
    "First Name",
    "Last Name",
    "Telegram Username",
    "Platform Role",
    "Location",
    "Bio / Description",
    "Joined Date",
    "Last Synced (UTC)",
  ];

  const syncTimestamp = new Date().toISOString();
  const dataRows = users.map((u) => [
    u.id,
    u.first_name || "",
    u.last_name || "",
    u.username ? `@${u.username}` : "",
    (u.role || "buyer").toUpperCase(),
    u.location || "Tashkent, Uzbekistan",
    u.bio || "",
    u.createdAt || "2026",
    syncTimestamp,
  ]);

  const allRows = [headerRow, ...dataRows];

  // Overwrite the Users tab
  const range = `Users!A1:I${allRows.length}`;
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: allRows,
      }),
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.json();
    throw new Error(err?.error?.message || "Failed to update Google Sheet rows");
  }

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  localStorage.setItem(SPREADSHEET_ID_KEY, spreadsheetId!);
  localStorage.setItem("artwall_google_last_sync", syncTimestamp);

  return {
    spreadsheetId: spreadsheetId!,
    spreadsheetUrl,
    updatedCount: users.length,
  };
}

/**
 * Reads user list back from Google Sheet
 */
export async function fetchUsersFromGoogleSheet(spreadsheetId: string): Promise<TelegramUser[]> {
  const token = await ensureGoogleToken();
  const range = "Users!A2:I1000";
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || "Failed to fetch rows from Google Sheet");
  }

  const data = await res.json();
  const rows: any[][] = data.values || [];

  return rows.map((row, idx) => ({
    id: Number(row[0]) || 200 + idx,
    first_name: row[1] || "User",
    last_name: row[2] || "",
    username: (row[3] || "").replace(/^@/, "").trim(),
    role: (row[4] || "buyer").toLowerCase() as any,
    location: row[5] || "",
    bio: row[6] || "",
    createdAt: row[7] || new Date().toISOString(),
  }));
}

// ----------------------------------------------------
// GOOGLE DRIVE INTEGRATION (STORAGE)
// ----------------------------------------------------

/**
 * Finds or creates the dedicated platform storage folder in user's Google Drive
 */
export async function ensureDriveFolder(folderName = "Art Wall AR Storage"): Promise<string> {
  const token = await ensureGoogleToken();
  const cachedFolderId = localStorage.getItem(DRIVE_FOLDER_ID_KEY);

  if (cachedFolderId) {
    try {
      const checkRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${cachedFolderId}?fields=id,trashed`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (checkRes.ok) {
        const file = await checkRes.json();
        if (!file.trashed) return cachedFolderId;
      }
    } catch {
      // folder might have been deleted, recreate
    }
  }

  // Search by name
  const query = encodeURIComponent(`name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      const id = searchData.files[0].id;
      localStorage.setItem(DRIVE_FOLDER_ID_KEY, id);
      return id;
    }
  }

  // Create folder
  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err?.error?.message || "Failed to create Google Drive folder");
  }

  const created = await createRes.json();
  localStorage.setItem(DRIVE_FOLDER_ID_KEY, created.id);
  return created.id;
}

/**
 * Uploads a file/blob to the Google Drive storage folder
 */
export async function uploadFileToDrive(
  fileOrBlob: Blob | File,
  fileName: string,
  mimeType = "image/png"
): Promise<GoogleDriveFile> {
  const token = await ensureGoogleToken();
  const folderId = await ensureDriveFolder();

  // Create multipart payload
  const boundary = "-------314159265358979323846";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName,
    mimeType,
    parents: [folderId],
  };

  // Convert blob to array buffer
  const fileBuffer = await fileOrBlob.arrayBuffer();

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
    metadata
  )}`;
  const mediaPartHeader = `${delimiter}Content-Type: ${mimeType}\r\n\r\n`;

  const encoder = new TextEncoder();
  const part1 = encoder.encode(metadataPart + mediaPartHeader);
  const part2 = new Uint8Array(fileBuffer);
  const part3 = encoder.encode(closeDelimiter);

  const combinedBody = new Uint8Array(part1.byteLength + part2.byteLength + part3.byteLength);
  combinedBody.set(part1, 0);
  combinedBody.set(part2, part1.byteLength);
  combinedBody.set(part3, part1.byteLength + part2.byteLength);

  const uploadRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,thumbnailLink,size,createdTime",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: combinedBody,
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.json();
    throw new Error(err?.error?.message || "Failed to upload file to Google Drive");
  }

  const uploadedFile: GoogleDriveFile = await uploadRes.json();
  return uploadedFile;
}

/**
 * Lists recently stored files from the Art Wall AR Storage folder
 */
export async function listDriveStorageFiles(): Promise<GoogleDriveFile[]> {
  const token = await ensureGoogleToken();
  const folderId = await ensureDriveFolder();

  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime desc&pageSize=30&fields=files(id,name,mimeType,webViewLink,thumbnailLink,size,createdTime)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || "Failed to list Google Drive files");
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Deletes a file from Google Drive
 */
export async function deleteDriveStorageFile(fileId: string): Promise<void> {
  const token = await ensureGoogleToken();
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 404) {
    const err = await res.json();
    throw new Error(err?.error?.message || "Failed to delete Google Drive file");
  }
}

/**
 * Utility to convert data URL (Base64) to Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(";base64,");
  const contentType = parts[0].split(":")[1] || "image/png";
  const byteCharacters = atob(parts[1]);
  const byteArrays: Uint8Array[] = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }

  return new Blob(byteArrays, { type: contentType });
}
