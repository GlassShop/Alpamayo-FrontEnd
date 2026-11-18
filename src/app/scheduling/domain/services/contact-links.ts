/**
 * Links that need no API key: WhatsApp click-to-chat (wa.me) and a Google
 * Maps search. Peruvian mobile numbers (9 digits starting with 9) get the
 * +51 country code.
 */

const PERU_CODE = '51';

/** Digits for wa.me: "943 111 222" → "51943111222"; returns null when it cannot be a phone. */
export function whatsappNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 9 && digits.startsWith('9')) return PERU_CODE + digits;
  if (digits.length === 11 && digits.startsWith(PERU_CODE)) return digits;
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

export function whatsappLink(phone: string, message: string): string | null {
  const number = whatsappNumber(phone);
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : null;
}

/** Google Maps search for the address, adding the city when it is not written. */
export function mapsLink(address: string, city?: string): string {
  const needsCity = city && !normalize(address).includes(normalize(city.split(',')[0]));
  const query = needsCity ? `${address}, ${city}` : address;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
