# Fii Global English — 実装計画

> 目的: 中村諭律 が海外クライアントと英語で案件を獲得し、ヒアリング〜納品まで自力で完遂できる状態になる。
> 試験の点数ではなく「映像制作の実務で戦える英語」を鍛える。

## 設計の芯（迷ったらここに従う）

1. 海外で仕事ができること
2. 映像制作の実務で使えること
3. 会話を止めないこと（完璧さより継続）
4. 短い英語で伝えること（長い日本語思考を分割する訓練）
5. 音声で反復できること
6. 毎日続くこと
7. Fii との一貫した体験（ツンデレ・生意気だが成長に真剣・褒め→改善1つ）
8. デザインの美しさ（電脳／ホログラム世界観）

## 参考として取り込む要素

- **LAERNA AI**: シナリオ没入型のAI会話・即時フィードバック・自然な言い換え提示 → ロールプレイ + Rephrase 工程に反映
- **Duolingo**: ストリーク / XP / デイリーゴールリング / スキルパス / マスタリー(王冠) / マスコットの励まし → ゲーミフィケーション層に反映
- **LAB(flip-lab)**: 学習の進展とパーソナライズの外部記憶。MVPはLocalStorage完結だが、AIモードで `send_to_lab` / `recall_from_lab` に流す seam を用意（`lib/lab.ts`・`/api/*` 経由の将来接続）

## 技術構成

- Next.js 14 (App Router) / TypeScript strict / Tailwind / Zustand / Zod
- 永続: LocalStorage（`lib/storage.ts` に集約）→ 後で Supabase 差し替え可能
- モード: `mock`（APIキー不要で全機能動作） / `ai`（OpenAI）。AI失敗時は自動 mock フォールバック
- 音声: Web Speech API（STT/TTS）+ 非対応ブラウザ用フォールバック。TTSはサーバ経由(OpenAI)も選択可
- APIキーはフロントに書かない → `src/app/api/*` の Route Handler + 環境変数のみ

## 開発順序と対応MVP受け入れ基準

| Phase | 内容 | 受け入れ基準 |
|---|---|---|
| A 基盤 | 型/データモデル/Storage/UIプリミティブ/Fiiアバター/背景 | 永続、モック |
| B パーソナライズ | オンボーディング→profile保存→診断→結果→プラン生成→ダッシュボード | 5基準 |
| C 学習 | 今日のミッション/ロールプレイ/回答(text+voice)/TTS/評価/フレーズ保存/復習 | 8基準 |
| D AI接続 | /api/chat, /api/evaluate, /api/plan, /api/speech（mock既定・AI任意） | AI基準 |
| E 実案件 | 案件登録→教材生成（カンペ/想定質問/フォローアップ） | 発展 |

## データモデル（`src/types`）

UserProfile / Assessment / LearningPlan / LearningSession / Phrase / Scenario / ProjectBrief / Gamification(XP/streak/level)

## 画面（`src/app`）

page(router) / onboarding / assessment / dashboard / plan / mission / roleplay(+[id]) / phrases / review / progress / projects / settings

## 完了時に確認

lint / typecheck / build 緑 → README → 起動方法・環境変数・未実装項目を報告
