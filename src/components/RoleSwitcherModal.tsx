import React from "react";
import {
  X,
  ShoppingBag,
  Palette,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Layers,
  BarChart3,
  UserCheck,
  Lock,
} from "lucide-react";
import {
  Language,
  TelegramUser,
  UserRole,
  ADMIN_TELEGRAM_USERNAME,
  isAuthorizedAdmin,
} from "../types";
import { translations } from "../translations";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: TelegramUser | null;
  onSwitchRole: (newRole: UserRole, navigateToWindow?: boolean) => void;
  onSwitchToPreset?: (presetUser: TelegramUser) => void;
  lang: Language;
}

export const RoleSwitcherModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onSwitchRole,
  onSwitchToPreset,
  lang,
}) => {
  const t = translations[lang];

  if (!isOpen) return null;

  const currentRole = currentUser?.role || "buyer";
  const canAccessAdmin = isAuthorizedAdmin(currentUser);

  const handleSelectRole = (role: UserRole, navigateToWindow = true) => {
    if (role === "admin" && !canAccessAdmin) {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred("error");
      }
      alert(
        lang === "ru"
          ? `Панель администратора доступна исключительно для Telegram-аккаунта @${ADMIN_TELEGRAM_USERNAME}. Все остальные пользователи могут работать только как Художник или Покупатель.`
          : `Admin HQ is strictly restricted to Telegram account @${ADMIN_TELEGRAM_USERNAME}. All other users can only operate as Artist or Buyer.`
      );
      return;
    }

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred("medium");
    }
    onSwitchRole(role, navigateToWindow);
    onClose();
  };

  const rolesConfig: Array<{
    role: UserRole;
    title: string;
    badge: string;
    subtitle: string;
    accentColor: string;
    btnClass: string;
    icon: React.ReactNode;
    features: string[];
    windowName: string;
  }> = [
    {
      role: "buyer",
      title: lang === "ru" ? "Коллекционер / Покупатель" : lang === "uz" ? "Xaridor / Kolleksioner" : "Collector / Buyer",
      badge: lang === "ru" ? "Витрина & AR" : lang === "uz" ? "Vitrina & AR" : "Gallery & AR",
      subtitle:
        lang === "ru"
          ? "Просмотр галереи, примерка картин на реальной стене через камеру AR, добавление в корзину и заказ."
          : lang === "uz"
          ? "Galereyani ko'rish, kamerada devorga AR sinovi, savatchaga qo'shish va xarid qilish."
          : "Browse original artworks, preview them live on your real room wall with camera AR, like, and order.",
      accentColor: "#1A1A1A",
      btnClass: "bg-[#1A1A1A] hover:bg-black text-white",
      icon: <ShoppingBag size={22} className="text-white" />,
      windowName: lang === "ru" ? "Перейти в Галерею" : lang === "uz" ? "Galereyaga o'tish" : "Go to Gallery",
      features: [
        lang === "ru" ? "Живая примерка картин на стене в AR" : "Live Camera AR Wall Staging",
        lang === "ru" ? "Избранное и корзина покупателя" : "Saved Favorites & Shopping Basket",
        lang === "ru" ? "Прямая связь с художниками в Telegram" : "Direct Telegram Artist Connection",
      ],
    },
    {
      role: "artist",
      title: lang === "ru" ? "Художник / Создатель" : lang === "uz" ? "Rassom / Muallif" : "Artist / Creator",
      badge: lang === "ru" ? "Студия & Аналитика" : lang === "uz" ? "Studiya & Tahlil" : "Studio & Analytics",
      subtitle:
        lang === "ru"
          ? "Загрузка до 7 авторских картин с размерами и стилем, 3D примерка на стенах, аналитика просмотров и лайков."
          : lang === "uz"
          ? "7 tagacha asarlarni yuklash, devorga AR sinovi, ko'rishlar va yoqtirishlar statistikasi."
          : "Upload up to 7 artworks with mediums, test on 3D wall environments, and track real-time analytics.",
      accentColor: "#6B7B62",
      btnClass: "bg-[#6B7B62] hover:bg-[#5a6852] text-white",
      icon: <Palette size={22} className="text-white" />,
      windowName: lang === "ru" ? "Перейти в Студию" : lang === "uz" ? "Studiyaga o'tish" : "Go to Artist Studio",
      features: [
        lang === "ru" ? "Загрузка и редактирование до 7 картин" : "Upload & Manage Up to 7 Artworks",
        lang === "ru" ? "Статистика просмотров, лайков и AR-примерок" : "Live Views, Likes & AR Staging Stats",
        lang === "ru" ? "Публичный профиль мастера в каталоге" : "Curated Creator Portfolio & Telegram Link",
      ],
    },
    {
      role: "admin",
      title: lang === "ru" ? "Администратор / Куратор" : lang === "uz" ? "Administrator / Kurator" : "Admin / Curator",
      badge: lang === "ru" ? "HQ Управление" : lang === "uz" ? "HQ Boshqaruv" : "HQ Operations",
      subtitle:
        lang === "ru"
          ? "Аналитика платформы, общая выручка GMV, управление каталогом авторов и картин."
          : lang === "uz"
          ? "Platforma tahlili, umumiy aylanma, rassomlar va asarlar katalogini boshqarish."
          : "High-level platform KPI analytics, gross catalog GMV, user directory, and marketplace moderation.",
      accentColor: "#2D3748",
      btnClass: "bg-[#2D3748] hover:bg-black text-white",
      icon: <ShieldCheck size={22} className="text-white" />,
      windowName: lang === "ru" ? "Перейти в Админку" : lang === "uz" ? "Boshqaruvga o'tish" : "Go to Admin HQ",
      features: [
        lang === "ru" ? "Финансовые и поведенческие метрики GMV" : "Platform KPI & Revenue Analytics",
        lang === "ru" ? "Реестр всех пользователей и авторов" : "User & Artist Directory Management",
        lang === "ru" ? "Контроль каталога и модерация работ" : "Artwork Catalog Audit & Quick Moderation",
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#F9F8F6] text-[#1A1A1A] w-full max-w-2xl rounded-3xl p-5 sm:p-7 shadow-2xl border border-white/80 relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 text-neutral-400 hover:text-black rounded-full hover:bg-neutral-200/70 transition-colors"
          title="Close modal"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="mb-6 pr-8">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6B7B62] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#6B7B62]">
              {lang === "ru" ? "Мгновенное переключение роли" : lang === "uz" ? "Rolni tezkor almashtirish" : "Instant Role Switcher"}
            </span>
          </div>
          <h2 className="font-serif-custom text-2xl sm:text-3xl font-light italic text-[#1A1A1A]">
            {t.switchRole}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 font-light mt-1">
            {lang === "ru"
              ? "Выберите роль для работы с платформой Art Wall. Каждая роль открывает соответствующее изолированное окно."
              : lang === "uz"
              ? "Art Wall platformasida ishlash uchun rolni tanlang. Har bir rol alohida oynani ochadi."
              : "Select an active role mode. Each role switches immediately to its dedicated environment."}
          </p>
        </div>

        {/* Roles List */}
        <div className="space-y-3.5 mb-6">
          {rolesConfig.map((cfg) => {
            const isActive = currentRole === cfg.role;
            const isAdminRole = cfg.role === "admin";
            const isLocked = isAdminRole && !canAccessAdmin;

            return (
              <div
                key={cfg.role}
                onClick={() => {
                  if (isLocked) {
                    if (window.Telegram?.WebApp?.HapticFeedback) {
                      window.Telegram.WebApp.HapticFeedback.notificationOccurred("warning");
                    }
                    alert(
                      lang === "ru"
                        ? `Доступ к панели администратора разрешен только Telegram-пользователю @${ADMIN_TELEGRAM_USERNAME}. Текущий аккаунт может быть только Художником или Покупателем.`
                        : `Access to the Admin account is restricted exclusively to Telegram user @${ADMIN_TELEGRAM_USERNAME}. Other accounts can only be either Artist or Buyer.`
                    );
                    return;
                  }
                  handleSelectRole(cfg.role, true);
                }}
                className={`p-4 sm:p-5 rounded-2xl border transition-all relative group ${
                  isLocked
                    ? "bg-neutral-50/90 border-neutral-200/80 cursor-pointer hover:border-neutral-300"
                    : isActive
                    ? "bg-white border-neutral-900 shadow-md ring-2 ring-neutral-900/10 cursor-pointer"
                    : "bg-white/80 border-neutral-200/90 hover:bg-white hover:border-neutral-400 hover:shadow-xs cursor-pointer"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                        isLocked ? "opacity-75" : ""
                      }`}
                      style={{ backgroundColor: isLocked ? "#718096" : cfg.accentColor }}
                    >
                      {isLocked ? <Lock size={20} className="text-white" /> : cfg.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-serif-custom text-base sm:text-lg font-medium text-[#1A1A1A]">
                          {cfg.title}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-white ${
                            isLocked ? "bg-neutral-600" : ""
                          }`}
                          style={!isLocked ? { backgroundColor: cfg.accentColor } : undefined}
                        >
                          {isLocked
                            ? `@${ADMIN_TELEGRAM_USERNAME}`
                            : cfg.badge}
                        </span>
                        {isActive && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 size={12} />
                            {lang === "ru" ? "Активна" : "Active"}
                          </span>
                        )}
                        {isLocked && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Lock size={11} />
                            {lang === "ru" ? "Только @muxammadsiddiq_23" : "Only @muxammadsiddiq_23"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-600 mt-0.5 font-light leading-relaxed">
                        {cfg.subtitle}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feature Pills */}
                <div className="flex items-center gap-2 flex-wrap mb-3 pl-0 sm:pl-14">
                  {cfg.features.map((feat, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] sm:text-[11px] px-2.5 py-1 rounded-lg bg-neutral-100/80 text-neutral-700 border border-neutral-200/60 font-medium"
                    >
                      • {feat}
                    </span>
                  ))}
                </div>

                {/* Notice for locked admin */}
                {isLocked && (
                  <div className="mb-3 px-3 py-2 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-900 flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-light">
                      {lang === "ru"
                        ? `Административный доступ заблокирован для текущего профиля (${currentUser?.username ? `@${currentUser.username}` : "пользователь"}). Доступ открыт исключительно для подтвержденного аккаунта @${ADMIN_TELEGRAM_USERNAME}.`
                        : `Admin access is restricted for current profile (${currentUser?.username ? `@${currentUser.username}` : "user"}). Accessible solely by verified Telegram account @${ADMIN_TELEGRAM_USERNAME}.`}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectRole(cfg.role, false);
                    }}
                    disabled={isLocked}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      isLocked
                        ? "text-neutral-400 cursor-not-allowed"
                        : "text-neutral-600 hover:text-black hover:bg-neutral-100"
                    }`}
                  >
                    {lang === "ru" ? "Остаться в профиле" : "Stay in Profile"}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectRole(cfg.role, true);
                    }}
                    disabled={isLocked}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs ${
                      isLocked
                        ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                        : cfg.btnClass
                    }`}
                  >
                    {isLocked ? (
                      <>
                        <Lock size={13} />
                        <span>{lang === "ru" ? "Заблокировано" : "Restricted"}</span>
                      </>
                    ) : (
                      <>
                        <span>{cfg.windowName}</span>
                        <ArrowRight size={13} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Demo Fast Login Presets */}
        <div className="p-4 rounded-2xl bg-[#E8E6E1]/50 border border-[#D6D2C4]/60">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
              <UserCheck size={14} />
              {lang === "ru" ? "Быстрый вход под проверенными аккаунтами:" : "Quick Verified Accounts:"}
            </span>
          </div>

          <div className={`grid grid-cols-1 ${canAccessAdmin ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-2`}>
            <button
              type="button"
              onClick={() => {
                if (onSwitchToPreset) {
                  onSwitchToPreset({
                    id: 201,
                    first_name: "Damir",
                    last_name: "Alimov",
                    username: "damir_collector",
                    photo_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
                    role: "buyer",
                    bio: "Curating tactile contemporary paintings for modern residential collections.",
                    location: "Tashkent, Uzbekistan",
                  });
                  onClose();
                } else {
                  handleSelectRole("buyer", true);
                }
              }}
              className="px-3 py-2 rounded-xl bg-white border border-neutral-200 text-left hover:border-black transition-all group"
            >
              <span className="text-xs font-bold text-neutral-800 block group-hover:text-black">
                Damir Alimov
              </span>
              <span className="text-[10px] text-neutral-500 block">
                🛍️ {lang === "ru" ? "Покупатель (Buyer)" : "Buyer / Collector"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onSwitchToPreset) {
                  onSwitchToPreset({
                    id: 101,
                    first_name: "Elena",
                    last_name: "Rostova",
                    username: "elena_art_studio",
                    photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
                    role: "artist",
                    bio: "Contemporary tactile abstractions, mixed media textures, and spatial minimalism.",
                    location: "Studio 4B, Tashkent",
                  });
                  onClose();
                } else {
                  handleSelectRole("artist", true);
                }
              }}
              className="px-3 py-2 rounded-xl bg-white border border-[#6B7B62]/40 text-left hover:border-[#6B7B62] transition-all group"
            >
              <span className="text-xs font-bold text-neutral-800 block group-hover:text-[#6B7B62]">
                Elena Rostova
              </span>
              <span className="text-[10px] text-[#6B7B62] block font-medium">
                🎨 {lang === "ru" ? "Художник (Artist)" : "Artist / 4 Artworks"}
              </span>
            </button>

            {canAccessAdmin && (
              <button
                type="button"
                onClick={() => {
                  if (onSwitchToPreset) {
                    onSwitchToPreset({
                      id: 999,
                      first_name: "Muxammadsiddiq",
                      last_name: "Admin",
                      username: ADMIN_TELEGRAM_USERNAME,
                      photo_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
                      role: "admin",
                      bio: "Founder, curation & platform analytics operations.",
                      location: "HQ Tashkent",
                    });
                    onClose();
                  } else {
                    handleSelectRole("admin", true);
                  }
                }}
                className="px-3 py-2 rounded-xl bg-white border border-[#2D3748]/40 text-left hover:border-[#2D3748] transition-all group ring-1 ring-[#2D3748]/10"
              >
                <span className="text-xs font-bold text-neutral-800 block group-hover:text-[#2D3748]">
                  Muxammadsiddiq
                </span>
                <span className="text-[10px] text-[#2D3748] block font-semibold">
                  🛡️ @{ADMIN_TELEGRAM_USERNAME} (Admin)
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
