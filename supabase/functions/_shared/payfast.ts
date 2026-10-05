import { createHash, timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";

export function payfastConfig(getEnv: (name: string) => string | undefined) {
  const mode = (getEnv("PAYFAST_SANDBOX") ?? "true").trim().toLowerCase();
  if (mode !== "true" && mode !== "false") throw new Error("Invalid PAYFAST_SANDBOX setting");
  const merchantId = getEnv("PAYFAST_MERCHANT_ID")?.trim();
  const merchantKey = getEnv("PAYFAST_MERCHANT_KEY")?.trim();
  if (!merchantId || !merchantKey) throw new Error("Missing PayFast merchant configuration");
  const passphrase = getEnv("PAYFAST_PASSPHRASE") || undefined;
  if (passphrase && passphrase !== passphrase.trim()) throw new Error("Remove surrounding whitespace from PAYFAST_PASSPHRASE");
  return { merchantId, merchantKey, passphrase, host: mode === "true" ? "sandbox.payfast.co.za" : "www.payfast.co.za" };
}

// PHP urlencode-compatible encoding, as PayFast expects.
export const pfEncode = (value: string) =>
  encodeURIComponent(value)
    .replace(/[!'()*~]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase())
    .replace(/%20/g, "+");

export const pfSignature = (pairs: [string, string][], passphrase?: string) => {
  let str = pairs
    .filter(([k, v]) => k !== "signature" && v !== "")
    .map(([k, v]) => `${k}=${pfEncode(v.trim())}`)
    .join("&");
  if (passphrase) str += `&passphrase=${pfEncode(passphrase.trim())}`;
  return createHash("md5").update(str).digest("hex");
};

// ITNs differ from checkout forms: preserve ALL received values, including
// blanks and whitespace, in their received order. Never use pfSignature here.
export const pfItnParameterString = (pairs: [string, string][]) => pairs
  .filter(([key]) => key !== "signature")
  .map(([key, value]) => `${key}=${pfEncode(value)}`)
  .join("&");

export const pfItnSignature = (parameterString: string, passphrase?: string) =>
  createHash("md5").update(parameterString + (passphrase ? `&passphrase=${pfEncode(passphrase)}` : "")).digest("hex");

export function validItnSignature(parameterString: string, received: string, passphrase?: string) {
  if (!/^[a-f0-9]{32}$/.test(received)) return false;
  return timingSafeEqual(Buffer.from(pfItnSignature(parameterString, passphrase), "hex"), Buffer.from(received, "hex"));
}

export function amountInCents(value: unknown): number | null {
  const text = String(value ?? "");
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ""] = text.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}
