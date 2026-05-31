/**
 * Invoice formatting helpers — keep all numbers, dates, and serials in
 * Latin (English) digits with a unified, professional style.
 */

export const toEnDigits = (input: string | number | null | undefined): string => {
  if (input === null || input === undefined) return '';
  const s = String(input);
  return s
    .replace(/[\u0660-\u0669]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 48))
    .replace(/[\u06F0-\u06F9]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x06F0 + 48));
};

export const formatDateEn = (dateString?: string): string => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return toEnDigits(dateString);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
};

export const formatSerialEn = (serial?: string | number): string => toEnDigits(serial ?? '');

// Unified mono font stack for all numeric / serial / date values
export const NUMERIC_FONT =
  "'JetBrains Mono', 'SF Mono', Menlo, Consolas, 'Courier New', monospace";
