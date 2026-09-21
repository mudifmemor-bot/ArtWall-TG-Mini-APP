import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Marketplace } from "./components/Marketplace";
import { WallVisualizer } from "./components/WallVisualizer";
import { ArtistStudio } from "./components/ArtistStudio";
import { BasketDrawer } from "./components/BasketDrawer";
import { TelegramAuthModal } from "./components/TelegramAuthModal";
import { ArtworkDetailModal } from "./components/ArtworkDetailModal";
import { ShareModal } from "./components/ShareModal";
import { Artwork, CartItem, Language, TelegramUser } from "./types";
import { initialArtworks } from "./data/mockArtworks";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("artwall_lang");
    return (saved as Language) || "en";
  });

  const [currentTab, setCurrentTab] = useState<"gallery" | "visualizer" | "studio" | "basket">("gallery");

  // Artworks state (with localStorage persistence)
  const [artworks, setArtworks] = useState<Artwork[]>(() => {
    try {
      const saved = localStorage.getItem("artwall_artworks");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return initialArtworks;
  });

  useEffect(() => {
    localStorage.setItem("artwall_artworks", JSON.stringify(artworks));
  }, [artworks]);

  useEffect(() => {
    localStorage.setItem("artwall_lang", lang);
  }, [lang]);

  // Telegram User Authentication & Profile
  const [user, setUser] = useState<TelegramUser | null>(() => {
    try {
      const saved = localStorage.getItem("artwall_user");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      id: 74829103,
      first_name: "Elena",
      last_name: "Rostova",
      username: "elena_art_studio",
      photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
      role: "artist",
      bio: "Contemporary mixed media artist creating spatial dialogue through texture and light.",
      location: "Tashkent Studio",
    };
  });

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
      if (saved) return JSON.parse(saved);
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

        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
        }

        return [...prev, newItem];
      }
    });
  };

  const handleRemoveFromBasket = (artworkId: string) => {
    setCartItems((prev) => prev.filter((i) => i.artwork.id !== artworkId));
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred("medium");
    }
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

  // Telegram WebApp Setup
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      tg.setHeaderColor("#F9F8F6");

      // Read WebApp User if launched inside actual Telegram
      if (tg.initDataUnsafe?.user) {
        const tgUser = tg.initDataUnsafe.user;
        setUser((prev) => ({
          id: tgUser.id,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name,
          username: tgUser.username,
          photo_url: tgUser.photo_url || prev?.photo_url,
          role: prev?.role || "buyer",
          bio: prev?.bio,
          location: prev?.location,
        }));
      }

      // BackButton support
      if (tg.BackButton) {
        if (currentTab !== "gallery") {
          tg.BackButton.show();
          tg.BackButton.onClick(() => setCurrentTab("gallery"));
        } else {
          tg.BackButton.hide();
        }
      }
    }
  }, [currentTab]);

  const handleViewOnWall = (artwork: Artwork, room?: string) => {
    setSelectedWallArtwork(artwork);
    if (room) setInitialRoomId(room);
    setDetailModalArtwork(null);
    setCurrentTab("visualizer");
  };

  const handleAddArtwork = (newArt: Artwork) => {
    setArtworks((prev) => [newArt, ...prev]);
  };

  const handleDeleteArtwork = (id: string) => {
    setArtworks((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A] font-sans flex flex-col">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === "basket") {
            setIsBasketDrawerOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        lang={lang}
        onSelectLang={setLang}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        cartCount={cartItems.length}
      />

      {/* Main Tab Content */}
      <main className="flex-1 w-full relative">
        {currentTab === "gallery" && (
          <Marketplace
            artworks={artworks}
            lang={lang}
            onSelectArtwork={(art) => setDetailModalArtwork(art)}
            onViewOnWall={(art) => handleViewOnWall(art)}
            onAddToBasket={(art) => handleAddToBasket(art)}
            onToggleLike={handleToggleLike}
            likedIds={likedIds}
            basketIds={basketIds}
            onShare={(art) => setShareModalArtwork(art)}
          />
        )}

        {currentTab === "visualizer" && (
          <WallVisualizer
            selectedArtwork={selectedWallArtwork}
            allArtworks={artworks}
            lang={lang}
            onSelectArtwork={(art) => setSelectedWallArtwork(art)}
            onAddToBasket={(art, config) => handleAddToBasket(art, config)}
            isInBasket={
              selectedWallArtwork ? basketIds.has(selectedWallArtwork.id) : false
            }
            onOpenShareModal={(art) => setShareModalArtwork(art)}
            initialRoomId={initialRoomId}
          />
        )}

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
      </main>

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

      {/* Telegram Sign-In / Role Modal */}
      <TelegramAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={user}
        onSaveUser={setUser}
        lang={lang}
      />

      {/* Cross-Platform Share Modal */}
      <ShareModal
        isOpen={!!shareModalArtwork}
        onClose={() => setShareModalArtwork(null)}
        artwork={shareModalArtwork}
        lang={lang}
      />
    </div>
  );
}
