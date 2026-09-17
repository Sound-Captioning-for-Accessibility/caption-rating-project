export const RGT_BASE = "/rgt";

export function rgtRoute(path: string) {
  if (path === "/") return RGT_BASE;
  return `${RGT_BASE}${path}`;
}
