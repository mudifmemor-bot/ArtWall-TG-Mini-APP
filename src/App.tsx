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
} from "lucide-react";
import * as htmlToImage from "html-to-image";

// Reusable Slider Component
const CustomSlider = ({ label, value, unit, min, max, onChange }: any) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-2 w-full mb-5">
      <div className="flex justify-between text-sm font-medium text-neutral-800">
        <span>{label}</span>
        <span>
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

export default function App() {
  // PASTE THIS HERE (Immediately after the component starts)
  useEffect(() => {
    // 1. Initialize the Telegram bridge
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready(); // Critical for native hardware access 
      tg.expand(); // Forces full-screen mode [cite: 164, 180]
      tg.setHeaderColor('#F9F8F6'); // Matches your premium off-white branding [cite: 32]
    }

    // 2. Pre-flight check to warm up browser media permissions
    const initCameraAccess = async () => {
      try {
        await navigator.mediaDevices.enumerateDevices();
      } catch (e) {
        console.error("Initial camera handshake failed:", e);
      }
    };
    
    initCameraAccess();
  }, []);
  const [activeTab, setActiveTab] = useState<
    "Upload" | "Size" | "Frame" | "Rooms" | null
  >(null);
  const [isARMode, setIsARMode] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleShare = async () => {
    setIsCapturing(true);
    setActiveTab(null);
    // Wait for state to update and re-render
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const node = document.getElementById("capture-container");
      if (!node) return;
      const dataUrl = await htmlToImage.toPng(node, {
        quality: 0.9,
        backgroundColor: isARMode ? undefined : "#F9F8F6",
      });

      if (navigator.share) {
        const blob = await fetch(dataUrl).then((r) => r.blob());
        const file = new File([blob], "art-wall-ar.png", {
          type: "image/png",
        });
        await navigator.share({
          title: "My Art Wall AR",
          text: "Check out my art in AR!",
          files: [file],
        });
      } else {
        const link = document.createElement("a");
        link.download = "art-wall-ar.png";
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error("Oops, something went wrong!", err);
    } finally {
      setIsCapturing(false);
    }
  };

  // Configuration State
  const [frameColor, setFrameColor] = useState("#000000");
  const [frameThickness, setFrameThickness] = useState(2);
  const [mattingThickness, setMattingThickness] = useState(0);
  const [artworkWidth, setArtworkWidth] = useState(50);
  const [artworkHeight, setArtworkHeight] = useState(70);

  // AR Drag State
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ rx: 8, ry: -22, rz: -2 });
  const [isDragging, setIsDragging] = useState(false);
  const [transformMode, setTransformMode] = useState<
    "translate" | "rotate" | "scale"
  >("translate");
  const [customScale, setCustomScale] = useState(1);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024,
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

  const colors = [
    { id: "black", hex: "#000000" },
    { id: "oak", hex: "#D6B996" },
    { id: "walnut", hex: "#4A3728" },
    { id: "white", hex: "#FFFFFF" },
  ];

  const sampleArtworks = [
    "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1549887552-cb1071d3e5ca?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1580136608260-4eb11f4b24fe?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1578301978693-85fa9c026f43?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1582201942988-13e60e4556ee?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1563605663673-f1dfb3986b1c?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1579762715111-a6e19c40549b?auto=format&fit=crop&q=80&w=800",
  ];

  const [bgImage, setBgImage] = useState("");

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
      if (transformMode === "translate") {
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
          Math.max(
            0.5,
            Math.min(2, dragRef.current.initialScale + scaleChange),
          ),
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setImageSrc(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBgImage(event.target?.result as string);
        if (!isARMode) {
          setIsARMode(true);
          setDragPos({ x: 0, y: 0 });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Dynamic Shadow Extrusion Calculation
  const getExtrusionShadow = () => {
    if (isARMode) return "0 20px 50px -10px rgba(0,0,0,0.3)";

    const isWhite = frameColor === "#FFFFFF";
    const edgeColor = isWhite
      ? "#d1d1d1"
      : frameColor === "#000000"
        ? "#111111"
        : frameColor;
    const depth = 15;

    let shadow = "";
    for (let i = 1; i <= depth; i++) {
      shadow += `${-i}px ${i}px 0 ${edgeColor}, `;
    }
    shadow += `-15px 15px 30px rgba(0,0,0,0.1), -40px 40px 60px rgba(0,0,0,0.05)`;
    return shadow;
  };

  // Convert logical dimensions to display pixels (scaling factor)
  // Reduced by 20% to fit mobile displays without distortion
  const baseScale = windowWidth < 600 ? 2.0 : 4.0;
  const arScaleFactor = windowWidth < 600 ? 1.6 : 3.2;
  const displayScale = (isARMode ? arScaleFactor : baseScale) * customScale;

  const canvasWidth = artworkWidth * displayScale;
  const canvasHeight = artworkHeight * displayScale;

  return (
    <div
      id="capture-container"
      className={`h-[100dvh] w-full relative overflow-hidden font-sans transition-colors duration-1000 ${
        isARMode ? "bg-black" : "bg-[#F9F8F6]"
      }`}
    >
      {/* Immersive Room Background */}
      {isARMode && bgImage && (
        <img
          src={bgImage || undefined}
          alt="Room Environment"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-0"
        />
      )}

      {/* Background Overlay for AR readability removed to display environment clearly */}

      {/* Header: Logo & Units */}
      {!isCapturing && (
        <header className="absolute top-0 left-0 w-full p-6 sm:p-8 flex justify-between items-start z-20 pointer-events-none">
          <div className="flex flex-col pointer-events-auto">
            <h1 className="font-serif-custom text-2xl sm:text-3xl font-light italic">
              Art Wall AR
            </h1>
          </div>
        </header>
      )}

      {/* 3D Scene / AR Canvas */}
      <main
        className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 mt-[-5%] overflow-hidden touch-none"
        style={{ perspective: "1200px" }}
        onClick={() => activeTab && setActiveTab(null)}
      >
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`relative ${isDragging ? "" : "transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]"} cursor-grab active:cursor-grabbing touch-none`}
          style={{
            transformStyle: "preserve-3d",
            transform: isARMode
              ? `translate3d(${dragPos.x}px, ${dragPos.y}px, 0) scale(0.9) rotateY(${rotation.ry}deg) rotateX(${rotation.rx}deg) rotateZ(${rotation.rz}deg)`
              : `rotateY(${rotation.ry}deg) rotateX(${rotation.rx}deg) rotateZ(${rotation.rz}deg)`,
            width: canvasWidth,
            height: canvasHeight,
          }}
        >
          {/* The Physical Frame */}
          <div
            className="w-full h-full relative transition-all duration-500 box-border"
            style={{
              backgroundColor: frameColor,
              padding: `${frameThickness * (displayScale / 2)}px`,
              boxShadow: getExtrusionShadow(),
            }}
          >
            {/* Matting */}
            <div
              className="w-full h-full bg-white transition-all duration-300 relative overflow-hidden shadow-inner"
              style={{
                padding: `${mattingThickness * (displayScale / 2)}px`,
              }}
            >
              {/* Artwork / Canvas bounds */}
              <div className="w-full h-full relative bg-[#E8E6E1] overflow-hidden flex items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)]">
                {imageSrc ? (
                  <img
                    src={imageSrc || undefined}
                    alt="Uploaded Artwork"
                    className="w-full h-full object-cover select-none pointer-events-none"
                    draggable={false}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#80A195] via-[#E2D5C4] to-[#B2C2C1] opacity-90 flex items-center justify-center p-4">
                    <div
                      className="bg-white/80 p-8 text-center"
                      style={{ width: "80%", height: "80%" }}
                    >
                      <p className="text-neutral-800 text-3xl font-light tracking-tight mb-4 leading-tight">
                        Upload
                        <br />
                        an image
                      </p>
                      <p className="text-neutral-600 text-sm font-light">
                        and see it
                        <br />
                        on your wall
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Inner frame shadow to simulate depth overlapping the matting */}
            <div
              className="absolute inset-0 pointer-events-none shadow-[inset_0_2px_15px_rgba(0,0,0,0.3)]"
              style={{ margin: `${frameThickness * (displayScale / 2)}px` }}
            />
          </div>
        </div>
      </main>

      {/* Contextual Popovers */}
      {!isCapturing && (
        <div className="absolute bottom-24 sm:bottom-28 left-0 w-full flex items-end justify-center pointer-events-none p-4 z-30">
          <div
            className={`bg-white/95 backdrop-blur-[10px] p-5 sm:p-6 rounded-3xl shadow-lg border border-white/50 transition-all duration-300 ease-out w-full max-w-[320px] pointer-events-auto origin-bottom ${
              activeTab
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-4 scale-95 pointer-events-none"
            }`}
          >
            {activeTab === "Upload" && (
              <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
                <h3 className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">
                  Artwork
                </h3>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 sm:py-3 bg-[#F9F8F6] hover:bg-[#E8E6E1] text-[#1A1A1A] rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 transition-colors text-[11px] sm:text-sm font-medium border border-[#E8E6E1]"
                >
                  <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Upload Custom Image
                </button>

                <div className="h-px bg-neutral-100 w-full my-1" />

                <span className="text-sm font-medium text-neutral-800 block">
                  Sample Gallery
                </span>

                <div className="grid grid-cols-5 gap-2 max-h-[160px] overflow-y-auto pr-1 pb-1 scrollbar-thin">
                  {sampleArtworks.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setImageSrc(src)}
                      className={`relative aspect-square rounded-md overflow-hidden transition-all duration-200 ${
                        imageSrc === src
                          ? "ring-2 ring-offset-2 ring-[#6B7B62] scale-95"
                          : "hover:opacity-80 ring-1 ring-black/5"
                      }`}
                    >
                      <img
                        src={src || undefined}
                        className="w-full h-full object-cover"
                        alt={`Sample ${i + 1}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "Rooms" && (
              <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
                <h3 className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">
                  Environments
                </h3>

                <button
                  onClick={() => cameraFileInputRef.current?.click()}
                  className="w-full py-2 sm:py-3 bg-[#6B7B62] hover:bg-[#5a6852] text-white rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 transition-colors text-[11px] sm:text-sm font-medium shadow-md"
                >
                  <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Take a Picture
                </button>

                <button
                  onClick={() => bgFileInputRef.current?.click()}
                  className="w-full py-2 sm:py-3 bg-[#F9F8F6] hover:bg-[#E8E6E1] text-[#1A1A1A] rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 transition-colors text-[11px] sm:text-sm font-medium border border-[#E8E6E1]"
                >
                  <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Upload Custom Environment
                </button>
              </div>
            )}

            {activeTab === "Frame" && (
              <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
                <h3 className="text-xs font-bold uppercase tracking-widest opacity-60">
                  Configuration
                </h3>
                <div>
                  <span className="text-sm font-medium text-neutral-800 mb-3 block">
                    Frame Color
                  </span>
                  <div className="flex gap-2 sm:gap-3">
                    {colors.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setFrameColor(c.hex)}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all duration-200 flex items-center justify-center ${
                          frameColor === c.hex
                            ? "ring-2 ring-offset-2 ring-blue-500 scale-110"
                            : "ring-1 ring-neutral-200 hover:scale-105"
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>

                <div className="h-px bg-neutral-100 w-full" />

                <CustomSlider
                  label="Frame Thickness"
                  value={frameThickness}
                  unit="cm"
                  min={1}
                  max={10}
                  onChange={setFrameThickness}
                />

                <CustomSlider
                  label="Matting Thickness"
                  value={mattingThickness}
                  unit="cm"
                  min={0}
                  max={15}
                  onChange={setMattingThickness}
                />
              </div>
            )}

            {activeTab === "Size" && (
              <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
                <h3 className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">
                  Configuration
                </h3>
                <CustomSlider
                  label="Width"
                  value={artworkWidth}
                  unit="cm"
                  min={20}
                  max={150}
                  onChange={setArtworkWidth}
                />

                <CustomSlider
                  label="Height"
                  value={artworkHeight}
                  unit="cm"
                  min={20}
                  max={150}
                  onChange={setArtworkHeight}
                />

                <CustomSlider
                  label="Scale"
                  value={Math.round(customScale * 100)}
                  unit="%"
                  min={50}
                  max={200}
                  onChange={(val: number) => setCustomScale(val / 100)}
                />
                <CustomSlider
                  label="Tilt Horizontal"
                  value={rotation.ry}
                  unit="°"
                  min={-60}
                  max={60}
                  onChange={(val: number) =>
                    setRotation({ ...rotation, ry: val })
                  }
                />
                <CustomSlider
                  label="Tilt Vertical"
                  value={rotation.rx}
                  unit="°"
                  min={-60}
                  max={60}
                  onChange={(val: number) =>
                    setRotation({ ...rotation, rx: val })
                  }
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* AR Actions positioned at bottom right */}
      {isARMode && !isCapturing && (
        <div className="absolute bottom-24 sm:bottom-28 right-4 flex flex-col items-end gap-2 pointer-events-none z-30 animate-in fade-in slide-in-from-right-4 duration-500">
          <button
            onClick={() => {
              setDragPos({ x: 0, y: 0 });
              setRotation({ rx: 0, ry: 0, rz: 0 });
              setCustomScale(1);
              setArtworkWidth(50);
              setArtworkHeight(70);
            }}
            className="w-[90px] sm:w-[130px] bg-white/90 backdrop-blur-md text-[#1A1A1A] px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-xl text-[8px] sm:text-xs font-bold uppercase tracking-widest shadow-lg border border-white hover:scale-105 transition-transform flex items-center justify-center gap-1.5 sm:gap-2 pointer-events-auto"
          >
            <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />{" "}
            <span>Reset</span>
          </button>
          <button
            onClick={handleShare}
            className="w-[90px] sm:w-[130px] bg-white/90 backdrop-blur-md text-[#1A1A1A] px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-xl text-[8px] sm:text-xs font-bold uppercase tracking-widest shadow-lg border border-white hover:scale-105 transition-transform flex items-center justify-center gap-1.5 sm:gap-2 pointer-events-auto"
          >
            <Share className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />{" "}
            <span>{isCapturing ? "Saving" : "Share"}</span>
          </button>
          <button className="w-[90px] sm:w-[130px] bg-[#6B7B62] text-white px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-xl text-[8px] sm:text-xs font-bold uppercase tracking-widest shadow-lg border border-transparent hover:scale-105 hover:bg-[#5a6852] transition-colors flex items-center justify-center gap-1.5 sm:gap-2 pointer-events-auto">
            <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />{" "}
            <span>Save</span>
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleImageUpload}
        className="hidden"
      />
      <input
        type="file"
        accept="image/*"
        ref={bgFileInputRef}
        onChange={handleBgImageUpload}
        className="hidden"
      />
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={cameraFileInputRef}
        onChange={handleBgImageUpload}
        className="hidden"
      />

      {/* Bottom Navigation Pill */}
      {!isCapturing && (
        <nav className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 w-full flex justify-center z-40 px-2 sm:px-4 pointer-events-none">
          <div className="flex gap-2 sm:gap-4 pointer-events-auto">
            {/* Main Controls Pill */}
            <div className="bg-[#2A2A2A] text-white rounded-[24px] px-3 sm:px-6 py-1.5 sm:py-4 flex items-center gap-3 sm:gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-md">
              {/* Upload Button */}
              <button
                onClick={() =>
                  setActiveTab(activeTab === "Upload" ? null : "Upload")
                }
                className="flex flex-col items-center space-y-0.5 sm:space-y-1 relative group py-1"
              >
                <div
                  className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 transition-colors ${activeTab === "Upload" ? "text-white" : "text-white/40 group-hover:text-white"}`}
                >
                  <Upload className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-[7.5px] sm:text-xs font-bold uppercase tracking-widest mt-1 sm:mt-0">
                    Upload
                  </span>
                </div>
                {activeTab === "Upload" && (
                  <div className="w-1 h-1 bg-white rounded-full absolute -bottom-1.5 sm:-bottom-3" />
                )}
              </button>

              <div className="w-px h-6 sm:h-4 bg-white/10" />

              {/* Size Button */}
              <button
                onClick={() =>
                  setActiveTab(activeTab === "Size" ? null : "Size")
                }
                className="flex flex-col items-center space-y-0.5 sm:space-y-1 relative group py-1"
              >
                <div
                  className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 transition-colors ${activeTab === "Size" ? "text-white" : "text-white/40 group-hover:text-white"}`}
                >
                  <Maximize className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-[7.5px] sm:text-xs font-bold uppercase tracking-widest mt-1 sm:mt-0">
                    Size
                  </span>
                </div>
                {activeTab === "Size" && (
                  <div className="w-1 h-1 bg-white rounded-full absolute -bottom-1.5 sm:-bottom-3" />
                )}
              </button>

              <div className="w-px h-6 sm:h-4 bg-white/10" />

              {/* Frame Button */}
              <button
                onClick={() =>
                  setActiveTab(activeTab === "Frame" ? null : "Frame")
                }
                className="flex flex-col items-center space-y-0.5 sm:space-y-1 relative group py-1"
              >
                <div
                  className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 transition-colors ${activeTab === "Frame" ? "text-white" : "text-white/40 group-hover:text-white"}`}
                >
                  <Square className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-[7.5px] sm:text-xs font-bold uppercase tracking-widest mt-1 sm:mt-0">
                    Frame
                  </span>
                </div>
                {activeTab === "Frame" && (
                  <div className="w-1 h-1 bg-white rounded-full absolute -bottom-1.5 sm:-bottom-3" />
                )}
              </button>

              <div className="w-px h-6 sm:h-4 bg-white/10" />

              {/* Rooms Button */}
              <button
                onClick={() =>
                  setActiveTab(activeTab === "Rooms" ? null : "Rooms")
                }
                className="flex flex-col items-center space-y-0.5 sm:space-y-1 relative group py-1"
              >
                <div
                  className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 transition-colors ${activeTab === "Rooms" ? "text-white" : "text-white/40 group-hover:text-white"}`}
                >
                  <ImageIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-[7.5px] sm:text-xs font-bold uppercase tracking-widest mt-1 sm:mt-0">
                    Rooms
                  </span>
                </div>
                {activeTab === "Rooms" && (
                  <div className="w-1 h-1 bg-white rounded-full absolute -bottom-1.5 sm:-bottom-3" />
                )}
              </button>
            </div>

            {/* AR Toggle Pill */}
            <button
              onClick={() => {
                setIsARMode(!isARMode);
                setActiveTab(null);
                // Reset drag position when entering AR
                if (!isARMode) setDragPos({ x: 0, y: 0 });
              }}
              className={`bg-[#2A2A2A] text-white rounded-[24px] px-3 sm:px-6 py-1.5 sm:py-4 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition-all duration-300 hover:scale-105 active:scale-95 ${
                isARMode ? "ring-2 ring-[#6B7B62] bg-[#1A1A1A]" : ""
              }`}
            >
              {isARMode ? (
                <Move className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              ) : (
                <Box className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              )}
              <span className="text-[7.5px] sm:text-xs font-bold uppercase tracking-widest mt-1 sm:mt-0">
                {isARMode ? "Move" : "AR View"}
              </span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
