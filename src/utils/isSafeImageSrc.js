import { isSafeUrl } from "./isSafeUrl";

export function isSafeImageSrc(value) {
  if (typeof value !== "string" || value === "") return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  return isSafeUrl(value);
}