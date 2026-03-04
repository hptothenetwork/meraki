"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ImageEditorProps = {
  src: string;
  onSave: (settings: ImageSettings) => void;
  onClose: () => void;
  initialSettings?: ImageSettings;
  aspectRatio?: number; // width/height, e.g., 16/9 = 1.78
};

export type ImageSettings = {
  src: string;
  scale: number;
  positionX: number; // -100 to 100 (percentage offset)
  positionY: number;
  fit: "cover" | "contain" | "fill";
};

export default function ImageEditor({
  src,
  onSave,
  onClose,
  initialSettings,
  aspectRatio = 16 / 9,
}: ImageEditorProps) {
  const [scale, setScale] = useState(initialSettings?.scale ?? 100);
  const [positionX, setPositionX] = useState(initialSettings?.positionX ?? 50);
  const [positionY, setPositionY] = useState(initialSettings?.positionY ?? 50);
  const [fit, setFit] = useState<"cover" | "contain" | "fill">(initialSettings?.fit ?? "cover");
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (fit !== "cover") return;
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        posX: positionX,
        posY: positionY,
      };
    },
    [fit, positionX, positionY]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;
      setPositionX(Math.max(0, Math.min(100, dragStartRef.current.posX - deltaX)));
      setPositionY(Math.max(0, Math.min(100, dragStartRef.current.posY - deltaY)));
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleSave = () => {
    onSave({ src, scale, positionX, positionY, fit });
  };

  const handleReset = () => {
    setScale(100);
    setPositionX(50);
    setPositionY(50);
    setFit("cover");
  };

  const getImageStyle = (): React.CSSProperties => {
    if (fit === "contain") {
      return {
        objectFit: "contain",
        width: "100%",
        height: "100%",
      };
    }
    if (fit === "fill") {
      return {
        objectFit: "fill",
        width: "100%",
        height: "100%",
      };
    }
    // cover with position and scale
    return {
      objectFit: "cover",
      width: `${scale}%`,
      height: `${scale}%`,
      objectPosition: `${positionX}% ${positionY}%`,
      position: "absolute",
      left: `${50 - (scale / 2)}%`,
      top: `${50 - (scale / 2)}%`,
    };
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-mubah-mid bg-mubah-deep p-4 md:p-6 space-y-3">
        <div className="flex items-center justify-between sticky top-0 bg-mubah-deep pb-2 z-10">
          <h2 className="text-lg font-medium text-mubah-cream">Edit Image Display</h2>
          <button
            onClick={onClose}
            className="text-mubah-cream/60 hover:text-mubah-cream text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Preview */}
        <div
          ref={containerRef}
          className="relative mx-auto overflow-hidden rounded-lg border border-mubah-mid/40 bg-black/40"
          style={{
            aspectRatio,
            maxHeight: "min(300px, 40vh)",
            cursor: fit === "cover" ? (isDragging ? "grabbing" : "grab") : "default",
          }}
          onMouseDown={handleMouseDown}
        >
          {fit === "cover" ? (
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                backgroundImage: `url('${src}')`,
                backgroundSize: `${scale}%`,
                backgroundPosition: `${positionX}% ${positionY}%`,
                backgroundRepeat: "no-repeat",
              }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="Preview" style={getImageStyle()} />
          )}
          {fit === "cover" && (
            <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
              Drag to reposition
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Fit Mode */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-mubah-cream/70">
              Fit Mode
            </label>
            <div className="flex gap-2">
              {(["cover", "contain", "fill"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFit(mode)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs uppercase tracking-wider transition ${
                    fit === mode
                      ? "border-mubah-orange bg-mubah-orange/20 text-mubah-orange"
                      : "border-mubah-mid text-mubah-cream/70 hover:border-mubah-cream/50"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-mubah-cream/50">
              {fit === "cover" && "Fills area, may crop edges. Drag to adjust focus."}
              {fit === "contain" && "Shows entire image, may have empty space."}
              {fit === "fill" && "Stretches to fill, may distort image."}
            </p>
          </div>

          {/* Scale (only for cover) */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-mubah-cream/70">
              Zoom: {scale}%
            </label>
            <input
              type="range"
              min="100"
              max="200"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              disabled={fit !== "cover"}
              className="w-full accent-mubah-orange disabled:opacity-40"
            />
            <p className="text-[10px] text-mubah-cream/50">
              {fit === "cover" ? "Zoom in to crop more of the image" : "Enable 'cover' mode to zoom"}
            </p>
          </div>
        </div>

        {/* Position controls (only for cover) */}
        {fit === "cover" && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-mubah-cream/70">
                Horizontal: {positionX}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={positionX}
                onChange={(e) => setPositionX(Number(e.target.value))}
                className="w-full accent-mubah-orange"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-mubah-cream/70">
                Vertical: {positionY}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={positionY}
                onChange={(e) => setPositionY(Number(e.target.value))}
                className="w-full accent-mubah-orange"
              />
            </div>
          </div>
        )}

        {/* Quick position presets */}
        {fit === "cover" && (
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-mubah-cream/70">
              Quick Position
            </label>
            <div className="grid grid-cols-3 gap-2 max-w-xs">
              {[
                { label: "↖", x: 0, y: 0 },
                { label: "↑", x: 50, y: 0 },
                { label: "↗", x: 100, y: 0 },
                { label: "←", x: 0, y: 50 },
                { label: "•", x: 50, y: 50 },
                { label: "→", x: 100, y: 50 },
                { label: "↙", x: 0, y: 100 },
                { label: "↓", x: 50, y: 100 },
                { label: "↘", x: 100, y: 100 },
              ].map((pos) => (
                <button
                  key={`${pos.x}-${pos.y}`}
                  onClick={() => {
                    setPositionX(pos.x);
                    setPositionY(pos.y);
                  }}
                  className={`rounded border px-3 py-2 text-sm transition ${
                    positionX === pos.x && positionY === pos.y
                      ? "border-mubah-orange bg-mubah-orange/20 text-mubah-orange"
                      : "border-mubah-mid text-mubah-cream/70 hover:border-mubah-cream/50"
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            className="rounded-full bg-mubah-orange px-6 py-2 text-sm font-medium text-mubah-deep transition hover:bg-mubah-orange/90"
          >
            Apply Settings
          </button>
          <button
            onClick={handleReset}
            className="rounded-full border border-mubah-mid px-6 py-2 text-sm text-mubah-cream/70 transition hover:border-mubah-cream/50"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="rounded-full border border-mubah-mid px-6 py-2 text-sm text-mubah-cream/70 transition hover:border-mubah-cream/50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
