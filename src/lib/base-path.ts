// GitHub Pages のサブパス（/fii-global-english）配下でも
// 生の <img src> や公開アセットが 404 しないよう、basePath を前置する。
// dev では空文字なので影響しない。
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** 公開アセットの絶対パスに basePath を付ける。例: asset("/fii/idle.png") */
export function asset(path: string): string {
  return `${BASE_PATH}${path}`;
}
