export function maskAadhaar(value: string) {
  return `XXXX XXXX ${value.slice(-4)}`;
}
