export const VIETNAMESE_PHONE_REGEX = /^(03|05|07|08|09)[0-9]{8}$/;

export function normalizePhoneNumber(phone) {
  return String(phone || "").trim().replace(/\s+/g, "");
}

export function isValidVietnamesePhone(phone) {
  return VIETNAMESE_PHONE_REGEX.test(normalizePhoneNumber(phone));
}

export function getVietnamesePhoneErrorMessage() {
  return "So dien thoai khong hop le. Vui long nhap 10 so, bat dau bang 03, 05, 07, 08 hoac 09.";
}
