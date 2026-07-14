"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLearningStore } from "@/store/use-learning-store";

/** 状態に応じて適切な画面へ振り分ける。 */
export default function Home() {
  const router = useRouter();
  const profile = useLearningStore((s) => s.profile);
  const assessment = useLearningStore((s) => s.assessment);

  useEffect(() => {
    if (!profile) router.replace("/onboarding");
    else if (!assessment) router.replace("/assessment");
    else router.replace("/dashboard");
  }, [profile, assessment, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-core/30 border-t-cyan-core" />
    </div>
  );
}
