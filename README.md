# Fii Global English

中村諭律 専用・**海外案件で戦うための実務英会話コーチ**。
試験の点数ではなく、海外クライアントと英語で案件を獲得し、ヒアリング〜企画説明〜撮影指示〜修正対応〜価格交渉〜納品まで自力で完遂できる状態を目指す。マスコット兼AIコーチは **Fii**。

映像制作 / YouTube運用 / ドキュメンタリー / 営業 / 経営 の実務英語に特化。旅行英会話・単語暗記・文法ドリル中心にはしない。

## 起動方法

```bash
cd ~/fii-global-english
pnpm install          # 初回のみ
pnpm dev              # http://localhost:3000
```

本番ビルド:

```bash
pnpm build && pnpm start
```

検証コマンド:

```bash
pnpm typecheck        # tsc --noEmit
pnpm lint             # next lint
pnpm build            # 本番ビルド（型チェック込み）
```

## モード（APIキーなしで全機能が動く）

| モード | 内容 |
|---|---|
| `mock`（既定） | OpenAI キー不要。ローカルの評価エンジンで会話・採点・言い直し提示まで完結 |
| `ai` | OpenAI で会話生成・回答評価。キー未設定 or 失敗時は**自動で mock にフォールバック**（会話を止めない） |

設定 → 学習モードで切替。AIキーは**フロントに書かず**、サーバの環境変数 + `src/app/api/*` の Route Handler だけで扱う。

### 環境変数（`.env.example` 参照）

```
OPENAI_API_KEY=            # 未設定なら mock で全機能動作
OPENAI_MODEL=gpt-4o-mini
OPENAI_TTS_MODEL=gpt-4o-mini-tts
OPENAI_TTS_VOICE=alloy
NEXT_PUBLIC_DEFAULT_MODE=mock

# 任意: LAB(flip-lab / 第二の脳)連携。未設定なら安全に no-op
LAB_ENDPOINT=
LAB_TOKEN=
```

## 使い方の流れ

1. **オンボーディング**（6問）— 期限 / 週の学習時間 / 最初に英語化したい仕事 / 苦手 / 学習スタイル / 1日の負荷
2. **英語力診断**（9問）— 話す・説明・聞き取り・ビジネス応答・瞬間英作文・文法・語彙・発音。CEFR + 独自の実務レベル(Survival〜Global Project Lead)を判定
3. **学習プラン自動生成** — 弱点×重点シーンから重点スキル・配分・4フェーズ・週テーマを構成
4. **今日のミッション**（Warm Up → Key Phrase → Roleplay → Rephrase → Review）
5. **ロールプレイ**（2モード） — Fii がクライアント役
   - **テキストでじっくり**：回答すると毎ターン「伝わったこと→改善点1つ→自然な短文→次に加える情報」の順でコーチング
   - **ハンズフリー通話**：ボタン不要。マイク出しっぱなし→黙ると自動送信→Fii が音声で返答→マイク自動再開（電話のように継続）。Fii の発話はタップで割り込み(barge-in)可。**通話中はコーチングを出さず流し、終了後に「今日のふりかえり（改善点1つ＋詰まった表現の言い直し＋能力別スコア）」でまとめて返す**（＝会話を止めない原則）。Web Speech API、mock でも動作。音声認識非対応ブラウザは自動でテキストへ誘導
6. **復習** — 言えなかった/間違えた/遅かった表現を間隔反復（当日→翌日→3→7→14→30日）
7. **成長記録** — ストリーク・XP・レベル・学習量・能力別スコアを可視化
8. **実案件** — クライアント情報を入れると、その商談用の自己紹介・企画説明・想定質問・当日カンペ・お礼文を生成

## 技術構成

- Next.js 14 (App Router) / TypeScript(strict) / Tailwind CSS
- 状態: Zustand（`src/store/use-learning-store.ts`）
- 永続: LocalStorage（`src/lib/storage.ts` に集約。後で Supabase に差し替え可能）
- 音声: Web Speech API（STT/TTS）。非対応ブラウザはテキストへフォールバック。サーバTTS(OpenAI)も選択肢
- デザイン: Fii の電脳／ホログラム世界観（`fii-desktop` のカラーとスプライトを流用。UIは**絵文字禁止・SVGピクトグラムのみ**）

### ディレクトリ

```
src/
├── app/            # 画面 + api/(chat|evaluate|plan|speech)
├── components/     # fii / layout / ui / onboarding / assessment / learning / roleplay / progress
├── lib/            # storage, scoring, plan-generator, spaced-repetition, gamification,
│                   # mock-coach, coach-client, speech, material-generator, openai(server), lab(seam)
├── store/          # use-learning-store (Zustand)
├── data/           # scenarios / phrases / assessment / fii-lines
├── types/          # データモデルの正本
└── styles/
```

## Duolingo / LAERNA から取り込んだ要素

- **Duolingo**: ストリーク・XP・レベル・デイリーゴールリング・スキルパス・マスタリー(段階ドット)・マスコットの励まし・ストリークフリーズ
- **LAERNA AI**: シナリオ没入型のAI会話・即時フィードバック・自然な言い換え提示（ロールプレイ + Rephrase 工程）
- **LAB(flip-lab)**: 学習の進展/パーソナライズの外部記憶。AIモードで学習イベントを流す seam を `src/lib/lab.ts` に用意（本接続は MCP 側 `send_to_lab` / `recall_from_lab`）

## 現状と次の実装候補

**実装済み（MVP完了）**: オンボーディング / 診断 / プラン生成 / ダッシュボード / ロールプレイ(text+音声) / 読み上げ / コーチング評価 / フレーズ保存 / 間隔反復復習 / 成長記録 / 実案件教材生成 / mock・AI 両モード / LocalStorage永続。`typecheck` `lint` `build` すべて緑。

**次にやると効くもの**:
- 実案件の教材を AI(`/api/plan` 拡張)で案件文脈に寄せて生成
- 発音採点（録音波形 or 音声認識の一致率）の本実装
- LAB 実接続（学習傾向を診断・プランに反映）
- Supabase 化とマルチデバイス同期
- スキルパスの「王冠(mastery)」到達演出
