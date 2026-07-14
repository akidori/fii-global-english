"use client";

import { useEffect, useState } from "react";
import { useLearningStore } from "@/store/use-learning-store";

/**
 * クライアントで LocalStorage から状態をハイドレートする。
 * ハイドレート完了までは軽いローディングを出して SSR/CSR 差異を避ける。
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const hydrate = useLearningStore((s) => s.hydrate);
  const hydrated = useLearningStore((s) => s.hydrated);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    hydrate();
    setMounted(true);
  }, [hydrate]);

  if (!mounted || !hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-core/30 border-t-cyan-core" />
          <p className="font-mono text-xs tracking-widest text-cyan-soft/70">
            LOADING FII...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
