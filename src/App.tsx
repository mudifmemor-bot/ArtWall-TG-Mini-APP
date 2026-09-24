import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Marketplace } from "./components/Marketplace";
import { WallVisualizer } from "./components/WallVisualizer";
import { ArtistStudio } from "./components/ArtistStudio";
import { BasketDrawer } from "./components/BasketDrawer";
import { TelegramAuthModal } from "./components/TelegramAuthModal";
import { OnboardingModal } from "./components/OnboardingModal";
import { AdminDashboard } from "./components/AdminDashboard";
import { ArtworkDetailModal } from "./components/ArtworkDetailModal";
import { ShareModal } from "./components/ShareModal";
import { ProfileView } from "./components/ProfileView";
import { RoleSwitcherModal } from "./components/RoleSwitcherModal";
import {
  Artwork,
  CartItem,
  Language,
  TelegramUser,
  UserRole,
  ADMIN_TELEGRAM_USERNAME,
  isAuthorizedAdmin,
} from "./types";
import { initialArtworks } from "./data/mockArtworks";
import {
  fetchRegisteredUsers,
  registerOrUpdateUser,
  batchSaveUsers,
  fetchServerArtworks,
  saveServerArtwork,
  deleteServerArtwork,
} from "./services/api";
import { autoSyncUsersToGoogleSheetIfConnected } from "./services/googleWorkspace";

const isMockUser = (u: any): boolean => {
  if (!u) return false;
  return (
    u.id === 101 ||
    u.id === 102 ||
    u.id === 103 ||
    u.id === 201 ||
    u.id === 202 ||
    u.id === 203 ||
    u.username === "elena_art_studio" ||
    u.username === "aziz_samarkand_art" ||
    u.username === "voronin_m_art" ||
    u.username === "rustam_collector" ||
    u.username === "daria_artlover" ||
    u.username === "farrukh_interior"
  );
};

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("artwall_lang");
    return (saved as Language) || "en";
  });

  const [currentTab, setCurrentTab] = useState<"gallery" | "visualizer" | "studio" | "basket" | "admin" | "profile">("gallery");
  const [targetProfileUser, setTargetProfileUser] = useState<TelegramUser | null>(null);
  const [previousTabBeforeProfile, setPreviousTabBeforeProfile] = useState<"gallery" | "visualizer" | "studio" | "admin">("gallery");

  // Onboarding startup state: strictly force sign up for everyone unless they have a verified real Telegram account with phone number
  const [hasOnboarded, setHasOnboarded] = useState<boolean>(() => {
    try {
      const savedUser = localStorage.getItem("artwall_user");
      if (!savedUser) return false;
      const parsed = JSON.parse(savedUser);
      if (isMockUser(parsed) || !parsed.phone_number) {
        localStorage.removeItem("artwall_user");
        localStorage.removeItem("artwall_onboarded");
        return false;
      }
      return localStorage.getItem("artwall_onboarded") === "true";
    } catch {
      return false;
    }
  });

  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    try {
      const savedUser = localStorage.getItem("artwall_user");
      if (!savedUser) return true;
      const parsed = JSON.parse(savedUser);
      if (isMockUser(parsed) || !parsed.phone_number) {
        return true;
      }
      return localStorage.getItem("artwall_onboarded") !== "true";
    } catch {
      return true;
    }
  });

  // Artworks state (with localStorage persistence)
  const [artworks, setArtworks] = useState<Artwork[]>(() => {
    try {
      const saved = localStorage.getItem("artwall_artworks");
      if (saved) {
        const parsed: Artwork[] = JSON.parse(saved);
        return parsed.map((a) => ({
          ...a,
          // Migrate legacy USD prices (< 50,000) to authentic UZS amounts
          price: a.price < 50000 ? Math.round((a.price * 12500) / 100000) * 100000 : a.price,
          currency: "UZS" as const,
        }));
      }
    } catch (e) {
      console.error(e);
    }
    return initialArtworks;
  });

  // Users Directory state for Admin - strictly real Telegram users only
  const [usersDirectory, setUsersDirectory] = useState<TelegramUser[]>(() => {
    try {
      const saved = localStorage.getItem("artwall_users_directory");
      if (saved) {
        const parsed: TelegramUser[] = JSON.parse(saved);
        return parsed.filter((u) => !isMockUser(u));
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("artwall_artworks", JSON.stringify(artworks));
  }, [artworks]);

  useEffect(() => {
    localStorage.setItem("artwall_lang", lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("artwall_users_directory", JSON.stringify(usersDirectory));
  }, [usersDirectory]);

  // Live Server Data Synchronization: Fetch real registered users and community artworks
  useEffect(() => {
    let isMounted = true;

    const syncWithServer = async () => {
      try {
        const [serverUsers, serverArtworks] = await Promise.all([
          fetchRegisteredUsers(),
          fetchServerArtworks(),
        ]);

        if (!isMounted) return;

        if (Array.isArray(serverUsers)) {
          // Strictly take the real registered users from the server (filter any mock users)
          const realUsers = serverUsers.filter((u) => !isMockUser(u));
          setUsersDirectory(realUsers);
          localStorage.setItem("artwall_users_directory", JSON.stringify(realUsers));
        }

        if (serverArtworks && serverArtworks.length > 0) {
          setArtworks((prev) => {
            const existingIds = new Set(prev.map((a) => a.id));
            const newWorks = serverArtworks.filter((a) => !existingIds.has(a.id));
            if (newWorks.length === 0) return prev;
            return [...newWorks, ...prev];
          });
        }
      } catch (err) {
        console.warn("Background server sync skipped:", err);
      }
    };

    // Initial sync
    syncWithServer();

    // Poll every 8 seconds for live updates from other devices / users
    const timer = setInterval(syncWithServer, 8000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  // Current Telegram User Authentication & Profile
  // CRITICAL CONSTRAINT: Only @muxammadsiddiq_23 is accessible for admin account;
  // all other accounts can only be either artist or buyer.
  const [user, setUser] = useState<TelegramUser | null>(() => {
    try {
      const saved = localStorage.getItem("artwall_user");
      if (saved) {
        const parsed: TelegramUser = JSON.parse(saved);
        if (isMockUser(parsed)) {
          localStorage.removeItem("artwall_user");
          localStorage.removeItem("artwall_onboarded");
          return null;
        }
        if (parsed.role === "admin" && !isAuthorizedAdmin(parsed)) {
          parsed.role = "buyer";
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  // Strict route protection: redirect away from admin if user is not authorized
  useEffect(() => {
    if (currentTab === "admin" && !isAuthorizedAdmin(user)) {
      setCurrentTab("gallery");
    }
  }, [currentTab, user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("artwall_user", JSON.stringify(user));
    }
  }, [user]);

  // Liked Artworks
  const [likedIds, setLikedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("artwall_liked");
      if (saved) return new Set(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
    return new Set(["art-1", "art-2"]);
  });

  const handleToggleLike = (id: string) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      const isNowLiked = !next.has(id);
      if (isNowLiked) next.add(id);
      else next.delete(id);

      localStorage.setItem("artwall_liked", JSON.stringify(Array.from(next)));

      // Update count in artwork list
      setArtworks((arts) =>
        arts.map((a) =>
          a.id === id
            ? { ...a, likesCount: isNowLiked ? a.likesCount + 1 : Math.max(0, a.likesCount - 1) }
            : a
        )
      );

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred("light");
      }

      return next;
    });
  };

  // Cart / Basket
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("artwall_cart");
      if (saved) {
        const parsed: CartItem[] = JSON.parse(saved);
        return parsed.map((item) => ({
          ...item,
          artwork: {
            ...item.artwork,
            price:
              item.artwork.price < 50000
                ? Math.round((item.artwork.price * 12500) / 100000) * 100000
                : item.artwork.price,
            currency: "UZS" as const,
          },
        }));
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("artwall_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const basketIds = new Set(cartItems.map((c) => c.artwork.id));

  const handleAddToBasket = (
    artwork: Artwork,
    customConfig?: {
      frameColor: string;
      frameMaterial: any;
      frameThickness: number;
      mattingThickness: number;
      selectedWidth: number;
      selectedHeight: number;
    }
  ) => {
    setCartItems((prev) => {
      const exists = prev.find((i) => i.artwork.id === artwork.id);
      if (exists) {
        // Remove if already in basket
        setArtworks((arts) =>
          arts.map((a) =>
            a.id === artwork.id
              ? { ...a, inBasketCount: Math.max(0, (a.inBasketCount || 0) - 1) }
              : a
          )
        );
        return prev.filter((i) => i.artwork.id !== artwork.id);
      } else {
        const newItem: CartItem = {
          artwork,
          frameColor: customConfig?.frameColor || artwork.defaultFrameColor || "#000000",
          frameMaterial: customConfig?.frameMaterial || artwork.defaultFrameMaterial || "solid",
          frameThickness: customConfig?.frameThickness || 2,
          mattingThickness: customConfig?.mattingThickness || 0,
          selectedWidth: customConfig?.selectedWidth || artwork.width,
          selectedHeight: customConfig?.selectedHeight || artwork.height,
        };

        // Increment inBasketCount in analytics
        setArtworks((arts) =>
          arts.map((a) =>
            a.id === artwork.id
              ? { ...a, inBasketCount: (a.inBasketCount || 0) + 1 }
              : a
          )
        );

        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
        }

        return [...prev, newItem];
      }
    });
  };

  const handleRemoveFromBasket = (artworkId: string) => {
    setCartItems((prev) => prev.filter((i) => i.artwork.id !== artworkId));
    setArtworks((arts) =>
      arts.map((a) =>
        a.id === artworkId
          ? { ...a, inBasketCount: Math.max(0, (a.inBasketCount || 0) - 1) }
          : a
      )
    );
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred("medium");
    }
  };

  // Analytics Tracker: View Count
  const handleTrackView = (artworkId: string) => {
    setArtworks((arts) =>
      arts.map((a) =>
        a.id === artworkId ? { ...a, viewsCount: (a.viewsCount || 0) + 1 } : a
      )
    );
  };

  // Analytics Tracker: AR Try Count
  const handleTrackArTry = (artworkId: string) => {
    setArtworks((arts) =>
      arts.map((a) =>
        a.id === artworkId ? { ...a, arTriesCount: (a.arTriesCount || 0) + 1 } : a
      )
    );
  };

  // Active artwork for 3D Wall view
  const [selectedWallArtwork, setSelectedWallArtwork] = useState<Artwork | null>(
    artworks[0]
  );
  const [initialRoomId, setInitialRoomId] = useState<string | undefined>(undefined);

  // Modals
  const [detailModalArtwork, setDetailModalArtwork] = useState<Artwork | null>(null);
  const [shareModalArtwork, setShareModalArtwork] = useState<Artwork | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isBasketDrawerOpen, setIsBasketDrawerOpen] = useState(false);
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);

  // Telegram WebApp Setup
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      tg.setHeaderColor("#F9F8F6");
      if (typeof tg.disableVerticalSwipes === "function") {
        tg.disableVerticalSwipes();
      }

      // Auto-extract user from Telegram WebApp if available
      if (tg.initDataUnsafe?.user && !user) {
        const tgUser = tg.initDataUnsafe.user;
        const isMuxammadSiddiq = Boolean(
          tgUser.username &&
          tgUser.username.replace(/^@/, "").trim().toLowerCase() === ADMIN_TELEGRAM_USERNAME.toLowerCase()
        );
        const extractedUser: TelegramUser = {
          id: tgUser.id,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name,
          username: tgUser.username,
          photo_url: tgUser.photo_url,
          role: isMuxammadSiddiq ? "admin" : "buyer",
          location: "Telegram",
        };
        setUser(extractedUser);
        if (isMuxammadSiddiq) {
          setCurrentTab("admin");
        }
      }

      // BackButton support
      if (tg.BackButton) {
        if (currentTab !== "gallery") {
          tg.BackButton.show();
          tg.BackButton.onClick(() => {
            if (currentTab === "profile" && targetProfileUser) {
              setTargetProfileUser(null);
              setCurrentTab(previousTabBeforeProfile || "gallery");
            } else {
              setCurrentTab("gallery");
            }
          });
        } else {
          tg.BackButton.hide();
        }
      }
    }
  }, [currentTab, user]);

  const handleCompleteOnboarding = async (newUser: TelegramUser) => {
    const isMuxammadSiddiq = Boolean(
      (newUser.username && newUser.username.replace(/^@/, "").trim().toLowerCase() === ADMIN_TELEGRAM_USERNAME.toLowerCase()) ||
      isAuthorizedAdmin(newUser)
    );
    const sanitizedUser: TelegramUser = {
      ...newUser,
      role: newUser.role === "admin" && !isMuxammadSiddiq ? "buyer" : newUser.role,
      createdAt: newUser.createdAt || new Date().toISOString(),
    };
    setUser(sanitizedUser);
    setHasOnboarded(true);
    setIsOnboardingOpen(false);
    localStorage.setItem("artwall_onboarded", "true");
    localStorage.setItem("artwall_user", JSON.stringify(sanitizedUser));

    // 1. Immediately persist to server so all devices & admin see the user!
    registerOrUpdateUser(sanitizedUser).catch((err) =>
      console.warn("Failed to register user to server:", err)
    );

    // 2. Add to users directory state & local cache
    setUsersDirectory((prev) => {
      const cleanUsername = sanitizedUser.username ? sanitizedUser.username.replace(/^@/, "").trim().toLowerCase() : "";
      const exists = prev.find(
        (u) =>
          u.id === sanitizedUser.id ||
          (cleanUsername && u.username && u.username.replace(/^@/, "").trim().toLowerCase() === cleanUsername)
      );
      const next = exists
        ? prev.map((u) => {
            const uClean = u.username ? u.username.replace(/^@/, "").trim().toLowerCase() : "";
            return u.id === sanitizedUser.id || (cleanUsername && uClean === cleanUsername)
              ? { ...u, ...sanitizedUser }
              : u;
          })
        : [sanitizedUser, ...prev];

      localStorage.setItem("artwall_users_directory", JSON.stringify(next));

      // 3. Auto-sync to Google Sheet if Google Workspace is connected
      autoSyncUsersToGoogleSheetIfConnected(next).catch((err) =>
        console.warn("Google Sheet auto-sync error:", err)
      );

      return next;
    });

    // Navigate to role-specific starting view
    if (sanitizedUser.role === "artist") {
      setCurrentTab("studio");
    } else if (sanitizedUser.role === "admin") {
      setCurrentTab("admin");
    } else {
      setCurrentTab("gallery");
    }
  };

  const handleViewOnWall = (artwork: Artwork, room?: string) => {
    setSelectedWallArtwork(artwork);
    if (room) setInitialRoomId(room);
    setDetailModalArtwork(null);
    handleTrackView(artwork.id);
    handleTrackArTry(artwork.id);
    setCurrentTab("visualizer");
  };

  const handleAddArtwork = (newArt: Artwork) => {
    setArtworks((prev) => [newArt, ...prev]);
    saveServerArtwork(newArt).catch((err) => console.warn("Failed to save artwork to server:", err));
  };

  const handleDeleteArtwork = (id: string) => {
    setArtworks((prev) => prev.filter((a) => a.id !== id));
    deleteServerArtwork(id).catch((err) => console.warn("Failed to delete artwork on server:", err));
  };

  const handleSaveUser = (updatedUser: TelegramUser) => {
    // Security check: only @muxammadsiddiq_23 is allowed to possess admin role
    const sanitizedUser: TelegramUser = {
      ...updatedUser,
      role: updatedUser.role === "admin" && !isAuthorizedAdmin(updatedUser) ? "buyer" : updatedUser.role,
      updatedAt: new Date().toISOString(),
    };
    setUser(sanitizedUser);
    localStorage.setItem("artwall_user", JSON.stringify(sanitizedUser));
    registerOrUpdateUser(sanitizedUser).catch(console.warn);

    setUsersDirectory((prev) => {
      const exists = prev.find((u) => u.id === sanitizedUser.id);
      const next = exists
        ? prev.map((u) => (u.id === sanitizedUser.id ? sanitizedUser : u))
        : [sanitizedUser, ...prev];
      localStorage.setItem("artwall_users_directory", JSON.stringify(next));
      autoSyncUsersToGoogleSheetIfConnected(next).catch(console.warn);
      return next;
    });
  };

  const handleViewArtistProfile = (artwork: Artwork) => {
    const existing = usersDirectory.find(
      (u) =>
        (artwork.artistId && String(u.id) === String(artwork.artistId)) ||
        (artwork.artistUsername && u.username && u.username.toLowerCase() === artwork.artistUsername.toLowerCase()) ||
        (`${u.first_name}${u.last_name ? ` ${u.last_name}` : ""}`.toLowerCase() === (artwork.artistName || "").toLowerCase())
    );

    const targetUser: TelegramUser = existing || {
      id: artwork.artistId ? Number(artwork.artistId) || 8888 : 8888,
      first_name: artwork.artistName.split(" ")[0] || artwork.artistName,
      last_name: artwork.artistName.split(" ").slice(1).join(" ") || undefined,
      username: artwork.artistUsername || "artwall_artist",
      photo_url: artwork.artistAvatar,
      role: "artist",
      bio: `Contemporary artist showcasing original collections including "${artwork.title}" on Art Wall AR.`,
      location: "Tashkent / Studio Central",
    };

    if (currentTab !== "profile") {
      setPreviousTabBeforeProfile(currentTab === "visualizer" || currentTab === "studio" || currentTab === "admin" ? currentTab : "gallery");
    }
    setTargetProfileUser(targetUser);
    setCurrentTab("profile");
    setDetailModalArtwork(null);
  };

  const handleViewUserProfile = (targetUser: TelegramUser) => {
    if (currentTab !== "profile") {
      setPreviousTabBeforeProfile(currentTab === "visualizer" || currentTab === "studio" || currentTab === "admin" ? currentTab : "gallery");
    }
    setTargetProfileUser(targetUser);
    setCurrentTab("profile");
  };

  const handleSwitchRole = (newRole: "buyer" | "artist" | "admin", navigateToWindow = true) => {
    // STRICT SECURITY RULE: Only Telegram user @muxammadsiddiq_23 is accessible for admin account;
    // all other accounts can only be either artist or buyer.
    const isMuxammadSiddiq = isAuthorizedAdmin(user);
    if (newRole === "admin" && !isMuxammadSiddiq) {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred("error");
      }
      setIsAuthModalOpen(true);
      return;
    }

    if (!user) {
      setIsOnboardingOpen(true);
      return;
    }

    const updatedUser: TelegramUser = {
      ...user,
      role: newRole,
    };
    if (newRole === "artist" && (!updatedUser.bio || updatedUser.bio.includes("collect"))) {
      updatedUser.bio = "Contemporary mixed media artist creating spatial dialogue through texture and light.";
    }

    setUser(updatedUser);
    localStorage.setItem("artwall_user", JSON.stringify(updatedUser));
    registerOrUpdateUser(updatedUser).catch(console.warn);

    // Keep user directory synced
    setUsersDirectory((prev) => {
      const exists = prev.find((u) => u.id === updatedUser.id);
      const next = exists
        ? prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
        : [updatedUser, ...prev];
      localStorage.setItem("artwall_users_directory", JSON.stringify(next));
      autoSyncUsersToGoogleSheetIfConnected(next).catch(console.warn);
      return next;
    });

    setTargetProfileUser(null);

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
    }

    // Direct user to role window if navigation requested
    if (navigateToWindow) {
      if (newRole === "artist") {
        setCurrentTab("studio");
      } else if (newRole === "admin") {
        setCurrentTab("admin");
      } else {
        setCurrentTab("gallery");
      }
    }
  };

  const currentRole = user?.role || "buyer";

  // Filter artworks strictly for this artist
  const artistArtworks = artworks.filter((a) => {
    if (!user) return true;
    if (user.id && String(a.artistId) === String(user.id)) return true;
    if (user.username && a.artistUsername && a.artistUsername.toLowerCase() === user.username.toLowerCase()) return true;
    const fullName = `${user.first_name}${user.last_name ? ` ${user.last_name}` : ""}`.trim().toLowerCase();
    if (a.artistName && a.artistName.toLowerCase() === fullName) return true;
    if (
      (user.username === "elena_art_studio" || user.first_name.toLowerCase().includes("elena")) &&
      (a.artistId === "artist-1" || a.artistUsername === "elena_art_studio")
    ) {
      return true;
    }
    return false;
  });

  // Window isolation: allow "profile" in all roles, prevent unauthorized cross-role tabs
  useEffect(() => {
    if (currentRole === "buyer") {
      if (currentTab !== "gallery" && currentTab !== "visualizer" && currentTab !== "profile") {
        setCurrentTab("gallery");
      }
    } else if (currentRole === "artist") {
      if (currentTab !== "studio" && currentTab !== "visualizer" && currentTab !== "profile") {
        setCurrentTab("studio");
      }
    } else if (currentRole === "admin") {
      if (currentTab !== "admin" && currentTab !== "visualizer" && currentTab !== "profile") {
        setCurrentTab("admin");
      }
    }
  }, [currentRole, currentTab]);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-[#F9F8F6] text-[#1A1A1A] font-sans flex flex-col">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === "basket") {
            setIsBasketDrawerOpen(true);
          } else if (tab === "profile") {
            setTargetProfileUser(null);
            setCurrentTab("profile");
          } else {
            setCurrentTab(tab);
          }
        }}
        lang={lang}
        onSelectLang={setLang}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        cartCount={cartItems.length}
        onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
        onSwitchRole={(role) => handleSwitchRole(role, true)}
      />

      {/* Main Window Content */}
      <main className={`flex-1 w-full max-w-full relative ${currentTab === "visualizer" ? "pb-0 overflow-hidden" : "pb-24 md:pb-8 overflow-x-clip"}`}>
        {/* ==================== PROFILE VIEW (Accessible across all roles) ==================== */}
        {currentTab === "profile" && (
          <ProfileView
            currentUser={user}
            targetUser={targetProfileUser}
            artworks={artworks}
            cartItems={cartItems}
            likedIds={likedIds}
            basketIds={basketIds}
            lang={lang}
            onSaveUser={handleSaveUser}
            onSwitchRole={(role) => handleSwitchRole(role)}
            onSelectArtwork={(art) => {
              handleTrackView(art.id);
              setDetailModalArtwork(art);
            }}
            onViewOnWall={(art) => handleViewOnWall(art)}
            onAddToBasket={(art) => handleAddToBasket(art)}
            onToggleLike={handleToggleLike}
            onOpenBasketDrawer={() => setIsBasketDrawerOpen(true)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onBackToPrevious={() => {
              setTargetProfileUser(null);
              setCurrentTab(previousTabBeforeProfile || (currentRole === "artist" ? "studio" : currentRole === "admin" ? "admin" : "gallery"));
            }}
            onShareArtwork={(art) => setShareModalArtwork(art)}
            onOpenStudio={() => setCurrentTab("studio")}
          />
        )}
        {/* ==================== 1. BUYER WINDOW ==================== */}
        {currentRole === "buyer" && (
          <>
            {currentTab === "gallery" && (
              <Marketplace
                artworks={artworks}
                lang={lang}
                onSelectArtwork={(art) => {
                  handleTrackView(art.id);
                  setDetailModalArtwork(art);
                }}
                onViewOnWall={(art) => handleViewOnWall(art)}
                onAddToBasket={(art) => handleAddToBasket(art)}
                onToggleLike={handleToggleLike}
                likedIds={likedIds}
                basketIds={basketIds}
                onShare={(art) => setShareModalArtwork(art)}
                onViewArtistProfile={handleViewArtistProfile}
              />
            )}

            {currentTab === "visualizer" && (
              <WallVisualizer
                selectedArtwork={selectedWallArtwork}
                allArtworks={artworks}
                lang={lang}
                onSelectArtwork={(art) => {
                  setSelectedWallArtwork(art);
                  handleTrackView(art.id);
                }}
                onAddToBasket={(art, config) => handleAddToBasket(art, config)}
                isInBasket={
                  selectedWallArtwork ? basketIds.has(selectedWallArtwork.id) : false
                }
                onOpenShareModal={(art) => setShareModalArtwork(art)}
                initialRoomId={initialRoomId}
                isLiked={selectedWallArtwork ? likedIds.has(selectedWallArtwork.id) : false}
                onToggleLike={handleToggleLike}
                onTrackArTry={handleTrackArTry}
              />
            )}
          </>
        )}

        {/* ==================== 2. ARTIST WINDOW ==================== */}
        {currentRole === "artist" && (
          <>
            {currentTab === "studio" && (
              <ArtistStudio
                user={user}
                artworks={artworks}
                lang={lang}
                onOpenAuth={() => setIsAuthModalOpen(true)}
                onAddArtwork={handleAddArtwork}
                onDeleteArtwork={handleDeleteArtwork}
                onViewOnWall={(art, room) => handleViewOnWall(art, room)}
                onShare={(art) => setShareModalArtwork(art)}
              />
            )}

            {currentTab === "visualizer" && (
              <div>
                <div className="bg-[#E8E6E1]/70 border-b border-[#D6D2C4] px-4 py-2 flex items-center justify-between text-xs">
                  <span className="text-neutral-600 font-medium">
                    Staging mode: Only your artworks ({artistArtworks.length} available)
                  </span>
                  <button
                    onClick={() => setCurrentTab("studio")}
                    className="font-bold text-[#1A1A1A] hover:underline"
                  >
                    ← Return to My Studio
                  </button>
                </div>
                <WallVisualizer
                  selectedArtwork={
                    selectedWallArtwork && artistArtworks.some((a) => a.id === selectedWallArtwork.id)
                      ? selectedWallArtwork
                      : artistArtworks[0] || null
                  }
                  allArtworks={artistArtworks}
                  lang={lang}
                  onSelectArtwork={(art) => {
                    setSelectedWallArtwork(art);
                    handleTrackView(art.id);
                  }}
                  onAddToBasket={(art, config) => handleAddToBasket(art, config)}
                  isInBasket={
                    selectedWallArtwork ? basketIds.has(selectedWallArtwork.id) : false
                  }
                  onOpenShareModal={(art) => setShareModalArtwork(art)}
                  initialRoomId={initialRoomId}
                  isLiked={selectedWallArtwork ? likedIds.has(selectedWallArtwork.id) : false}
                  onToggleLike={handleToggleLike}
                  onTrackArTry={handleTrackArTry}
                />
              </div>
            )}
          </>
        )}

        {/* ==================== 3. ADMIN WINDOW ==================== */}
        {currentRole === "admin" && (
          <>
            {currentTab === "admin" && (
              <AdminDashboard
                artworks={artworks}
                users={usersDirectory}
                currentUser={user}
                lang={lang}
                onViewOnWall={(art) => handleViewOnWall(art)}
                onViewProfile={handleViewUserProfile}
              />
            )}

            {currentTab === "visualizer" && (
              <div>
                <div className="bg-[#1A1A1A] text-white px-4 py-2.5 flex items-center justify-between text-xs">
                  <span className="text-neutral-300 font-medium">
                    Admin Previewing Artwork in Wall AR: <strong className="text-white">{selectedWallArtwork?.title}</strong>
                  </span>
                  <button
                    onClick={() => setCurrentTab("admin")}
                    className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold transition-colors"
                  >
                    ← Return to Admin Dashboard
                  </button>
                </div>
                <WallVisualizer
                  selectedArtwork={selectedWallArtwork}
                  allArtworks={artworks}
                  lang={lang}
                  onSelectArtwork={(art) => {
                    setSelectedWallArtwork(art);
                    handleTrackView(art.id);
                  }}
                  onAddToBasket={(art, config) => handleAddToBasket(art, config)}
                  isInBasket={
                    selectedWallArtwork ? basketIds.has(selectedWallArtwork.id) : false
                  }
                  onOpenShareModal={(art) => setShareModalArtwork(art)}
                  initialRoomId={initialRoomId}
                  isLiked={selectedWallArtwork ? likedIds.has(selectedWallArtwork.id) : false}
                  onToggleLike={handleToggleLike}
                  onTrackArTry={handleTrackArTry}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Telegram Auth & Window Role Switcher Modal */}
      {isAuthModalOpen && (
        <TelegramAuthModal
          currentUser={user}
          onSaveUser={(updatedUser) => {
            setUser(updatedUser);
            localStorage.setItem("artwall_user", JSON.stringify(updatedUser));
            setIsAuthModalOpen(false);
            if (updatedUser.role === "artist") {
              setCurrentTab("studio");
            } else if (updatedUser.role === "admin") {
              setCurrentTab("admin");
            } else {
              setCurrentTab("gallery");
            }
          }}
          onClose={() => setIsAuthModalOpen(false)}
          lang={lang}
        />
      )}

      {/* Startup Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        currentUser={user}
        onCompleteOnboarding={handleCompleteOnboarding}
        lang={lang}
      />

      {/* Artwork Details Modal */}
      <ArtworkDetailModal
        artwork={detailModalArtwork}
        onClose={() => setDetailModalArtwork(null)}
        lang={lang}
        isLiked={detailModalArtwork ? likedIds.has(detailModalArtwork.id) : false}
        onToggleLike={handleToggleLike}
        onAddToBasket={(art) => handleAddToBasket(art)}
        isInBasket={
          detailModalArtwork ? basketIds.has(detailModalArtwork.id) : false
        }
        onViewOnWall={(art) => handleViewOnWall(art)}
        onShare={(art) => setShareModalArtwork(art)}
        onViewArtistProfile={handleViewArtistProfile}
      />

      {/* Basket Drawer */}
      <BasketDrawer
        isOpen={isBasketDrawerOpen}
        onClose={() => setIsBasketDrawerOpen(false)}
        items={cartItems}
        onRemoveItem={handleRemoveFromBasket}
        onClearBasket={() => setCartItems([])}
        lang={lang}
        onViewOnWall={(item) => handleViewOnWall(item.artwork)}
        user={user}
      />

      {/* Cross-Platform Share Modal */}
      <ShareModal
        isOpen={!!shareModalArtwork}
        onClose={() => setShareModalArtwork(null)}
        artwork={shareModalArtwork}
        lang={lang}
      />

      {/* Global Instant Role Switcher Modal */}
      <RoleSwitcherModal
        isOpen={isRoleSwitcherOpen}
        onClose={() => setIsRoleSwitcherOpen(false)}
        currentUser={user}
        onSwitchRole={(role, navigate) => handleSwitchRole(role, navigate)}
        lang={lang}
      />
    </div>
  );
}
