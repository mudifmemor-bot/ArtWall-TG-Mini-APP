export type Language = "en" | "ru" | "uz";

export type UserRole = "buyer" | "artist" | "admin";

export const MAX_ARTIST_UPLOADS = 7;

// Only this real Telegram username is permitted to access the admin role
export const ADMIN_TELEGRAM_USERNAME = "muxammadsiddiq_23";

export interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: any; expires_in?: number }) => void;
            error_callback?: (err: any) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
        };
      };
    };
    Telegram?: {
      WebApp?: {
        initData?: string;
        initDataUnsafe?: {
          user?: TelegramWebAppUser;
          auth_date?: number;
          hash?: string;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        disableVerticalSwipes?: () => void;
        enableVerticalSwipes?: () => void;
        HapticFeedback?: {
          impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
          notificationOccurred: (type: "error" | "success" | "warning") => void;
          selectionChanged: () => void;
        };
        BackButton?: {
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
        };
        openTelegramLink?: (url: string) => void;
        openLink?: (url: string) => void;
        requestContact?: (callback: (shared: boolean, result?: { response?: string; status?: string; auth_date?: number }) => void) => void;
      };
    };
  }
}

export function getRealTelegramUser(): TelegramWebAppUser | null {
  if (typeof window !== "undefined" && window.Telegram?.WebApp?.initDataUnsafe?.user) {
    return window.Telegram.WebApp.initDataUnsafe.user;
  }
  return null;
}

export function isRealTelegramAdmin(): boolean {
  const realTg = getRealTelegramUser();
  if (realTg?.username) {
    const realUsername = realTg.username.replace(/^@/, "").trim().toLowerCase();
    return realUsername === ADMIN_TELEGRAM_USERNAME.toLowerCase();
  }
  return false;
}

export function isAuthorizedAdmin(userOrUsername?: string | { username?: string; role?: UserRole; id?: number } | null): boolean {
  if (!userOrUsername) {
    const realTg = getRealTelegramUser();
    if (realTg?.username) {
      return realTg.username.replace(/^@/, "").trim().toLowerCase() === ADMIN_TELEGRAM_USERNAME.toLowerCase();
    }
    return false;
  }

  const username = typeof userOrUsername === "string"
    ? userOrUsername
    : userOrUsername.username || "";
  const normalized = username.replace(/^@/, "").trim().toLowerCase();
  if (normalized === ADMIN_TELEGRAM_USERNAME.toLowerCase()) {
    return true;
  }

  const realTg = getRealTelegramUser();
  if (realTg?.username) {
    return realTg.username.replace(/^@/, "").trim().toLowerCase() === ADMIN_TELEGRAM_USERNAME.toLowerCase();
  }

  return false;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  phone_number?: string;
  photo_url?: string;
  role: UserRole;
  bio?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function formatUZS(price: number): string {
  return `${Number(price || 0).toLocaleString()} UZS`;
}

export interface Artwork {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  artistUsername?: string;
  artistAvatar?: string;
  imageUrl: string;
  price: number; // in UZS (Uzbekistan Som)
  currency?: "UZS";
  width: number; // in cm
  height: number; // in cm
  medium: string;
  year?: number;
  description: string;
  category: "modern" | "abstract" | "landscape" | "minimalist" | "portrait" | "classic";
  likesCount: number;
  viewsCount?: number;
  arTriesCount?: number;
  inBasketCount?: number;
  isAvailable: boolean;
  featured?: boolean;
  defaultFrameColor?: string;
  defaultFrameMaterial?: "solid" | "wood" | "metal" | "pattern";
  createdAt?: string;
}

export interface CartItem {
  artwork: Artwork;
  frameColor: string;
  frameMaterial: "solid" | "wood" | "metal" | "pattern";
  frameThickness: number;
  mattingThickness: number;
  selectedWidth: number;
  selectedHeight: number;
}

export interface RoomPreset {
  id: string;
  labelKey: string;
  src: string;
}

export interface PlatformStats {
  totalArtists: number;
  totalBuyers: number;
  totalArtworks: number;
  totalViews: number;
  totalLikes: number;
  totalInBasket: number;
  totalArTries: number;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  thumbnailLink?: string;
  size?: string;
  createdTime?: string;
}

export interface GoogleWorkspaceState {
  isConnected: boolean;
  userEmail?: string;
  userName?: string;
  userPicture?: string;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  lastSyncedAt?: string;
  driveFolderId?: string;
  driveFilesCount?: number;
}
