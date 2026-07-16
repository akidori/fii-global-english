import { SCENARIOS } from "@/data/scenarios";
import { RoleplayClient } from "./RoleplayClient";

// 静的書き出し(output: export)向け: 全シナリオIDを事前生成する。
export function generateStaticParams() {
  return SCENARIOS.map((s) => ({ id: s.id }));
}

export const dynamicParams = false;

export default function Page() {
  return <RoleplayClient />;
}
