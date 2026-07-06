const generateCode = (): string => {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
};

export const generateUniqueCodes = (quantity: number): string[] => {
  const codes = new Set<string>();
  while (codes.size < quantity) {
    codes.add(generateCode());
  }
  return Array.from(codes);
};

export const parseCodesFromText = (text: string): string[] =>
  text
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
