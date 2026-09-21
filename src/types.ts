export type Language = "en" | "ru" | "uz";

export type UserRole = "buyer" | "artist" | "admin";

export const MAX_ARTIST_UPLOADS = 7;

// Only this Telegram username is permitted to access the admin role
export const ADMIN_TELEGRAM_USERNAME = "muxammadsiddiq_23";

export function isAuthorizedAdmin(userOrUsername?: string | { username?: string; role?: UserRole } | null): boolean {
  if (!userOrUsername) return false;
  const username = typeof userOrUsername === "string"
    ? userOrUsername
    : userOrUsername.username || "";
  const normalized = username.replace(/^@/, "").trim().toLowerCase();
  return normalized === ADMIN_TELEGRAM_USERNAME.toLowerCase();
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  role: UserRole;
  bio?: string;
  location?: string;
  createdAt?: string;
}

export interface Artwork {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  artistUsername?: string;
  artistAvatar?: string;
  imageUrl: string;
  price: number; // in USD
  currency?: string;
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
