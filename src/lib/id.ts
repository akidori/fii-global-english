/** 衝突しにくい短いIDを生成する（クライアント/サーバ両用）。 */
export function uid(prefix = ""): string {
  const rnd = Math.random().toString(36).slice(2, 8);
  const t = Date.now().toString(36);
  return `${prefix}${prefix ? "_" : ""}${t}${rnd}`;
}
