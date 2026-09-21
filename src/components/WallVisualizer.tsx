import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  Move,
  Share,
  Heart,
  Image as ImageIcon,
  Maximize,
  Square,
  RotateCcw,
  Box,
  Camera,
  CameraOff,
  RefreshCw,
  X,
  ShoppingBag,
  Check,
  Sparkles,
  Sliders,
  Layers,
  AlertCircle,
} from "lucide-react";
import * as htmlToImage from "html-to-image";
import { Artwork, Language, RoomPreset } from "../types";
import { translations } from "../translations";

// Reusable Slider Component
const CustomSlider = ({
  label,
  value,
  unit,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  onChange: (val: number) => void;
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-2 w-full mb-4">
      <div className="flex justify-between text-xs font-medium text-neutral-800">
        <span>{label}</span>
        <span className="font-mono">
          {value}
          {unit}
        </span>
      </div>
      <div className="relative w-full h-1 bg-[#E5E7EB] rounded-full flex items-center">
        <div
          className="absolute h-full bg-[#6B7B62] rounded-full pointer-events-none"
          style={{ width: `${percentage}%` }}
        />
        <input
          className="absolute w-full h-full opacity-0 cursor-pointer"
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <div
          className="absolute w-4 h-4 bg-[#6B7B62] rounded-full shadow-sm pointer-events-none transition-transform"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
    </div>
  );
};

export const roomPresets: RoomPreset[] = [
  {
    id: "home-office",
    labelKey: "homeOffice",
    src: "https://images.unsplash.com/photo-1526887593587-a307ea5d46b4?auto=format&fit=crop&q=80&w=1200",
  },
  {
    id: "office-space",
    labelKey: "officeSpace",
    src: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1200",
  },
  {
    id: "living-room",
    labelKey: "livingRoom",
    src: "https://images.unsplash.com/photo-1604762525950-13c07ecdab8b?auto=format&fit=crop&q=80&w=1200",
  },
  {
    id: "bedroom",
    labelKey: "bedroom",
    src: "https://images.unsplash.com/photo-1648668425549-84b695d2ec2a?auto=format&fit=crop&q=80&w=1200",
  },
];

interface Props {
  selectedArtwork: Artwork | null;
  allArtworks: Artwork[];
  lang: Language;
  onSelectArtwork: (artwork: Artwork) => void;
  onAddToBasket: (artwork: Artwork, config: { frameColor: string; frameMaterial: any; frameThickness: number; mattingThickness: number; selectedWidth: number; selectedHeight: number }) => void;
  isInBasket: boolean;
  onOpenShareModal: (artwork: Artwork) => void;
  initialRoomId?: string;
  isLiked?: boolean;
  onToggleLike?: (id: string) => void;
  onTrackArTry?: (id: string) => void;
}

export const WallVisualizer: React.FC<Props> = ({
  selectedArtwork,
  allArtworks,
  lang,
  onSelectArtwork,
  onAddToBasket,
  isInBasket,
  onOpenShareModal,
  initialRoomId,
  isLiked = false,
  onToggleLike,
  onTrackArTry,
}) => {
  const t = translations[lang];

  const currentArtwork = selectedArtwork || allArtworks[0];

  const [activeTab, setActiveTab] = useState<"Upload" | "Size" | "Frame" | "Rooms" | null>(null);
  const [isARMode, setIsARMode] = useState(true);

  // Live Camera state
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Background room preset
  const [bgImage, setBgImage] = useState(
    roomPresets.find((r) => r.id === initialRoomId)?.src || roomPresets[0].src
  );

  useEffect(() => {
    if (initialRoomId) {
      const found = roomPresets.find((r) => r.id === initialRoomId);
      if (found) {
        setBgImage(found.src);
        setIsLiveCameraActive(false);
      }
    }
  }, [initialRoomId]);

  // Track AR try when entering visualizer or changing artwork
  useEffect(() => {
    if (currentArtwork?.id && onTrackArTry) {
      onTrackArTry(currentArtwork.id);
    }
  }, [currentArtwork?.id]);

  // Live Camera Stream Lifecycle
  const startLiveCamera = async (facing: "environment" | "user" = cameraFacingMode) => {
    try {
      setCameraError(null);
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch (e) {
        // Fallback for devices that don't support high-res constraints
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facing },
            audio: false,
          });
        } catch (e2) {
          // Final fallback
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((err) => {
            console.warn("Video play error:", err);
          });
        };
      }
      setIsLiveCameraActive(true);
      setIsARMode(true);

      if (currentArtwork?.id && onTrackArTry) {
        onTrackArTry(currentArtwork.id);
      }
    } catch (err: any) {
      console.warn("Camera error:", err);
      setCameraError(t.cameraAccessNeeded);
      setIsLiveCameraActive(false);
    }
  };

  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsLiveCameraActive(false);
  };

  const flipCamera = () => {
    const nextFacing = cameraFacingMode === "environment" ? "user" : "environment";
    setCameraFacingMode(nextFacing);
    if (isLiveCameraActive) {
      startLiveCamera(nextFacing);
    }
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Frame configuration
  const [frameColor, setFrameColor] = useState(currentArtwork?.defaultFrameColor || "#000000");
  const [frameMaterial, setFrameMaterial] = useState<"solid" | "wood" | "metal" | "pattern">(
    currentArtwork?.defaultFrameMaterial || "solid"
  );
  const [frameThickness, setFrameThickness] = useState(2);
  const [mattingThickness, setMattingThickness] = useState(0);
  const [artworkWidth, setArtworkWidth] = useState(currentArtwork?.width || 60);
  const [artworkHeight, setArtworkHeight] = useState(currentArtwork?.height || 80);

  // Sync with artwork prop
  useEffect(() => {
    if (currentArtwork) {
      if (currentArtwork.defaultFrameColor) setFrameColor(currentArtwork.defaultFrameColor);
      if (currentArtwork.defaultFrameMaterial) setFrameMaterial(currentArtwork.defaultFrameMaterial);
      if (currentArtwork.width) setArtworkWidth(currentArtwork.width);
      if (currentArtwork.height) setArtworkHeight(currentArtwork.height);
    }
  }, [currentArtwork]);

  // Transform / Drag / Rotate State
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ rx: 6, ry: -16, rz: -1 });
  const [isDragging, setIsDragging] = useState(false);
  const [transformMode, setTransformMode] = useState<"move" | "rotate" | "scale">("move");
  const [customScale, setCustomScale] = useState(1);
  const [isCapturing, setIsCapturing] = useState(false);

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialRx: number;
    initialRy: number;
    initialScale: number;
  }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    initialRx: 0,
    initialRy: 0,
    initialScale: 1,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const cameraFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: dragPos.x,
      initialY: dragPos.y,
      initialRx: rotation.rx,
      initialRy: rotation.ry,
      initialScale: customScale,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    if (isARMode) {
      if (transformMode === "move") {
        const factor = windowWidth < 600 ? 0.8 : 1.2;
        setDragPos({
          x: dragRef.current.initialX + dx * factor,
          y: dragRef.current.initialY + dy * factor,
        });
      } else if (transformMode === "rotate") {
        setRotation({
          ...rotation,
          ry: dragRef.current.initialRy + dx * 0.5,
          rx: Math.max(-80, Math.min(80, dragRef.current.initialRx - dy * 0.5)),
        });
      } else if (transformMode === "scale") {
        const scaleChange = (dx - dy) * 0.005;
        setCustomScale(
          Math.max(0.4, Math.min(2.5, dragRef.current.initialScale + scaleChange))
        );
      }
    } else {
      setRotation({
        ...rotation,
        ry: dragRef.current.initialRy + dx * 0.5,
        rx: Math.max(-80, Math.min(80, dragRef.current.initialRx - dy * 0.5)),
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleCustomArtworkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const customUrl = event.target?.result as string;
        const customArtwork: Artwork = {
          id: `custom-art-${Date.now()}`,
          title: "Custom Artwork",
          artistId: "user",
          artistName: "My Upload",
          imageUrl: customUrl,
          price: 0,
          width: artworkWidth,
          height: artworkHeight,
          medium: "Digital Preview",
          description: "Uploaded custom artwork for interior visualization.",
          category: "modern",
          likesCount: 0,
          isAvailable: false,
        };
        onSelectArtwork(customArtwork);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBgImage(event.target?.result as string);
        stopLiveCamera();
        setIsARMode(true);
        setDragPos({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const getMaterialStyle = () => {
    let background = frameColor;
    if (frameMaterial === "wood") {
      background = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04 0.4' numOctaves='3'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0.15 0'/%3E%3C/filter%3E%3Crect width='100' height='100' fill='${encodeURIComponent(frameColor)}'/%3E%3Crect width='100' height='100' filter='url(%23f)' mix-blend-mode='multiply'/%3E%3C/svg%3E")`;
    } else if (frameMaterial === "metal") {
      background = `linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 20%, rgba(0,0,0,0.2) 50%, rgba(255,255,255,0.1) 80%, rgba(0,0,0,0.5) 100%), ${frameColor}`;
    } else if (frameMaterial === "pattern") {
      background = `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.2' fill-rule='evenodd'%3E%3Ccircle cx='2' cy='2' r='2'/%3E%3C/g%3E%3C/svg%3E"), ${frameColor}`;
    }
    return background;
  };

  // Convert logical dimensions to display pixels (scaling factor)
  const baseScale = windowWidth < 600 ? 2.0 : 3.8;
  const arScaleFactor = windowWidth < 600 ? 1.6 : 3.0;
  const displayScale = (isARMode ? arScaleFactor : baseScale) * customScale;

  const canvasWidth = artworkWidth * displayScale;
  const canvasHeight = artworkHeight * displayScale;

  const handleCaptureAndShare = async () => {
    setIsCapturing(true);
    setActiveTab(null);
    await new Promise((resolve) => setTimeout(resolve, 150));

    try {
      const node = document.getElementById("wall-capture-container");
      if (!node) return;

      const dataUrl = await htmlToImage.toPng(node, {
        quality: 0.95,
        backgroundColor: isARMode ? undefined : "#F9F8F6",
        skipFonts: true,
      });

      if (navigator.share) {
        const blob = await fetch(dataUrl).then((r) => r.blob());
        const file = new File([blob], `${currentArtwork.title}-on-wall.png`, {
          type: "image/png",
        });
        await navigator.share({
          title: `${currentArtwork.title} on Wall`,
          text: `Check out ${currentArtwork.title} by ${currentArtwork.artistName} in 3D wall staging!`,
          files: [file],
        });
      } else {
        const link = document.createElement("a");
        link.download = `${currentArtwork.title}-wall.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error("Capture failed:", err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleResetPose = () => {
    setDragPos({ x: 0, y: 0 });
    setRotation({ rx: 6, ry: -16, rz: -1 });
    setCustomScale(1);
  };

  return (
    <div
      id="wall-capture-container"
      className={`relative w-full h-[calc(100vh-60px)] overflow-hidden font-sans select-none transition-colors duration-700 ${
        isARMode ? "bg-black" : "bg-[#F9F8F6]"
      }`}
    >
      {/* Real-Time Live Camera Feed */}
      {isLiveCameraActive ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
        />
      ) : (
        /* Immersive Room Background */
        isARMode && bgImage && (
          <img
            src={bgImage}
            alt="Room Environment"
            className="absolute inset-0 w-full h-full object-cover sm:object-contain pointer-events-none z-0"
          />
        )
      )}

      {/* Camera Error / Permission Notice */}
      {cameraError && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-40 bg-black/80 text-white text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 border border-white/20 backdrop-blur-md animate-in fade-in">
          <AlertCircle size={15} className="text-amber-400 shrink-0" />
          <span>{cameraError}</span>
          <button
            onClick={() => setCameraError(null)}
            className="text-white/70 hover:text-white ml-2 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Floating Staging Bar */}
      {!isCapturing && (
        <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
          {/* Artwork Info Pill */}
          <div className="bg-white/90 backdrop-blur-md px-3 sm:px-3.5 py-2 rounded-2xl border border-white/60 shadow-lg pointer-events-auto flex items-center gap-2 sm:gap-3">
            <img
              src={currentArtwork.imageUrl}
              alt={currentArtwork.title}
              className="w-7 h-9 rounded-md object-cover ring-1 ring-neutral-200 shrink-0"
            />
            <div className="min-w-0 pr-1">
              <span className="font-serif-custom text-xs sm:text-sm font-light italic text-[#1A1A1A] block leading-tight truncate max-w-[120px] sm:max-w-[180px]">
                {currentArtwork.title}
              </span>
              <span className="text-[10px] text-neutral-500 block leading-none font-mono">
                {artworkWidth}×{artworkHeight}cm • ${currentArtwork.price}
              </span>
            </div>

            {/* Like button in visualizer */}
            {onToggleLike && (
              <button
                onClick={() => onToggleLike(currentArtwork.id)}
                className={`p-1.5 rounded-xl transition-all ${
                  isLiked ? "bg-rose-50 text-rose-500" : "text-neutral-400 hover:text-rose-500"
                }`}
                title={t.like}
              >
                <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
              </button>
            )}

            {currentArtwork.price > 0 && (
              <button
                onClick={() =>
                  onAddToBasket(currentArtwork, {
                    frameColor,
                    frameMaterial,
                    frameThickness,
                    mattingThickness,
                    selectedWidth: artworkWidth,
                    selectedHeight: artworkHeight,
                  })
                }
                className={`py-1.5 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
                  isInBasket
                    ? "bg-[#6B7B62] text-white"
                    : "bg-[#1A1A1A] hover:bg-black text-white"
                }`}
              >
                {isInBasket ? <Check size={12} /> : <ShoppingBag size={12} />}
                <span className="hidden sm:inline">
                  {isInBasket ? t.inBasket : t.addToBasket}
                </span>
              </button>
            )}
          </div>

          {/* Quick Actions (Live Camera, Reset, Toggle AR/Room, Share) */}
          <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
            {/* Live Camera Toggle */}
            <button
              onClick={() => {
                if (isLiveCameraActive) {
                  stopLiveCamera();
                } else {
                  startLiveCamera();
                }
              }}
              className={`px-3 py-2 rounded-2xl backdrop-blur-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border shadow-lg transition-all ${
                isLiveCameraActive
                  ? "bg-rose-600 text-white border-rose-500 ring-2 ring-rose-400 animate-pulse"
                  : "bg-white/90 text-neutral-800 border-white/60 hover:bg-white"
              }`}
              title={isLiveCameraActive ? t.stopCamera : t.liveCamera}
            >
              <Camera size={15} />
              <span className="hidden md:inline">
                {isLiveCameraActive ? t.stopCamera : t.liveCamera}
              </span>
            </button>

            {/* Flip camera if active */}
            {isLiveCameraActive && (
              <button
                onClick={flipCamera}
                className="p-2.5 rounded-2xl bg-white/90 backdrop-blur-md text-neutral-800 border border-white/60 shadow-lg hover:scale-105 transition-all"
                title={t.flipCamera}
              >
                <RefreshCw size={15} />
              </button>
            )}

            <button
              onClick={handleResetPose}
              className="p-2.5 rounded-2xl bg-white/90 backdrop-blur-md text-neutral-700 hover:text-black border border-white/60 shadow-lg hover:scale-105 transition-all"
              title={t.reset}
            >
              <RotateCcw size={15} />
            </button>

            <button
              onClick={() => {
                if (isLiveCameraActive) stopLiveCamera();
                setIsARMode(!isARMode);
              }}
              className={`px-3 py-2 rounded-2xl backdrop-blur-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border shadow-lg transition-all ${
                isARMode
                  ? "bg-[#1A1A1A] text-white border-black"
                  : "bg-white/90 text-neutral-800 border-white/60"
              }`}
            >
              <Box size={14} />
              <span className="hidden sm:inline">
                {isARMode ? "Room View" : "Neutral"}
              </span>
            </button>

            {/* Quick Capture Snapshot Button */}
            <button
              onClick={handleCaptureAndShare}
              disabled={isCapturing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/90 hover:bg-white text-[#1A1A1A] border border-white/60 shadow-lg hover:scale-105 transition-all text-xs font-bold"
              title={t.downloadSnapshot}
            >
              <Camera size={15} className={isCapturing ? "animate-pulse text-amber-500" : "text-[#6B7B62]"} />
              <span className="hidden sm:inline">
                {isCapturing ? t.saving : "Snapshot"}
              </span>
            </button>

            <button
              onClick={() => onOpenShareModal(currentArtwork)}
              className="p-2.5 rounded-2xl bg-white/90 backdrop-blur-md text-neutral-700 hover:text-black border border-white/60 shadow-lg hover:scale-105 transition-all"
              title={t.share}
            >
              <Share size={15} />
            </button>
          </div>
        </div>
      )}

      {/* AR Transform & Angle Presets Bar */}
      {isARMode && !isCapturing && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex flex-col items-center gap-1.5 max-w-[95vw]">
          <div className="bg-white/90 backdrop-blur-md px-2 py-1 rounded-2xl border border-white/60 shadow-md flex items-center gap-1">
            {(["move", "rotate", "scale"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setTransformMode(mode)}
                className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                  transformMode === mode
                    ? "bg-[#1A1A1A] text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {t[mode as keyof typeof t] || mode}
              </button>
            ))}

            <div className="w-[1px] h-3.5 bg-neutral-300 mx-0.5" />

            {/* Quick Angles */}
            <button
              onClick={() => {
                setRotation({ rx: 0, ry: 0, rz: 0 });
                if (window.Telegram?.WebApp?.HapticFeedback) {
                  window.Telegram.WebApp.HapticFeedback.impactOccurred("light");
                }
              }}
              className={`px-2 py-1 rounded-xl text-[10px] font-bold transition-all ${
                rotation.ry === 0 && rotation.rx === 0
                  ? "bg-[#6B7B62] text-white"
                  : "text-neutral-600 hover:text-black"
              }`}
              title="Front Angle (0°)"
            >
              Front
            </button>
            <button
              onClick={() => {
                setRotation({ rx: 2, ry: -25, rz: 0 });
                if (window.Telegram?.WebApp?.HapticFeedback) {
                  window.Telegram.WebApp.HapticFeedback.impactOccurred("light");
                }
              }}
              className={`px-2 py-1 rounded-xl text-[10px] font-bold transition-all ${
                rotation.ry < -10 ? "bg-[#6B7B62] text-white" : "text-neutral-600 hover:text-black"
              }`}
              title="Left Angle (30°)"
            >
              30° L
            </button>
            <button
              onClick={() => {
                setRotation({ rx: 2, ry: 25, rz: 0 });
                if (window.Telegram?.WebApp?.HapticFeedback) {
                  window.Telegram.WebApp.HapticFeedback.impactOccurred("light");
                }
              }}
              className={`px-2 py-1 rounded-xl text-[10px] font-bold transition-all ${
                rotation.ry > 10 ? "bg-[#6B7B62] text-white" : "text-neutral-600 hover:text-black"
              }`}
              title="Right Angle (30°)"
            >
              30° R
            </button>
          </div>
        </div>
      )}

      {/* 3D Scene / AR Canvas */}
      <main
        className="absolute inset-0 flex items-center justify-center p-4 overflow-hidden touch-none"
        style={{ perspective: "1200px" }}
        onClick={() => activeTab && setActiveTab(null)}
      >
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`relative ${
            isDragging ? "" : "transition-all duration-500 ease-out"
          } cursor-grab active:cursor-grabbing touch-none`}
          style={{
            transformStyle: "preserve-3d",
            transform: isARMode
              ? `translate3d(${dragPos.x}px, ${dragPos.y}px, 0) scale(0.9) rotateY(${rotation.ry}deg) rotateX(${rotation.rx}deg) rotateZ(${rotation.rz}deg)`
              : `rotateY(${rotation.ry}deg) rotateX(${rotation.rx}deg) rotateZ(${rotation.rz}deg)`,
            width: canvasWidth,
            height: canvasHeight,
          }}
        >
          {/* The Physical 3D Frame */}
          <div
            className="w-full h-full relative box-border"
            style={{
              background: getMaterialStyle(),
              padding: `${frameThickness * (displayScale / 2)}px`,
              transformStyle: "preserve-3d",
            }}
          >
            {/* 3D Frame Faces */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Back face */}
              <div
                className="absolute inset-0"
                style={{
                  background: getMaterialStyle(),
                  transform: "translateZ(-24px)",
                  boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
                }}
              />
              {/* Top face */}
              <div
                className="absolute left-0 top-0 w-full origin-top brightness-[0.85]"
                style={{
                  background: getMaterialStyle(),
                  height: "24px",
                  transform: "rotateX(-90deg)",
                }}
              />
              {/* Bottom face */}
              <div
                className="absolute left-0 bottom-0 w-full origin-bottom brightness-[0.25]"
                style={{
                  background: getMaterialStyle(),
                  height: "24px",
                  transform: "rotateX(90deg)",
                }}
              />
              {/* Left face */}
              <div
                className="absolute left-0 top-0 h-full origin-left brightness-[0.65]"
                style={{
                  background: getMaterialStyle(),
                  width: "24px",
                  transform: "rotateY(90deg)",
                }}
              />
              {/* Right face */}
              <div
                className="absolute right-0 top-0 h-full origin-right brightness-[0.45]"
                style={{
                  background: getMaterialStyle(),
                  width: "24px",
                  transform: "rotateY(-90deg)",
                }}
              />
            </div>

            {/* Matting */}
            <div
              className="w-full h-full bg-white transition-all duration-300 relative overflow-hidden shadow-inner"
              style={{
                padding: `${mattingThickness * (displayScale / 2)}px`,
              }}
            >
              {/* Artwork Canvas */}
              <div
                className="w-full h-full relative bg-[#E8E6E1] overflow-hidden flex items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.06)]"
              >
                <img
                  src={currentArtwork.imageUrl}
                  alt={currentArtwork.title}
                  className="w-full h-full object-cover select-none pointer-events-none"
                  draggable={false}
                />
              </div>
            </div>

            {/* Inner frame shadow depth */}
            <div
              className="absolute inset-0 pointer-events-none shadow-[inset_0_3px_15px_rgba(0,0,0,0.3)]"
              style={{ margin: `${frameThickness * (displayScale / 2)}px` }}
            />
          </div>
        </div>
      </main>

      {/* Contextual Popovers for Tabs */}
      {!isCapturing && (
        <div className="absolute bottom-20 sm:bottom-24 left-0 w-full flex items-end justify-center pointer-events-none p-4 z-30">
          <div
            className={`bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-white/60 transition-all duration-300 ease-out w-full max-w-[340px] pointer-events-auto origin-bottom ${
              activeTab
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-4 scale-95 pointer-events-none"
            }`}
          >
            {/* Art / Sample Selector Tab */}
            {activeTab === "Upload" && (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  {t.artwork}
                </span>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Upload size={14} />
                  {t.uploadCustomImage}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleCustomArtworkUpload}
                  accept="image/*"
                  className="hidden"
                />

                <span className="text-[11px] font-medium text-neutral-600 mt-1">
                  {t.sampleGallery}
                </span>
                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
                  {allArtworks.map((art) => (
                    <button
                      key={art.id}
                      onClick={() => onSelectArtwork(art)}
                      className={`relative aspect-square rounded-lg overflow-hidden border transition-transform ${
                        currentArtwork.id === art.id
                          ? "ring-2 ring-[#6B7B62] scale-95"
                          : "hover:scale-105"
                      }`}
                    >
                      <img
                        src={art.imageUrl}
                        alt={art.title}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Room Presets Tab */}
            {activeTab === "Rooms" && (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  {t.environments}
                </span>

                {/* Live Camera Button inside Rooms tab too */}
                <button
                  onClick={() => {
                    if (isLiveCameraActive) stopLiveCamera();
                    else startLiveCamera();
                    setActiveTab(null);
                  }}
                  className="w-full py-2.5 px-3 bg-[#1A1A1A] hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  <Camera size={15} />
                  {isLiveCameraActive ? t.stopCamera : t.startCamera}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => cameraFileInputRef.current?.click()}
                    className="py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5"
                  >
                    <Camera size={14} />
                    {t.takePicture}
                  </button>
                  <button
                    onClick={() => bgFileInputRef.current?.click()}
                    className="py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5"
                  >
                    <Upload size={14} />
                    {t.uploadCustomEnv}
                  </button>
                </div>

                <input
                  type="file"
                  ref={bgFileInputRef}
                  onChange={handleBgImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={cameraFileInputRef}
                  onChange={handleBgImageUpload}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />

                <span className="text-[11px] font-medium text-neutral-600 mt-1">
                  {t.sampleRooms}
                </span>
                <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                  {roomPresets.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => {
                        stopLiveCamera();
                        setBgImage(room.src);
                        setIsARMode(true);
                      }}
                      className={`relative aspect-video rounded-xl overflow-hidden border transition-all ${
                        !isLiveCameraActive && bgImage === room.src
                          ? "ring-2 ring-[#6B7B62] scale-95"
                          : "opacity-80 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={room.src}
                        alt={room.id}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-2">
                        <span className="text-white text-[10px] font-bold">
                          {t[room.labelKey as keyof typeof t]}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Frame Settings Tab */}
            {activeTab === "Frame" && (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  {t.frameTab}
                </span>

                {/* Color choices */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-700">{t.frameColor}</span>
                  <div className="flex gap-2">
                    {["#000000", "#D6B996", "#4A3728", "#FFFFFF"].map((hex) => (
                      <button
                        key={hex}
                        onClick={() => setFrameColor(hex)}
                        style={{ backgroundColor: hex }}
                        className={`w-6 h-6 rounded-full border border-black/20 ${
                          frameColor === hex ? "ring-2 ring-[#6B7B62] scale-110" : ""
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Material choices */}
                <div>
                  <span className="text-xs text-neutral-700 block mb-1.5">
                    {t.frameMaterial}
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(["solid", "wood", "metal", "pattern"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setFrameMaterial(m)}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-medium capitalize transition-all ${
                          frameMaterial === m
                            ? "bg-[#1A1A1A] text-white"
                            : "bg-neutral-100 text-neutral-700"
                        }`}
                      >
                        {t[m as keyof typeof t]}
                      </button>
                    ))}
                  </div>
                </div>

                <CustomSlider
                  label={t.frameThickness}
                  value={frameThickness}
                  unit="cm"
                  min={1}
                  max={6}
                  onChange={setFrameThickness}
                />

                <CustomSlider
                  label={t.mattingThickness}
                  value={mattingThickness}
                  unit="cm"
                  min={0}
                  max={6}
                  onChange={setMattingThickness}
                />
              </div>
            )}

            {/* Size & Tilt Tab */}
            {activeTab === "Size" && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  {t.sizeTab}
                </span>

                <CustomSlider
                  label={t.width}
                  value={artworkWidth}
                  unit="cm"
                  min={20}
                  max={150}
                  onChange={setArtworkWidth}
                />

                <CustomSlider
                  label={t.height}
                  value={artworkHeight}
                  unit="cm"
                  min={20}
                  max={150}
                  onChange={setArtworkHeight}
                />

                <CustomSlider
                  label={t.scale}
                  value={Math.round(customScale * 100)}
                  unit="%"
                  min={50}
                  max={200}
                  onChange={(val) => setCustomScale(val / 100)}
                />

                <CustomSlider
                  label={t.tiltHorizontal}
                  value={Math.round(rotation.ry)}
                  unit="°"
                  min={-60}
                  max={60}
                  onChange={(ry) => setRotation({ ...rotation, ry })}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Dock Navigation Tabs */}
      {!isCapturing && (
        <div className="absolute bottom-4 left-0 w-full flex justify-center z-30 pointer-events-auto px-4">
          <div className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/60 shadow-xl flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab(activeTab === "Upload" ? null : "Upload")}
              className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === "Upload"
                  ? "bg-[#1A1A1A] text-white shadow-xs"
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              <ImageIcon size={15} />
              <span>{t.uploadTab}</span>
            </button>

            <button
              onClick={() => setActiveTab(activeTab === "Rooms" ? null : "Rooms")}
              className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === "Rooms"
                  ? "bg-[#1A1A1A] text-white shadow-xs"
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              <Layers size={15} />
              <span>{t.roomsTab}</span>
            </button>

            <button
              onClick={() => setActiveTab(activeTab === "Frame" ? null : "Frame")}
              className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === "Frame"
                  ? "bg-[#1A1A1A] text-white shadow-xs"
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              <Square size={15} />
              <span>{t.frameTab}</span>
            </button>

            <button
              onClick={() => setActiveTab(activeTab === "Size" ? null : "Size")}
              className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === "Size"
                  ? "bg-[#1A1A1A] text-white shadow-xs"
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              <Sliders size={15} />
              <span>{t.sizeTab}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
