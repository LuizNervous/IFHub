import { isSafeUrl } from "./isSafeUrl";

export function isSafeImageSrc(value) {
  if (typeof value !== "string" || value === "") return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;

  // Prévia do formulário: um "blob:" criado pelo PRÓPRIO navegador, e só da nossa própria origem.
  // (Dados vindos do banco nunca são blob:, então isto não abre nenhuma brecha.)
  if (typeof window !== "undefined" && value.startsWith(`blob:${window.location.origin}/`)) return true;

  return isSafeUrl(value);
}