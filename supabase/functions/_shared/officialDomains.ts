/**
 * Official registrable domains used for lookalike detection.
 * Every entry verified against the organisation's own site, 2026-10-16.
 * Pure module: imported by the edge functions and by the Vitest suite.
 */

export const OFFICIAL_DOMAINS: string[] = [
  // Banks
  'onlinesbi.sbi',
  'sbi.co.in',
  'bank.sbi',
  'hdfcbank.com',
  'icicibank.com',
  'axisbank.com',
  'kotak.com',
  'pnbindia.in',
  'bankofbaroda.in',
  'bankofbaroda.co.in',
  'unionbankofindia.co.in',
  'canarabank.com',
  'idfcfirstbank.com',
  'yesbank.in',
  'indusind.com',
  // Payments
  'npci.org.in',
  'paytm.com',
  'phonepe.com',
  'pay.google.com',
  'bhimupi.org.in',
  // Government and regulators
  'rbi.org.in',
  'uidai.gov.in',
  'incometax.gov.in',
  'india.gov.in',
  'cybercrime.gov.in',
  'sancharsaathi.gov.in',
  'indiapost.gov.in',
  'epfindia.gov.in',
  'trai.gov.in',
  'pib.gov.in',
  'mygov.in',
  'nic.in',
  'gov.in',
];

/**
 * Brand and scheme keywords. A domain containing one of these while NOT being
 * an official domain is the single most common phishing pattern in India.
 */
export const BRAND_KEYWORDS: Array<{ keyword: string; brand: string }> = [
  { keyword: 'sbi', brand: 'State Bank of India' },
  { keyword: 'hdfc', brand: 'HDFC Bank' },
  { keyword: 'icici', brand: 'ICICI Bank' },
  { keyword: 'axisbank', brand: 'Axis Bank' },
  { keyword: 'axis-bank', brand: 'Axis Bank' },
  { keyword: 'kotak', brand: 'Kotak Mahindra Bank' },
  { keyword: 'pnb', brand: 'Punjab National Bank' },
  { keyword: 'bankofbaroda', brand: 'Bank of Baroda' },
  { keyword: 'npci', brand: 'NPCI' },
  { keyword: 'rbi', brand: 'Reserve Bank of India' },
  { keyword: 'uidai', brand: 'UIDAI' },
  { keyword: 'aadhaar', brand: 'Aadhaar' },
  { keyword: 'aadhar', brand: 'Aadhaar' },
  { keyword: 'kyc', brand: 'KYC' },
  { keyword: 'incometax', brand: 'Income Tax Department' },
  { keyword: 'income-tax', brand: 'Income Tax Department' },
  { keyword: 'paytm', brand: 'Paytm' },
  { keyword: 'phonepe', brand: 'PhonePe' },
  { keyword: 'gpay', brand: 'Google Pay' },
  { keyword: 'googlepay', brand: 'Google Pay' },
  { keyword: 'indiapost', brand: 'India Post' },
  { keyword: 'epfo', brand: 'EPFO' },
];

/** Multi-label public suffixes we need for Indian domains. */
const MULTI_LABEL_SUFFIXES = [
  'co.in', 'net.in', 'org.in', 'gen.in', 'firm.in', 'ind.in', 'gov.in',
  'ac.in', 'edu.in', 'res.in', 'nic.in', 'co.uk', 'org.uk', 'com.au',
];

/** The registrable domain, e.g. "a.b.sbi.co.in" -> "sbi.co.in". */
export function registrableDomain(hostname: string): string {
  const host = hostname.toLowerCase().replace(/\.$/, '').replace(/^www\./, '');
  const parts = host.split('.');
  if (parts.length <= 2) return host;

  const lastTwo = parts.slice(-2).join('.');
  if (MULTI_LABEL_SUFFIXES.includes(lastTwo)) {
    return parts.slice(-3).join('.');
  }
  return lastTwo;
}
