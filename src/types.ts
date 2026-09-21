export type Language = "en" | "ru" | "uz";

export type UserRole = "buyer" | "artist";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  role: UserRole;
  bio?: string;
  location?: string;
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
  isAvailable: boolean;
  featured?: boolean;
  defaultFrameColor?: string;
  defaultFrameMaterial?: "solid" | "wood" | "metal" | "pattern";
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
