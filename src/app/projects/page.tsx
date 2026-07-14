"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useLearningStore } from "@/store/use-learning-store";
import { FiiAvatar } from "@/components/fii/FiiAvatar";
import { FiiCoachBubble } from "@/components/fii/FiiCoachBubble";
import { Panel, Button, SectionTitle } from "@/components/ui/primitives";
import { IconPlus, IconTrash, IconSpeaker, IconFolder } from "@/components/ui/icons";
import { generateMaterial } from "@/lib/material-generator";
import { speak, ttsSupported } from "@/lib/speech";
import { uid } from "@/lib/id";
import { todayISO } from "@/lib/date";
import type { ProjectBrief } from "@/types";

export default function ProjectsPage() {
  return (
    <AppShell>
      <Inner />
    </AppShell>
  );
}

function Inner() {
  const projects = useLearningStore((s) => s.projects);
  const addProject = useLearningStore((s) => s.addProject);
  const removeProject = useLearningStore((s) => s.removeProject);
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-ink">実案件</h1>
          <p className="text-xs text-muted">案件情報から、商談用の英語を自動生成する。</p>
        </div>
        <Button variant="outline" onClick={() => setAdding((a) => !a)} className="px-3 py-2 text-xs">
          <IconPlus width={16} height={16} /> 案件を登録
        </Button>
      </div>

      <FiiCoachBubble>
        実際の案件を入れておくと、その商談専用の自己紹介・企画説明・想定質問・当日カンペ・お礼文まで用意するよ。ぶっつけ本番より100倍いい。
      </FiiCoachBubble>

      {adding && (
        <BriefForm
          onSave={(b) => {
            addProject(b);
            setAdding(false);
            setOpenId(b.id);
          }}
        />
      )}

      {projects.length === 0 && !adding && (
        <div className="py-10 text-center text-sm text-muted">
          <IconFolder width={28} height={28} className="mx-auto mb-2 text-cyan-core/50" />
          まだ案件がありません。商談前にここへ登録してね。
        </div>
      )}

      <div className="space-y-3">
        {projects.map((p) => (
          <Panel key={p.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-ink">{p.clientName}</h3>
                <p className="text-xs text-muted">
                  {p.industry} · {p.videoGoal}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setOpenId(openId === p.id ? null : p.id)}
                  className="rounded-lg border border-cyan-core/30 px-2.5 py-1 text-xs text-cyan-soft"
                >
                  {openId === p.id ? "閉じる" : "英語教材を見る"}
                </button>
                <button onClick={() => removeProject(p.id)} className="rounded-lg p-1.5 text-muted hover:text-rose-200">
                  <IconTrash width={15} height={15} />
                </button>
              </div>
            </div>
            {openId === p.id && <Material brief={p} />}
          </Panel>
        ))}
      </div>
    </div>
  );
}

function Material({ brief }: { brief: ProjectBrief }) {
  const m = generateMaterial(brief);
  return (
    <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
      <Block title="自己紹介" text={m.intro} />
      <Block title="企画説明" text={m.planPitch} />
      <ListBlock title="確認フレーズ" items={m.confirmPhrases} />
      <ListBlock title="想定質問（これに答える練習を）" items={m.expectedQuestions} />
      <ListBlock title="当日カンペ" items={m.cheatSheet} jp />
      <Block title="会議後フォローアップ文" text={m.followUp} />
    </div>
  );
}

function Block({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <SectionTitle label={title} />
        {ttsSupported() && (
          <button onClick={() => speak(text)} className="mb-3 text-cyan-soft/70">
            <IconSpeaker width={15} height={15} />
          </button>
        )}
      </div>
      <p className="rounded-lg bg-navy-700/40 px-3 py-2 text-sm text-cyan-soft">{text}</p>
    </div>
  );
}

function ListBlock({ title, items, jp }: { title: string; items: string[]; jp?: boolean }) {
  return (
    <div>
      <SectionTitle label={title} />
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-center justify-between rounded-lg bg-navy-700/40 px-3 py-1.5 text-sm">
            <span className={jp ? "text-ink" : "text-cyan-soft"}>{it}</span>
            {!jp && ttsSupported() && (
              <button onClick={() => speak(it)} className="shrink-0 text-cyan-soft/70">
                <IconSpeaker width={14} height={14} />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BriefForm({ onSave }: { onSave: (b: ProjectBrief) => void }) {
  const [f, setF] = useState({
    clientName: "",
    industry: "",
    videoGoal: "",
    target: "",
    deadline: "",
    expectedQuestions: "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  const input = "w-full rounded-lg border border-white/10 bg-navy-700/60 px-3 py-2 text-sm text-ink focus:border-cyan-core focus:outline-none";

  return (
    <Panel className="space-y-2 p-4">
      <SectionTitle label="案件情報" sub="分かる範囲でOK。空欄は一般化して補完します。" />
      <input className={input} placeholder="クライアント名" value={f.clientName} onChange={set("clientName")} />
      <input className={input} placeholder="業界（例: 医療 / 飲食 / SaaS）" value={f.industry} onChange={set("industry")} />
      <input className={input} placeholder="動画の目的（例: build trust / drive inquiries）" value={f.videoGoal} onChange={set("videoGoal")} />
      <input className={input} placeholder="ターゲット（例: young customers）" value={f.target} onChange={set("target")} />
      <input className={input} placeholder="納期（任意・例: next Friday）" value={f.deadline} onChange={set("deadline")} />
      <textarea className={input} rows={2} placeholder="想定される質問（任意・改行/カンマ区切り）" value={f.expectedQuestions} onChange={set("expectedQuestions")} />
      <Button
        className="w-full"
        disabled={!f.clientName.trim()}
        onClick={() =>
          onSave({
            id: uid("prj"),
            clientName: f.clientName.trim(),
            industry: f.industry.trim(),
            videoGoal: f.videoGoal.trim(),
            target: f.target.trim(),
            deadline: f.deadline.trim() || undefined,
            expectedQuestions: f.expectedQuestions.trim() || undefined,
            createdAt: todayISO(),
          })
        }
      >
        登録して英語教材を生成
      </Button>
    </Panel>
  );
}
