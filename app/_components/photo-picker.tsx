"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const VIEWPORT = 240; // px — square crop viewport
const OUTPUT = 512; // px — exported square image size

type Drag = { startX: number; startY: number; originX: number; originY: number };

/**
 * Drag-to-adjust profile photo picker.
 *
 * The user picks an image, then drags to reposition and uses the slider to
 * zoom inside a square viewport. The framed region is rendered to a canvas and
 * written — as a real File — into a hidden <input type="file" name={name}> via
 * a DataTransfer, so it submits with the surrounding native <form action>.
 */
export function PhotoPicker({
  name,
  existingUrl,
}: {
  name: string;
  existingUrl?: string | null;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const dragRef = useRef<Drag | null>(null);

  // When a new file is chosen, load it into an Image to read its dimensions.
  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  }

  // Compute the scale that makes the image cover the viewport, then center it.
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    imgRef.current = img;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    setNatural({ w, h });
    const cover = Math.max(VIEWPORT / w, VIEWPORT / h);
    setMinScale(cover);
    setScale(cover);
    setOffset({
      x: (VIEWPORT - w * cover) / 2,
      y: (VIEWPORT - h * cover) / 2,
    });
  }, []);

  // Clamp offset so the image always covers the viewport (no empty gaps).
  const clamp = useCallback(
    (x: number, y: number, s: number) => {
      const w = natural.w * s;
      const h = natural.h * s;
      const minX = VIEWPORT - w;
      const minY = VIEWPORT - h;
      return {
        x: Math.min(0, Math.max(minX, x)),
        y: Math.min(0, Math.max(minY, y)),
      };
    },
    [natural],
  );

  function onPointerDown(e: React.PointerEvent) {
    if (!imageSrc) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: offset.x,
      originY: offset.y,
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    const next = clamp(
      d.originX + (e.clientX - d.startX),
      d.originY + (e.clientY - d.startY),
      scale,
    );
    setOffset(next);
  }

  function onPointerUp(e: React.PointerEvent) {
    dragRef.current = null;
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  function onZoom(e: React.ChangeEvent<HTMLInputElement>) {
    const s = Number(e.target.value);
    // Keep the viewport center anchored while zooming.
    const cx = VIEWPORT / 2;
    const ratio = s / scale;
    const next = clamp(
      cx - (cx - offset.x) * ratio,
      cx - (cx - offset.y) * ratio,
      s,
    );
    setScale(s);
    setOffset(next);
  }

  // Whenever the framing changes, render the crop and push it into the form
  // as a File on the hidden input.
  useEffect(() => {
    if (!imageSrc || !imgRef.current || !natural.w) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ratio = OUTPUT / VIEWPORT;
    ctx.clearRect(0, 0, OUTPUT, OUTPUT);
    ctx.drawImage(
      imgRef.current,
      offset.x * ratio,
      offset.y * ratio,
      natural.w * scale * ratio,
      natural.h * scale * ratio,
    );

    canvas.toBlob(
      (blob) => {
        if (!blob || !fileInputRef.current) return;
        const file = new File([blob], "profile.jpg", { type: "image/jpeg" });
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInputRef.current.files = dt.files;
      },
      "image/jpeg",
      0.9,
    );
  }, [imageSrc, offset, scale, natural]);

  return (
    <div className="space-y-3">
      <input ref={fileInputRef} type="file" name={name} accept="image/*" hidden />

      <div className="flex items-start gap-4">
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ width: VIEWPORT, height: VIEWPORT }}
          className={`relative overflow-hidden rounded-xl border-2 border-dashed ${
            imageSrc
              ? "cursor-grab border-transparent ring-1 ring-zinc-200 active:cursor-grabbing"
              : "grid place-items-center border-zinc-300 bg-zinc-50"
          }`}
        >
          {imageSrc ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt="Adjust"
                onLoad={onImageLoad}
                draggable={false}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: natural.w * scale,
                  height: natural.h * scale,
                  transform: `translate(${offset.x}px, ${offset.y}px)`,
                  maxWidth: "none",
                }}
              />
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/40" />
            </>
          ) : existingUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={existingUrl}
              alt="Current"
              className="size-full object-cover"
            />
          ) : (
            <span className="px-4 text-center text-xs text-zinc-400">
              No photo selected
            </span>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <label className="inline-flex cursor-pointer items-center rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800">
            {imageSrc ? "Change photo" : "Choose photo"}
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              onChange={onPick}
              className="hidden"
            />
          </label>

          {imageSrc ? (
            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-500">
                Zoom — drag the image to reposition
              </label>
              <input
                type="range"
                min={minScale}
                max={minScale * 4}
                step={0.01}
                value={scale}
                onChange={onZoom}
                className="w-full accent-teal-600"
              />
            </div>
          ) : (
            <p className="text-xs text-zinc-500">
              PNG, JPG, or WEBP. After choosing, drag to position and zoom.
              Optional.
            </p>
          )}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={OUTPUT}
        height={OUTPUT}
        className="hidden"
      />
    </div>
  );
}
