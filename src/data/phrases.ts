import type { Phrase, PhraseCategory } from "@/types";
import { todayISO } from "@/lib/date";

// ============================================================
// 実務英語フレーズの種データ。
// 映像制作・営業・交渉に直結する表現に絞る（旅行英会話は入れない）。
// ============================================================

interface Seed {
  id: string;
  english: string;
  japanese: string;
  category: PhraseCategory;
}

const SEEDS: Seed[] = [
  // 会話を止めない（最優先）
  { id: "kg1", english: "Let me think for a second.", japanese: "少し考えさせてください。", category: "keep_going" },
  { id: "kg2", english: "You mean the intro part, right?", japanese: "冒頭の部分、ということですね？", category: "keep_going" },
  { id: "kg3", english: "Could you say that again, please?", japanese: "もう一度言っていただけますか？", category: "keep_going" },
  { id: "kg4", english: "In other words, you want it shorter.", japanese: "つまり、もっと短くしたいということですね。", category: "keep_going" },
  { id: "kg5", english: "Let me make sure I understand.", japanese: "認識を合わせさせてください。", category: "keep_going" },

  // 自己紹介
  { id: "in1", english: "I'm a video director based in Japan.", japanese: "日本を拠点にする映像ディレクターです。", category: "intro" },
  { id: "in2", english: "I make documentaries and YouTube content.", japanese: "ドキュメンタリーとYouTube動画を作っています。", category: "intro" },
  { id: "in3", english: "I handle everything from planning to editing.", japanese: "企画から編集まで一貫して担当します。", category: "intro" },

  // ポートフォリオ
  { id: "pf1", english: "This video was made for a local clinic.", japanese: "この動画は地域のクリニック向けに作りました。", category: "portfolio" },
  { id: "pf2", english: "The challenge was low brand awareness.", japanese: "課題は認知度の低さでした。", category: "portfolio" },
  { id: "pf3", english: "We focused on the founder's real story.", japanese: "創業者の実話に焦点を当てました。", category: "portfolio" },
  { id: "pf4", english: "It doubled their inquiry rate in a month.", japanese: "1か月で問い合わせが倍になりました。", category: "portfolio" },

  // ヒアリング
  { id: "he1", english: "What is the main goal of this video?", japanese: "この動画の一番の目的は何ですか？", category: "hearing" },
  { id: "he2", english: "Who is the target audience?", japanese: "ターゲットは誰ですか？", category: "hearing" },
  { id: "he3", english: "Could you tell me more specifically?", japanese: "もう少し具体的に教えていただけますか？", category: "hearing" },
  { id: "he4", english: "Let me confirm the purpose of the shoot.", japanese: "撮影の目的を確認させてください。", category: "hearing" },

  // 企画・演出
  { id: "pl1", english: "The main goal is to build trust.", japanese: "一番の狙いは信頼を作ることです。", category: "planning" },
  { id: "pl2", english: "We open with a question to hook viewers.", japanese: "視聴者を掴むために問いかけで始めます。", category: "planning" },
  { id: "pl3", english: "The story follows one day of the owner.", japanese: "オーナーの一日を追う構成です。", category: "planning" },

  // 撮影現場
  { id: "os1", english: "Can we get one more take?", japanese: "もう1テイクいけますか？", category: "on_set" },
  { id: "os2", english: "Please look at the camera and relax.", japanese: "カメラを見て、リラックスしてください。", category: "on_set" },
  { id: "os3", english: "Let's move to the next setup.", japanese: "次のセットアップに移りましょう。", category: "on_set" },

  // インタビュー
  { id: "iv1", english: "What made you start this work?", japanese: "この仕事を始めたきっかけは？", category: "interview" },
  { id: "iv2", english: "Can you describe that moment for me?", japanese: "その瞬間を説明してもらえますか？", category: "interview" },

  // 編集意図
  { id: "ed1", english: "I kept this part simple on purpose.", japanese: "この部分はあえてシンプルにしました。", category: "editing" },
  { id: "ed2", english: "This cut keeps the emotion going.", japanese: "このカットで感情を途切れさせません。", category: "editing" },

  // 修正対応
  { id: "rv1", english: "I can do that, but it affects the deadline.", japanese: "対応できますが、納期に影響します。", category: "revision" },
  { id: "rv2", english: "Which part exactly would you like to change?", japanese: "具体的にどの部分を変えたいですか？", category: "revision" },
  { id: "rv3", english: "Do you mean the color or the pacing?", japanese: "色のことですか、テンポのことですか？", category: "revision" },

  // 交渉
  { id: "ng1", english: "That's a bit above our usual rate.", japanese: "それは通常料金より少し低いです。", category: "negotiation" },
  { id: "ng2", english: "I can deliver by Friday if we lock the plan today.", japanese: "今日企画を固めれば金曜に納品できます。", category: "negotiation" },
  { id: "ng3", english: "Two rounds of revisions are included.", japanese: "修正は2回まで含まれます。", category: "negotiation" },

  // 雑談・関係構築
  { id: "st1", english: "How is the weather on your side?", japanese: "そちらの天気はどうですか？", category: "smalltalk" },
  { id: "st2", english: "It was great working with you.", japanese: "ご一緒できて良かったです。", category: "smalltalk" },
];

export function seedPhrases(): Phrase[] {
  const today = todayISO();
  return SEEDS.map((s) => ({
    id: s.id,
    english: s.english,
    japanese: s.japanese,
    category: s.category,
    source: "seed" as const,
    mastery: 0,
    reviewDate: today,
    mistakeCount: 0,
    createdAt: today,
  }));
}

export function phraseSeedById(id: string): Seed | undefined {
  return SEEDS.find((s) => s.id === id);
}

export const PHRASE_SEEDS = SEEDS;
