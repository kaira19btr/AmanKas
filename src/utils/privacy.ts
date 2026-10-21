/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Masks a person's full name deterministically.
 * e.g., "Hendro Prayogo" -> "H***** P******"
 */
export function maskName(fullName: string, isMasked: boolean = true): string {
  if (!isMasked) return fullName;
  if (!fullName) return '';

  return fullName
    .split(' ')
    .map(part => {
      if (part.length <= 1) return part;
      // Keep title like Bpk., Ibu, Drs., S.E. untouched or mask body
      if (part.endsWith('.') && part.length <= 4) return part;
      const first = part[0];
      const stars = '*'.repeat(Math.max(1, part.length - 1));
      return `${first}${stars}`;
    })
    .join(' ');
}

/**
 * Masks an Indonesian NIK (16 digits).
 * e.g. "3273012908850002" -> "327301********02"
 */
export function maskNIK(nik: string, isMasked: boolean = true): string {
  if (!isMasked) return nik;
  if (!nik || nik.length < 8) return nik;
  const prefix = nik.slice(0, 6);
  const suffix = nik.slice(-2);
  const stars = '*'.repeat(Math.max(2, nik.length - 8));
  return `${prefix}${stars}${suffix}`;
}

/**
 * Masks a cooperative or bank account number.
 * e.g. "0182-993-110" -> "••••-•••-110"
 */
export function maskAccountNo(acc: string, isMasked: boolean = true): string {
  if (!isMasked) return acc;
  if (!acc || acc.length < 4) return acc;
  const suffix = acc.slice(-3);
  return `••••-•••-${suffix}`;
}
