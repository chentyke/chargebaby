"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  targetSelector: string; // e.g. '#capture-root'
  filename?: string;
  className?: string;
  showText?: boolean; // whether to show text label next to icon
};

export default function SaveScreenshotButton({
  targetSelector,
  filename = "chargebaby.jpg",
  className,
  showText = false,
}: Props) {
  const [busy, setBusy] = useState(false);

  const handleClick = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const el = document.querySelector(targetSelector) as HTMLElement | null;
      if (!el) return;

      // 等待字体与布局稳定，减少渲染错位
      if ((document as any).fonts?.ready) {
        try { await (document as any).fonts.ready; } catch {}
      }
      await new Promise((r) => setTimeout(r, 50));

      // dynamic import at runtime to avoid SSR/TS resolution issues
      const html2canvas = (await import("html2canvas")).default as any;

      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const scale = Math.min(3, Math.max(2, dpr * 1.25));
      const canvas = await html2canvas(el, {
        backgroundColor: "#ffffff",
        scale,
        useCORS: true,
        // 使用默认渲染管线以提升兼容性，避免纯白图
        foreignObjectRendering: false,
        // 忽略标记的元素（例如顶栏按钮）
        ignoreElements: (node: any) =>
          node instanceof HTMLElement && node.dataset.ignoreCapture === "true",
      });
      const data = canvas.toDataURL("image/jpeg", 0.98);
      const a = document.createElement("a");
      a.href = data;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error("Failed to save screenshot", e);
    } finally {
      setBusy(false);
    }
  }, [busy, filename, targetSelector]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className={cn(
        "inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 disabled:opacity-50",
        className,
      )}
      aria-label="保存页面截图"
      title="保存页面截图"
    >
      <Download className="w-5 h-5" />
      {showText && <span>保存图片</span>}
    </button>
  );
}
