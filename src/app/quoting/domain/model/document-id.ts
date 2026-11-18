/** Peruvian identity documents accepted on a quote. */
export type DocType = 'DNI' | 'RUC';

const RUC_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2] as const;
/** First two digits SUNAT assigns: natural persons (10), non-domiciled (15, 17), others (16), companies (20). */
const RUC_PREFIXES = ['10', '15', '16', '17', '20'] as const;

/** Keeps only digits: " 4321-0987 " → "43210987". */
export function cleanDocNumber(raw: string): string {
  return raw.replace(/\D/g, '');
}

/** Document type implied by the length: 8 digits → DNI, 11 → RUC. */
export function docTypeOf(number: string): DocType | null {
  const digits = cleanDocNumber(number);
  return digits.length === 8 ? 'DNI' : digits.length === 11 ? 'RUC' : null;
}

export function isValidDni(number: string): boolean {
  return /^\d{8}$/.test(number);
}

/** RUC with a known prefix and a correct SUNAT check digit (modulo 11). */
export function isValidRuc(number: string): boolean {
  if (!/^\d{11}$/.test(number) || !(RUC_PREFIXES as readonly string[]).includes(number.slice(0, 2))) return false;
  return rucCheckDigit(number.slice(0, 10)) === Number(number[10]);
}

export function isValidDocument(type: DocType, number: string): boolean {
  return type === 'DNI' ? isValidDni(number) : isValidRuc(number);
}

/** SUNAT check digit for the first 10 digits of a RUC. */
export function rucCheckDigit(first10: string): number {
  const sum = [...first10].reduce((acc, d, i) => acc + Number(d) * RUC_WEIGHTS[i], 0);
  const digit = 11 - (sum % 11);
  return digit === 10 ? 0 : digit === 11 ? 1 : digit;
}
