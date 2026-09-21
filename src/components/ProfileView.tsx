import React, { useState } from "react";
import {
  User,
  Heart,
  ShoppingBag,
  Box,
  MapPin,
  Send,
  ShieldCheck,
  Palette,
  Edit3,
  ExternalLink,
  Share2,
  ArrowLeft,
  Sparkles,
  Layers,
  Eye,
  Camera,
  Check,
  LogOut,
  X,
  Upload,
  BarChart3,
  Sliders,
  Lock,
} from "lucide-react";
import {
  TelegramUser,
  Artwork,
  CartItem,
  Language,
  UserRole,
  ADMIN_TELEGRAM_USERNAME,
  isAuthorizedAdmin,
  getRealTelegramUser,
} from "../types";
import { translations } from "../translations";
import { RoleSwitcherModal } from "./RoleSwitcherModal";

interface Props {
  currentUser: TelegramUser | null;
  targetUser: TelegramUser | null;
  artworks: Artwork[];
  cartItems: CartItem[];
  likedIds: Set<string>;
  basketIds: Set<string>;
  lang: Language;
  onSaveUser: (updatedUser: TelegramUser) => void;
  onSwitchRole: (role: UserRole) => void;
  onSelectArtwork: (artwork: Artwork) => void;
  onViewOnWall: (artwork: Artwork) => void;
  onAddToBasket: (artwork: Artwork) => void;
  onToggleLike: (artworkId: string) => void;
  onOpenBasketDrawer: () => void;
  onOpenAuth: () => void;
  onBackToPrevious?: () => void;
  onShareArtwork: (artwork: Artwork) => void;
  onOpenStudio?: () => void;
}

export const ProfileView: React.FC<Props> = ({
  currentUser,
  targetUser,
  artworks,
  cartItems,
  likedIds,
  basketIds,
  lang,
  onSaveUser,
  onSwitchRole,
  onSelectArtwork,
  onViewOnWall,
  onAddToBasket,
  onToggleLike,
  onOpenBasketDrawer,
  onOpenAuth,
  onBackToPrevious,
  onShareArtwork,
  onOpenStudio,
}) => {
  const t = translations[lang];

  // Active user to display: targetUser if viewing someone else, or currentUser (fallback to guest)
  const isViewingSelf = !targetUser || (currentUser && targetUser.id === currentUser.id);
  const displayUser: TelegramUser = targetUser || currentUser || {
    id: 1001,
    first_name: "Art",
    last_name: "Collector",
    username: "art_collector",
    photo_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
    role: "buyer",
    bio: "Passionate collector exploring original tactile contemporary artworks with real-wall AR visualization.",
    location: "Tashkent / Studio Central",
  };

  const canAccessAdmin = isAuthorizedAdmin(currentUser);
  const userRole =
    displayUser.role === "admin" && !isAuthorizedAdmin(displayUser)
      ? "buyer"
      : displayUser.role || "buyer";

  // Tab state within profile
  const [activeTab, setActiveTab] = useState<"favorites" | "basket" | "artworks" | "settings">(
    userRole === "artist" ? "artworks" : "favorites"
  );

  // Edit profile dialog
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
  const [editFirstName, setEditFirstName] = useState(displayUser.first_name);
  const [editLastName, setEditLastName] = useState(displayUser.last_name || "");
  const [editUsername, setEditUsername] = useState(displayUser.username || "");
  const [editBio, setEditBio] = useState(displayUser.bio || "");
  const [editLocation, setEditLocation] = useState(displayUser.location || "");
  const [editPhotoUrl, setEditPhotoUrl] = useState(displayUser.photo_url || "");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const realTg = getRealTelegramUser();
    let cleanUsername = editUsername.replace("@", "").trim();

    if (realTg?.username) {
      cleanUsername = realTg.username;
    } else if (!canAccessAdmin && cleanUsername.toLowerCase() === ADMIN_TELEGRAM_USERNAME.toLowerCase()) {
      alert(
        lang === "ru"
          ? `Имя пользователя @${ADMIN_TELEGRAM_USERNAME} зарезервировано исключительно для аккаунта администратора.`
          : `Username @${ADMIN_TELEGRAM_USERNAME} is reserved exclusively for the administrator account.`
      );
      cleanUsername = displayUser.username || "collector";
    }

    let finalRole = displayUser.role;

    if (finalRole === "admin" && (!canAccessAdmin || cleanUsername.toLowerCase() !== ADMIN_TELEGRAM_USERNAME.toLowerCase())) {
      alert(
        lang === "ru"
          ? `Аккаунт администратора доступен исключительно для @${ADMIN_TELEGRAM_USERNAME}. Роль переключена на покупателя.`
          : `Admin account is strictly restricted to @${ADMIN_TELEGRAM_USERNAME}. Role switched to buyer.`
      );
      finalRole = "buyer";
    }

    const updated: TelegramUser = {
      ...displayUser,
      first_name: editFirstName.trim() || displayUser.first_name,
      last_name: editLastName.trim() || undefined,
      username: cleanUsername || displayUser.username,
      role: finalRole,
      bio: editBio.trim() || displayUser.bio,
      location: editLocation.trim() || displayUser.location,
      photo_url: editPhotoUrl.trim() || displayUser.photo_url,
    };
    onSaveUser(updated);
    setIsEditingProfile(false);
    showToast(lang === "ru" ? "Профиль успешно обновлён" : lang === "uz" ? "Profil yangilandi" : "Profile updated successfully");
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
    }
  };

  // Filter artworks created by this artist
  const artistArtworks = artworks.filter((a) => {
    if (displayUser.id && String(a.artistId) === String(displayUser.id)) return true;
    if (displayUser.username && a.artistUsername && a.artistUsername.toLowerCase() === displayUser.username.toLowerCase()) return true;
    const fullName = `${displayUser.first_name}${displayUser.last_name ? ` ${displayUser.last_name}` : ""}`.trim().toLowerCase();
    if (a.artistName && a.artistName.toLowerCase() === fullName) return true;
    if (
      (displayUser.username === "elena_art_studio" || displayUser.first_name.toLowerCase().includes("elena")) &&
      (a.artistId === "artist-1" || a.artistUsername === "elena_art_studio")
    ) {
      return true;
    }
    return false;
  });

  // Filter saved/liked artworks
  const savedArtworks = artworks.filter((a) => likedIds.has(a.id));

  // Compute artist statistics
  const totalArtistViews = artistArtworks.reduce((sum, a) => sum + (a.viewsCount || 0), 0);
  const totalArtistLikes = artistArtworks.reduce((sum, a) => sum + (a.likesCount || 0), 0);
  const totalArtistArTries = artistArtworks.reduce((sum, a) => sum + (a.arTriesCount || 0), 0);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-in fade-in duration-300">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-18 right-4 z-50 bg-[#1A1A1A] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <Check size={15} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Back to previous view button if viewing an external artist */}
      {!isViewingSelf && onBackToPrevious && (
        <div className="mb-4">
          <button
            onClick={() => {
              onBackToPrevious();
              window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-neutral-200 text-neutral-700 hover:text-neutral-950 text-xs font-bold uppercase tracking-wider hover:bg-neutral-50 transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft size={14} />
            <span>{lang === "ru" ? "Назад в маркетплейс" : lang === "uz" ? "Marketpleysga qaytish" : "Back to Marketplace"}</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          PROFILE BANNER & IDENTITY CARD
         ========================================================================= */}
      <div className="bg-white rounded-3xl border border-[#E8E6E1] overflow-hidden shadow-sm mb-7">
        {/* Architectural subtle top decorative bar */}
        <div className="h-28 sm:h-36 bg-gradient-to-r from-[#24292E] via-[#3E4349] to-[#1E2328] relative p-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border border-white/20">
              <Sparkles size={11} className="text-amber-300" />
              {userRole === "artist"
                ? "Verified Artist Profile"
                : userRole === "admin"
                ? "ArtWall HQ Admin"
                : "Art Collector Profile"}
            </span>
          </div>

          {/* Telegram link button */}
          {displayUser.username && (
            <a
              href={`https://t.me/${displayUser.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-[#2AABEE]/90 hover:bg-[#2AABEE] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Open Telegram Profile"
            >
              <Send size={13} />
              <span>@{displayUser.username}</span>
              <ExternalLink size={12} className="opacity-75" />
            </a>
          )}
        </div>

        {/* User details row */}
        <div className="px-5 sm:px-8 pb-6 sm:pb-8 pt-0 -mt-12 sm:-mt-14 relative flex flex-col md:flex-row md:items-end justify-between gap-5">
          {/* Avatar and Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-5">
            <div className="relative group">
              <img
                src={displayUser.photo_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"}
                alt={displayUser.first_name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover ring-4 ring-white shadow-xl bg-[#F4F2EE]"
              />
              <div
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#2AABEE] text-white flex items-center justify-center ring-2 ring-white shadow-sm"
                title="Verified via Telegram"
              >
                <ShieldCheck size={16} />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="font-serif-custom text-2xl sm:text-3xl font-normal tracking-tight text-[#1A1A1A]">
                  {displayUser.first_name} {displayUser.last_name || ""}
                </h1>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    userRole === "artist"
                      ? "bg-[#6B7B62]/15 text-[#6B7B62] border border-[#6B7B62]/30"
                      : userRole === "admin"
                      ? "bg-neutral-900 text-white"
                      : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}
                >
                  {userRole === "artist" ? t.artistRole : userRole === "admin" ? t.adminRole : t.buyerRole}
                </span>

                {/* 1-tap quick role switcher pills when viewing own profile */}
                {isViewingSelf && (
                  <div className="flex items-center bg-neutral-200/70 p-0.5 rounded-xl border border-neutral-300/60 ml-1">
                    <button
                      type="button"
                      onClick={() => {
                        onSwitchRole("buyer");
                        showToast(lang === "ru" ? "Роль: Коллекционер" : "Switched to Collector");
                        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        userRole === "buyer"
                          ? "bg-[#1A1A1A] text-white shadow-xs"
                          : "text-neutral-600 hover:text-neutral-900"
                      }`}
                      title="Switch to Buyer / Collector"
                    >
                      <ShoppingBag size={11} />
                      <span className="hidden xs:inline">Collector</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onSwitchRole("artist");
                        showToast(lang === "ru" ? "Роль: Художник" : "Switched to Artist");
                        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        userRole === "artist"
                          ? "bg-[#6B7B62] text-white shadow-xs"
                          : "text-neutral-600 hover:text-neutral-900"
                      }`}
                      title="Switch to Artist Studio"
                    >
                      <Palette size={11} />
                      <span className="hidden xs:inline">Artist</span>
                    </button>

                    {canAccessAdmin ? (
                      <button
                        type="button"
                        onClick={() => {
                          onSwitchRole("admin");
                          showToast(lang === "ru" ? "Роль: Администратор" : "Switched to Admin");
                          window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          userRole === "admin"
                            ? "bg-[#2D3748] text-white shadow-xs"
                            : "text-neutral-600 hover:text-neutral-900"
                        }`}
                        title="Switch to Admin HQ"
                      >
                        <ShieldCheck size={11} />
                        <span className="hidden xs:inline">Admin</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.("warning");
                          alert(
                            lang === "ru"
                              ? `Панель администратора доступна исключительно пользователю @${ADMIN_TELEGRAM_USERNAME}. Все остальные аккаунты могут быть только покупателем или художником.`
                              : `Admin account is strictly restricted to @${ADMIN_TELEGRAM_USERNAME}. All other accounts can only be buyer or artist.`
                          );
                        }}
                        className="px-2 py-1 rounded-lg text-[10px] font-medium transition-all flex items-center gap-1 text-neutral-400 hover:text-amber-800 hover:bg-amber-50 cursor-pointer"
                        title={`Admin restricted to @${ADMIN_TELEGRAM_USERNAME}`}
                      >
                        <Lock size={10} className="text-amber-600" />
                        <span className="hidden xs:inline line-through">Admin</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {displayUser.location && (
                <p className="text-xs text-neutral-500 flex items-center gap-1.5 mb-2 font-medium">
                  <MapPin size={13} className="text-neutral-400" />
                  <span>{displayUser.location}</span>
                </p>
              )}

              {displayUser.bio && (
                <p className="text-xs sm:text-sm text-neutral-600 max-w-xl font-light leading-relaxed">
                  "{displayUser.bio}"
                </p>
              )}
            </div>
          </div>

          {/* Action buttons on profile */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0 flex-wrap">
            {isViewingSelf ? (
              <>
                <button
                  onClick={() => {
                    setEditFirstName(displayUser.first_name);
                    setEditLastName(displayUser.last_name || "");
                    setEditUsername(displayUser.username || "");
                    setEditBio(displayUser.bio || "");
                    setEditLocation(displayUser.location || "");
                    setEditPhotoUrl(displayUser.photo_url || "");
                    setIsEditingProfile(true);
                    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
                  }}
                  className="flex-1 sm:flex-none min-h-[44px] px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Edit3 size={14} />
                  <span>{lang === "ru" ? "Редактировать" : lang === "uz" ? "Tahrirlash" : "Edit Profile"}</span>
                </button>

                <button
                  onClick={() => {
                    setIsRoleSwitcherOpen(true);
                    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
                  }}
                  className="flex-1 sm:flex-none min-h-[44px] px-4 py-2.5 rounded-xl bg-[#1A1A1A] hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Sliders size={14} />
                  <span>{t.switchRole}</span>
                </button>
              </>
            ) : (
              <>
                {displayUser.username && (
                  <a
                    href={`https://t.me/${displayUser.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none min-h-[44px] px-4 py-2.5 rounded-xl bg-[#2AABEE] hover:bg-[#229ED9] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    <Send size={14} />
                    <span>{lang === "ru" ? "Написать в Telegram" : lang === "uz" ? "Telegramda yozish" : "Message on Telegram"}</span>
                  </a>
                )}
                <button
                  onClick={() => {
                    const shareText = `Check out artist ${displayUser.first_name} on Art Wall AR: https://t.me/${displayUser.username || "artwall"}`;
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(shareText);
                      showToast(lang === "ru" ? "Ссылка на профиль скопирована" : "Profile link copied");
                    }
                  }}
                  className="min-h-[44px] p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-all cursor-pointer"
                  title="Share Artist Profile"
                >
                  <Share2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick Highlights / Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-[#E8E6E1] bg-[#FDFCFB]">
          {userRole === "artist" ? (
            <>
              <div className="p-4 border-r border-[#E8E6E1] text-center">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block mb-1">
                  {lang === "ru" ? "Картин в галерее" : lang === "uz" ? "Asarlar soni" : "Artworks"}
                </span>
                <span className="text-xl sm:text-2xl font-mono font-bold text-[#1A1A1A]">
                  {artistArtworks.length} / 7
                </span>
              </div>
              <div className="p-4 border-r border-[#E8E6E1] text-center">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block mb-1">
                  {lang === "ru" ? "Просмотров" : lang === "uz" ? "Ko'rishlar" : "Total Views"}
                </span>
                <span className="text-xl sm:text-2xl font-mono font-bold text-[#1A1A1A]">
                  {totalArtistViews}
                </span>
              </div>
              <div className="p-4 border-r border-[#E8E6E1] text-center">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block mb-1">
                  {lang === "ru" ? "Лайков" : lang === "uz" ? "Layklar" : "Likes"}
                </span>
                <span className="text-xl sm:text-2xl font-mono font-bold text-rose-500">
                  {totalArtistLikes}
                </span>
              </div>
              <div className="p-4 text-center">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block mb-1">
                  {lang === "ru" ? "AR-примерок" : lang === "uz" ? "AR sinovlar" : "AR Staging"}
                </span>
                <span className="text-xl sm:text-2xl font-mono font-bold text-[#6B7B62]">
                  {totalArtistArTries}
                </span>
              </div>
            </>
          ) : userRole === "admin" ? (
            <>
              <div className="p-4 border-r border-[#E8E6E1] text-center">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block mb-1">
                  Admin Level
                </span>
                <span className="text-lg font-mono font-bold text-[#1A1A1A]">
                  Founder
                </span>
              </div>
              <div className="p-4 border-r border-[#E8E6E1] text-center">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block mb-1">
                  Catalog Size
                </span>
                <span className="text-xl font-mono font-bold text-[#1A1A1A]">
                  {artworks.length} Arts
                </span>
              </div>
              <div className="p-4 border-r border-[#E8E6E1] text-center">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block mb-1">
                  Favorites Saved
                </span>
                <span className="text-xl font-mono font-bold text-rose-500">
                  {savedArtworks.length}
                </span>
              </div>
              <div className="p-4 text-center">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block mb-1">
                  Status
                </span>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center justify-center gap-1 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Platform
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 border-r border-[#E8E6E1] text-center">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block mb-1">
                  {lang === "ru" ? "В избранном" : lang === "uz" ? "Saqlangan" : "Saved Art"}
                </span>
                <span className="text-xl sm:text-2xl font-mono font-bold text-rose-500">
                  {savedArtworks.length}
                </span>
              </div>
              <div className="p-4 border-r border-[#E8E6E1] text-center">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block mb-1">
                  {lang === "ru" ? "В корзине" : lang === "uz" ? "Savatda" : "In Basket"}
                </span>
                <span className="text-xl sm:text-2xl font-mono font-bold text-[#6B7B62]">
                  {cartItems.length}
                </span>
              </div>
              <div className="p-4 border-r border-[#E8E6E1] text-center">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block mb-1">
                  {lang === "ru" ? "Каталог" : lang === "uz" ? "Katalog" : "Catalog"}
                </span>
                <span className="text-xl sm:text-2xl font-mono font-bold text-[#1A1A1A]">
                  {artworks.length}
                </span>
              </div>
              <div className="p-4 text-center">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block mb-1">
                  Telegram
                </span>
                <span className="text-xs font-mono font-bold text-[#2AABEE] mt-1 block truncate">
                  @{displayUser.username || "collector"}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* =========================================================================
          PROFILE SECTION TABS
         ========================================================================= */}
      <div className="flex items-center gap-2 border-b border-[#E8E6E1] pb-3 mb-6 overflow-x-auto scrollbar-none">
        {userRole === "artist" ? (
          <>
            <button
              onClick={() => setActiveTab("artworks")}
              className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === "artworks"
                  ? "bg-[#1A1A1A] text-white shadow-xs"
                  : "bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200"
              }`}
            >
              <Palette size={14} />
              <span>{lang === "ru" ? "Портфолио работ" : lang === "uz" ? "Asarlar to'plami" : "Artworks Portfolio"} ({artistArtworks.length})</span>
            </button>

            {isViewingSelf && (
              <button
                onClick={() => setActiveTab("favorites")}
                className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === "favorites"
                    ? "bg-[#1A1A1A] text-white shadow-xs"
                    : "bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200"
                }`}
              >
                <Heart size={14} />
                <span>{lang === "ru" ? "Избранное" : lang === "uz" ? "Saqlanganlar" : "My Saved Art"} ({savedArtworks.length})</span>
              </button>
            )}

            {isViewingSelf && (
              <button
                onClick={() => setActiveTab("settings")}
                className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === "settings"
                    ? "bg-[#1A1A1A] text-white shadow-xs"
                    : "bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200"
                }`}
              >
                <Sliders size={14} />
                <span>{lang === "ru" ? "Настройки и роль" : lang === "uz" ? "Sozlamalar" : "Account Settings"}</span>
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab("favorites")}
              className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === "favorites"
                  ? "bg-[#1A1A1A] text-white shadow-xs"
                  : "bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200"
              }`}
            >
              <Heart size={14} />
              <span>{lang === "ru" ? "Избранные картины" : lang === "uz" ? "Saqlangan asarlar" : "Saved Artworks"} ({savedArtworks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("basket")}
              className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === "basket"
                  ? "bg-[#1A1A1A] text-white shadow-xs"
                  : "bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200"
              }`}
            >
              <ShoppingBag size={14} />
              <span>{lang === "ru" ? "Корзина" : lang === "uz" ? "Savat" : "My Basket"} ({cartItems.length})</span>
            </button>

            {isViewingSelf && (
              <button
                onClick={() => setActiveTab("settings")}
                className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === "settings"
                    ? "bg-[#1A1A1A] text-white shadow-xs"
                    : "bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200"
                }`}
              >
                <Sliders size={14} />
                <span>{lang === "ru" ? "Настройки и роль" : lang === "uz" ? "Sozlamalar" : "Account & Role"}</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* =========================================================================
          TAB CONTENT: 1. ARTIST PORTFOLIO
         ========================================================================= */}
      {activeTab === "artworks" && (
        <div>
          {artistArtworks.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-neutral-200 max-w-md mx-auto shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-3 text-neutral-400">
                <Palette size={24} />
              </div>
              <h3 className="text-base font-bold text-neutral-800 mb-1">
                {lang === "ru" ? "Нет загруженных картин" : "No artworks uploaded yet"}
              </h3>
              <p className="text-xs text-neutral-500 font-light mb-5">
                {isViewingSelf
                  ? (lang === "ru" ? "Загрузите свою первую картину через Студию автора." : "Upload your first artwork to showcase in 3D AR wall staging.")
                  : (lang === "ru" ? "Этот художник еще не опубликовал работы." : "This artist has not published artworks yet.")}
              </p>
              {isViewingSelf && onOpenStudio && (
                <button
                  onClick={onOpenStudio}
                  className="py-2.5 px-5 rounded-xl bg-[#6B7B62] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 hover:bg-[#586650] transition-colors"
                >
                  <Upload size={14} />
                  <span>{lang === "ru" ? "Открыть студию" : "Open Artist Studio"}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {artistArtworks.map((art) => {
                const isLiked = likedIds.has(art.id);
                const isInBasket = basketIds.has(art.id);

                return (
                  <div
                    key={art.id}
                    className="bg-white rounded-3xl overflow-hidden border border-[#E8E6E1] hover:border-neutral-300 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Thumbnail */}
                      <div
                        onClick={() => onSelectArtwork(art)}
                        className="relative bg-[#F4F2EE] aspect-[4/5] overflow-hidden cursor-pointer"
                      >
                        <img
                          src={art.imageUrl}
                          alt={art.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded-full">
                          {art.category}
                        </div>
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleLike(art.id);
                              window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
                            }}
                            className={`w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
                              isLiked
                                ? "bg-rose-500 text-white"
                                : "bg-white/90 text-neutral-700 hover:text-rose-500"
                            }`}
                          >
                            <Heart size={15} fill={isLiked ? "currentColor" : "none"} />
                          </button>
                        </div>
                      </div>

                      {/* Info & Metrics */}
                      <div className="p-4 sm:p-5">
                        <h4
                          onClick={() => onSelectArtwork(art)}
                          className="font-serif-custom text-lg font-light italic text-[#1A1A1A] truncate cursor-pointer hover:underline"
                        >
                          {art.title}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-neutral-500 mt-1 mb-3">
                          <span className="font-mono">{art.width}×{art.height} cm</span>
                          <span className="font-mono font-bold text-neutral-900">{art.price.toLocaleString()} UZS</span>
                        </div>

                        {/* Staging stats badge */}
                        <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-neutral-50 border border-neutral-100 text-[11px] font-mono text-neutral-600 mb-3">
                          <span className="flex items-center gap-1"><Eye size={12} /> {art.viewsCount || 0}</span>
                          <span className="flex items-center gap-1 text-rose-500"><Heart size={12} /> {art.likesCount}</span>
                          <span className="flex items-center gap-1 text-[#6B7B62] font-semibold"><Camera size={12} /> {art.arTriesCount || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="p-4 pt-0 flex items-center gap-2">
                      <button
                        onClick={() => {
                          onViewOnWall(art);
                          window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("medium");
                        }}
                        className="flex-1 min-h-[38px] py-2 px-3 rounded-xl bg-[#1A1A1A] hover:bg-black text-white text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Box size={13} />
                        <span>{t.viewOnWall}</span>
                      </button>

                      <button
                        onClick={() => {
                          onAddToBasket(art);
                          window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
                        }}
                        className={`min-h-[38px] px-3 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          isInBasket
                            ? "bg-[#6B7B62] text-white"
                            : "bg-neutral-100 hover:bg-neutral-200 text-neutral-800"
                        }`}
                        title={isInBasket ? t.inBasket : t.addToBasket}
                      >
                        {isInBasket ? <Check size={14} /> : <ShoppingBag size={14} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB CONTENT: 2. SAVED / LIKED ARTWORKS
         ========================================================================= */}
      {activeTab === "favorites" && (
        <div>
          {savedArtworks.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-neutral-200 max-w-md mx-auto shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
                <Heart size={24} />
              </div>
              <h3 className="text-base font-bold text-neutral-800 mb-1">
                {lang === "ru" ? "У вас пока нет сохранённых картин" : "No saved artworks yet"}
              </h3>
              <p className="text-xs text-neutral-500 font-light mb-5">
                {lang === "ru"
                  ? "Нажмите на сердечко у любой картины в каталоге, чтобы сохранить её в свою коллекцию."
                  : "Tap the heart icon on any artwork in the marketplace to save it here for quick staging and purchase."}
              </p>
              {onBackToPrevious && (
                <button
                  onClick={onBackToPrevious}
                  className="py-2.5 px-5 rounded-xl bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 hover:bg-black transition-colors"
                >
                  <Layers size={14} />
                  <span>{lang === "ru" ? "Смотреть каталог" : "Browse Marketplace"}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {savedArtworks.map((art) => {
                const isInBasket = basketIds.has(art.id);

                return (
                  <div
                    key={art.id}
                    className="bg-white rounded-3xl overflow-hidden border border-[#E8E6E1] hover:border-neutral-300 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Thumbnail */}
                      <div
                        onClick={() => onSelectArtwork(art)}
                        className="relative bg-[#F4F2EE] aspect-[4/5] overflow-hidden cursor-pointer"
                      >
                        <img
                          src={art.imageUrl}
                          alt={art.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded-full">
                          {art.category}
                        </div>
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleLike(art.id);
                              window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
                            }}
                            className="w-9 h-9 rounded-full bg-rose-500 text-white backdrop-blur-md flex items-center justify-center transition-all shadow-md"
                            title="Remove from favorites"
                          >
                            <Heart size={15} fill="currentColor" />
                          </button>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-4 sm:p-5">
                        <div className="flex items-center gap-2 mb-1 text-xs text-neutral-500">
                          <img
                            src={art.artistAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
                            alt={art.artistName}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span className="truncate">{art.artistName}</span>
                        </div>

                        <h4
                          onClick={() => onSelectArtwork(art)}
                          className="font-serif-custom text-lg font-light italic text-[#1A1A1A] truncate cursor-pointer hover:underline"
                        >
                          {art.title}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-neutral-500 mt-1 mb-2">
                          <span className="font-mono">{art.width}×{art.height} cm</span>
                          <span className="font-mono font-bold text-neutral-900">{art.price.toLocaleString()} UZS</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="p-4 pt-0 flex items-center gap-2">
                      <button
                        onClick={() => {
                          onViewOnWall(art);
                          window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("medium");
                        }}
                        className="flex-1 min-h-[38px] py-2 px-3 rounded-xl bg-[#1A1A1A] hover:bg-black text-white text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Box size={13} />
                        <span>{t.viewOnWall}</span>
                      </button>

                      <button
                        onClick={() => {
                          onAddToBasket(art);
                          window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
                        }}
                        className={`min-h-[38px] px-3 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          isInBasket
                            ? "bg-[#6B7B62] text-white"
                            : "bg-neutral-100 hover:bg-neutral-200 text-neutral-800"
                        }`}
                        title={isInBasket ? t.inBasket : t.addToBasket}
                      >
                        {isInBasket ? <Check size={14} /> : <ShoppingBag size={14} />}
                      </button>

                      <button
                        onClick={() => onShareArtwork(art)}
                        className="min-h-[38px] p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
                        title="Share"
                      >
                        <Share2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB CONTENT: 3. MY BASKET & CART SUMMARY
         ========================================================================= */}
      {activeTab === "basket" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E6E1] shadow-xs max-w-2xl mx-auto">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-6">
            <div>
              <h3 className="font-serif-custom text-xl font-light italic text-[#1A1A1A]">
                {lang === "ru" ? "Ваша корзина" : "Your Art Basket"}
              </h3>
              <p className="text-xs text-neutral-500">
                {cartItems.length} {lang === "ru" ? "предметов готово к заказу" : "items staged & ready"}
              </p>
            </div>
            <button
              onClick={onOpenBasketDrawer}
              className="py-2 px-3.5 rounded-xl bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-black transition-colors"
            >
              <ShoppingBag size={14} />
              <span>{lang === "ru" ? "Открыть оформление" : "Checkout Drawer"}</span>
            </button>
          </div>

          {cartItems.length === 0 ? (
            <div className="py-8 text-center text-neutral-400">
              <ShoppingBag size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold text-neutral-700 mb-1">
                {lang === "ru" ? "Корзина пуста" : "Basket is empty"}
              </p>
              <p className="text-[11px] text-neutral-400">
                {lang === "ru" ? "Добавьте картины из каталога или примерки на стене." : "Add pieces from the marketplace or while previewing in 3D Wall AR."}
              </p>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {cartItems.map((item) => (
                <div
                  key={item.artwork.id}
                  className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/70 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.artwork.imageUrl}
                      alt={item.artwork.title}
                      className="w-12 h-14 rounded-xl object-cover ring-1 ring-neutral-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="font-serif-custom text-sm font-bold text-[#1A1A1A] block truncate">
                        {item.artwork.title}
                      </span>
                      <span className="text-[11px] text-neutral-500 font-mono block">
                        {item.selectedWidth || item.artwork.width}×{item.selectedHeight || item.artwork.height} cm • Frame: {item.frameMaterial}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono font-bold text-sm text-neutral-900">
                      {item.artwork.price.toLocaleString()} UZS
                    </span>
                    <button
                      onClick={() => onViewOnWall(item.artwork)}
                      className="p-2 rounded-xl bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 transition-colors"
                      title="Test in 3D AR"
                    >
                      <Box size={14} />
                    </button>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-neutral-200 flex items-center justify-between text-sm">
                <span className="font-bold text-neutral-700">
                  {lang === "ru" ? "Итого:" : "Subtotal:"}
                </span>
                <span className="font-mono font-bold text-xl text-neutral-900">
                  {cartItems.reduce((sum, i) => sum + i.artwork.price, 0).toLocaleString()} UZS
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB CONTENT: 4. ACCOUNT SETTINGS & ROLE SWITCHER
         ========================================================================= */}
      {activeTab === "settings" && isViewingSelf && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E6E1] shadow-xs max-w-2xl mx-auto space-y-6">
          <div>
            <h3 className="font-serif-custom text-xl font-light italic text-[#1A1A1A] mb-1">
              {lang === "ru" ? "Управление аккаунтом" : "Account & Role Settings"}
            </h3>
            <p className="text-xs text-neutral-500">
              Configure your display name, creator studio bio, and toggle between role modes.
            </p>
          </div>

          {/* Quick Role Selection Cards */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-2">
              {lang === "ru" ? "Текущая роль в Art Wall" : "Active Role Mode"}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onSwitchRole("buyer");
                  showToast(lang === "ru" ? "Переключено на роль Коллекционера" : "Switched to Collector role");
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  userRole === "buyer"
                    ? "bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-md"
                    : "bg-neutral-50 text-neutral-800 border-neutral-200 hover:bg-neutral-100"
                }`}
              >
                <ShoppingBag size={18} className="mb-2" />
                <span className="text-xs font-bold block">{t.buyerRole}</span>
                <span className="text-[10px] opacity-75 font-light block mt-0.5">
                  Browse, stage in AR, like & buy
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSwitchRole("artist");
                  showToast(lang === "ru" ? "Переключено на роль Художника" : "Switched to Artist role");
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  userRole === "artist"
                    ? "bg-[#6B7B62] text-white border-[#6B7B62] shadow-md"
                    : "bg-neutral-50 text-neutral-800 border-neutral-200 hover:bg-neutral-100"
                }`}
              >
                <Palette size={18} className="mb-2" />
                <span className="text-xs font-bold block">{t.artistRole}</span>
                <span className="text-[10px] opacity-75 font-light block mt-0.5">
                  Upload up to 7 artworks & track analytics
                </span>
              </button>

              {canAccessAdmin ? (
                <button
                  type="button"
                  onClick={() => {
                    onSwitchRole("admin");
                    showToast(lang === "ru" ? "Переключено на роль Администратора" : "Switched to Admin role");
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    userRole === "admin"
                      ? "bg-[#2D3748] text-white border-[#2D3748] shadow-md"
                      : "bg-neutral-50 text-neutral-800 border-neutral-200 hover:bg-neutral-100"
                  }`}
                >
                  <ShieldCheck size={18} className="mb-2" />
                  <span className="text-xs font-bold block">{t.adminRole}</span>
                  <span className="text-[10px] opacity-75 font-light block mt-0.5">
                    KPI overview & platform controls
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.("warning");
                    alert(
                      lang === "ru"
                        ? `Панель администратора доступна исключительно пользователю @${ADMIN_TELEGRAM_USERNAME}. Все остальные аккаунты могут быть только покупателем или художником.`
                        : `Admin account is strictly restricted to @${ADMIN_TELEGRAM_USERNAME}. All other accounts can only be buyer or artist.`
                    );
                  }}
                  className="p-3.5 rounded-2xl border border-neutral-200 text-left transition-all bg-neutral-100/70 text-neutral-400 cursor-pointer hover:bg-amber-50/50 hover:border-amber-300"
                >
                  <div className="flex items-center justify-between mb-2">
                    <ShieldCheck size={18} className="text-neutral-400" />
                    <Lock size={14} className="text-amber-700" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold block line-through">{t.adminRole}</span>
                    <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 px-1 py-0.2 rounded font-mono font-bold">
                      @{ADMIN_TELEGRAM_USERNAME}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-light block mt-0.5">
                    {lang === "ru" ? "Доступно только главному куратору" : "Restricted to founder curator"}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Edit Profile Trigger */}
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-neutral-800 block">
                {lang === "ru" ? "Редактировать личные данные" : "Personal Information"}
              </span>
              <span className="text-[11px] text-neutral-500 block">
                Update avatar, name, studio location, and statement bio.
              </span>
            </div>
            <button
              onClick={() => {
                setEditFirstName(displayUser.first_name);
                setEditLastName(displayUser.last_name || "");
                setEditUsername(displayUser.username || "");
                setEditBio(displayUser.bio || "");
                setEditLocation(displayUser.location || "");
                setEditPhotoUrl(displayUser.photo_url || "");
                setIsEditingProfile(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-800 text-xs font-bold hover:bg-neutral-100 transition-colors"
            >
              {lang === "ru" ? "Изменить" : "Edit Details"}
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          EDIT PROFILE MODAL
         ========================================================================= */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#F9F8F6] text-[#1A1A1A] w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/80 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEditingProfile(false)}
              className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-neutral-800 rounded-full hover:bg-neutral-200/60 transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-serif-custom italic font-normal tracking-tight text-[#1A1A1A] mb-1">
              {lang === "ru" ? "Редактирование профиля" : lang === "uz" ? "Profilni tahrirlash" : "Edit Profile Details"}
            </h2>
            <p className="text-xs text-neutral-500 mb-6">
              Update your public Telegram handle, studio location, and biographical statement.
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">
                    {lang === "ru" ? "Имя *" : "First Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-200 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#6B7B62]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">
                    {lang === "ru" ? "Фамилия" : "Last Name"}
                  </label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-200 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#6B7B62]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Telegram Username
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">@</span>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="username"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-white border border-neutral-200 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#6B7B62]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  value={editPhotoUrl}
                  onChange={(e) => setEditPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-200 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#6B7B62]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  {lang === "ru" ? "Студия / Город" : "Studio Location"}
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="Tashkent / Studio Central"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-200 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#6B7B62]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  {lang === "ru" ? "О себе / Биография" : "Bio / Statement"}
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-200 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#6B7B62]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#1A1A1A] hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                >
                  {t.saveProfile}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Instant Role Switcher Modal */}
      <RoleSwitcherModal
        isOpen={isRoleSwitcherOpen}
        onClose={() => setIsRoleSwitcherOpen(false)}
        currentUser={displayUser}
        onSwitchRole={(newRole, navigate) => {
          onSwitchRole(newRole);
          showToast(
            newRole === "artist"
              ? (lang === "ru" ? "Переключено на окно Художника" : "Switched to Artist Window")
              : newRole === "admin"
              ? (lang === "ru" ? "Переключено на окно Администратора" : "Switched to Admin Window")
              : (lang === "ru" ? "Переключено на окно Коллекционера" : "Switched to Collector Window")
          );
        }}
        onSwitchToPreset={(preset) => {
          onSaveUser(preset);
          onSwitchRole(preset.role);
          showToast(
            lang === "ru"
              ? `Вход выполнен: ${preset.first_name}`
              : `Logged in as ${preset.first_name}`
          );
        }}
        lang={lang}
      />
    </div>
  );
};
