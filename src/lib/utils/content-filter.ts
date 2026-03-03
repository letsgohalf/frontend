/**
 * Phone number detection utility.
 *
 * Detects phone numbers even when users try to obfuscate them by:
 * - Using written-out number words ("zero eight zero …")
 * - Using letter substitutions (O→0, I/l→1)
 * - Adding separators ("0-8-0-3-4-5-6-7-8-9-0")
 * - Mixing strategies ("oh eight O three 456 7890")
 */

const NUMBER_WORDS: [RegExp, string][] = [
  [/\bzero\b/gi, '0'],
  [/\bone\b/gi, '1'],
  [/\btwo\b/gi, '2'],
  [/\bthree\b/gi, '3'],
  [/\bfour\b/gi, '4'],
  [/\bfive\b/gi, '5'],
  [/\bsix\b/gi, '6'],
  [/\bseven\b/gi, '7'],
  [/\beight\b/gi, '8'],
  [/\bnine\b/gi, '9'],
  [/\boh\b/gi, '0'],
];

// Separators people use between digits (NOT comma — to avoid matching prices like 1,500,000)
const SEP = '[\\s\\-\\.\\/\\(\\)_|]*';
const DIGIT_CLUSTER = new RegExp(`(\\d${SEP}){7,}`, '');

/**
 * Strip obvious monetary values so they don't create false positives.
 */
function maskMonetaryValues(text: string): string {
  let t = text;
  t = t.replace(/[₦$]\s*[\d,]+/g, ' ');
  t = t.replace(
    /(?:budget|rent|price|cost|pay|deposit|naira|dollars?|per\s*month|monthly|annually|p\.?m)\s*:?\s*[\d,]+/gi,
    ' ',
  );
  t = t.replace(/\d[\d,]*\s*(?:naira|ngn|usd|k\b)/gi, ' ');
  return t;
}

function replaceNumberWords(text: string): string {
  let t = text;
  for (const [pattern, digit] of NUMBER_WORDS) {
    t = t.replace(pattern, digit);
  }
  return t;
}

function replaceLetterSubstitutions(text: string): string {
  let t = text;
  for (let i = 0; i < 4; i++) {
    t = t.replace(/[oO](?=[\s\-\.]*\d)/g, '0');
    t = t.replace(/(\d[\s\-\.]*)([oO])/g, '$10');
    t = t.replace(/[lI](?=[\s\-\.]*\d)/g, '1');
    t = t.replace(/(\d[\s\-\.]*)([lI])/g, '$11');
  }
  return t;
}

/**
 * Returns true if the text appears to contain a phone number.
 */
export function containsPhoneNumber(text: string): boolean {
  if (!text) return false;

  // Pass 1: obvious international / Nigerian patterns
  if (/\+\s*2\s*3\s*4/.test(text)) return true;
  if (/0\s*[789]\s*0[\s\-\.]*\d[\s\-\.]*\d[\s\-\.]*\d[\s\-\.]*\d[\s\-\.]*\d[\s\-\.]*\d[\s\-\.]*\d/.test(text)) return true;

  // Pass 2: strip monetary values, then look for digit clusters
  const cleaned = maskMonetaryValues(text);
  if (DIGIT_CLUSTER.test(cleaned)) return true;

  // Pass 3: normalise (word numbers + letter subs) then re-check
  let normalized = replaceNumberWords(cleaned);
  normalized = replaceLetterSubstitutions(normalized);
  if (DIGIT_CLUSTER.test(normalized)) return true;

  // Pass 4: context-based detection
  const contextPattern =
    /(?:call\s*me|my\s*(?:number|digits?|no)|whatsapp|text\s*me|reach\s*me|contact\s*me|hit\s*me\s*up|hmu|ping\s*me)[\s:@\-]*(.{3,30})/i;
  const contextMatch = normalized.match(contextPattern);
  if (contextMatch) {
    const after = replaceLetterSubstitutions(replaceNumberWords(contextMatch[1]));
    const digits = after.replace(/[^\d]/g, '');
    if (digits.length >= 5) return true;
  }

  return false;
}

export const PHONE_NUMBER_ERROR = 'Sharing phone numbers is not allowed. Please use the in-app messaging to communicate.';
