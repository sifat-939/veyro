import { t } from 'fyo';
import { dateKey } from './standardPrint';

export function normalizeCurrencyText(value: string | unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/৳\s*/g, 'Tk. ');
}

export function normalizePrintDate(date: string | Date | unknown): string {
  if (!date) return '';
  if (date instanceof Date) {
    if (Number.isNaN(date.valueOf())) return '';
    const key = dateKey(date);
    const d = new Date(key + 'T00:00:00');
    return Number.isNaN(d.valueOf())
      ? ''
      : d.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
  }
  if (typeof date === 'string') {
    const trimmed = date.trim();
    if (!trimmed) return '';
    const key = dateKey(trimmed);
    const d = new Date(key + 'T00:00:00');
    return Number.isNaN(d.valueOf())
      ? ''
      : d.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
  }
  if (typeof date === 'number' && Number.isFinite(date)) {
    return normalizePrintDate(new Date(date));
  }
  return '';
}

const ones = [
  '',
  t`One`,
  t`Two`,
  t`Three`,
  t`Four`,
  t`Five`,
  t`Six`,
  t`Seven`,
  t`Eight`,
  t`Nine`,
];

const teens = [
  t`Ten`,
  t`Eleven`,
  t`Twelve`,
  t`Thirteen`,
  t`Fourteen`,
  t`Fifteen`,
  t`Sixteen`,
  t`Seventeen`,
  t`Eighteen`,
  t`Nineteen`,
];

const tens = [
  '',
  '',
  t`Twenty`,
  t`Thirty`,
  t`Forty`,
  t`Fifty`,
  t`Sixty`,
  t`Seventy`,
  t`Eighty`,
  t`Ninety`,
];

const scales = ['', t`Thousand`, t`Million`, t`Billion`, t`Trillion`];

function convertThreeDigitNumber(num: number): string {
  let result = '';

  const hundredDigit = Math.floor(num / 100);
  const remainder = num % 100;

  if (hundredDigit > 0) {
    result += ones[hundredDigit] + ` ${t`Hundred`}`;
  }

  if (remainder > 0) {
    if (hundredDigit > 0) {
      result += ` ${t`And`} `;
    }

    if (remainder < 10) {
      result += ones[remainder];
    } else if (remainder < 20) {
      result += teens[remainder - 10];
    } else {
      const tensDigit = Math.floor(remainder / 10);
      const onesDigit = remainder % 10;
      result += tens[tensDigit];
      if (onesDigit > 0) {
        result += ' ' + ones[onesDigit];
      }
    }
  }

  return result;
}

function spellInteger(integerPart: string): string {
  let spelledOutInteger = '';
  const integerGroups = integerPart.match(/(\d{1,3})(?=(\d{3})*$)/g) || [];
  const groupCount = integerGroups.length;

  integerGroups.forEach((group, index) => {
    const groupValue = parseInt(group);

    if (groupValue > 0) {
      const groupText = convertThreeDigitNumber(groupValue);
      const groupSuffix = scales[groupCount - index - 1];
      spelledOutInteger +=
        groupText + (groupSuffix ? ' ' + groupSuffix : '') + ' ';
    }
  });

  return spelledOutInteger.trim() || t`Zero`;
}

const CURRENCY_UNITS: Record<string, { major: string; minor: string }> = {
  BDT: { major: 'Taka', minor: 'Paisa' },
  Taka: { major: 'Taka', minor: 'Paisa' },
  INR: { major: 'Rupees', minor: 'Paisa' },
  Rupees: { major: 'Rupees', minor: 'Paisa' },
  USD: { major: 'Dollars', minor: 'Cents' },
  Dollars: { major: 'Dollars', minor: 'Cents' },
  EUR: { major: 'Euros', minor: 'Cents' },
  Euros: { major: 'Euros', minor: 'Cents' },
  GBP: { major: 'GBP', minor: 'Pence' },
};

export function getGrandTotalInWords(total: number): string {
  const safeTotal = Math.abs(Number(total) || 0);
  const formattedTotal = safeTotal.toFixed(2);
  const [integerPart, decimalPart] = formattedTotal.split('.');

  const spelledOutInteger = spellInteger(integerPart);
  const decimalCents = parseInt(decimalPart);

  let spelledOutDecimal = '';
  if (decimalCents !== 0) {
    spelledOutDecimal =
      ` ${t`and`} ` + convertThreeDigitNumber(decimalCents) + ` ${t`Paisa`}`;
  }

  return `${spelledOutInteger}${spelledOutDecimal} ${t`only`}`;
}

export function wordsWithCurrency(
  total: number,
  currencyCode?: string,
  defaultCurrency?: string
): string;
export function wordsWithCurrency(
  total: number,
  currencyCode?: unknown,
  defaultCurrency?: string
): string {
  let code = currencyCode;
  let def = defaultCurrency;
  if (typeof code === 'object' && code !== null) {
    const fyoObj = code as {
      singles?: { SystemSettings?: { currency?: string } };
    };
    code = typeof def === 'string' ? def : undefined;
    def = fyoObj.singles?.SystemSettings?.currency;
  }
  const currency = ((typeof code === 'string' ? code : '') || def || '').trim();
  if (!currency) {
    return getGrandTotalInWords(total);
  }

  const currencyUnit = CURRENCY_UNITS[currency] || {
    major: currency,
    minor: 'Cents',
  };

  const safeTotal = Math.abs(Number(total) || 0);
  const formattedTotal = safeTotal.toFixed(2);
  const [integerPart, decimalPart] = formattedTotal.split('.');

  const spelledOutInteger = spellInteger(integerPart);
  const decimalCents = parseInt(decimalPart);

  if (decimalCents !== 0) {
    const spelledOutDecimal = convertThreeDigitNumber(decimalCents);
    return `${spelledOutInteger} ${
      currencyUnit.major
    } ${t`and`} ${spelledOutDecimal} ${currencyUnit.minor} ${t`Only`}`;
  }

  return `${spelledOutInteger} ${currencyUnit.major} ${t`Only`}`;
}
