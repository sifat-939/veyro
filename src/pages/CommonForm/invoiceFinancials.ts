import { Fyo } from 'fyo';
import { Money } from 'pesa';
import {
  calculateInvoiceFinancialAmounts,
  type InvoiceFinancialAmounts,
} from 'models/baseModels/Invoice/Invoice';

export interface InvoiceFinancialSource {
  baseGrandTotal?: Money;
  outstandingAmount?: Money;
  isSubmitted?: boolean;
  isCancelled?: boolean;
  submitted?: number | boolean;
  cancelled?: number | boolean;
  getFinancialAmounts?: () => InvoiceFinancialAmounts;
}

export { calculateInvoiceFinancialAmounts };
export type { InvoiceFinancialAmounts };

export function getInvoiceFinancialAmounts(
  invoice: InvoiceFinancialSource | null | undefined,
  fyo: Fyo
): InvoiceFinancialAmounts {
  if (typeof invoice?.getFinancialAmounts === 'function') {
    return invoice.getFinancialAmounts();
  }
  return calculateInvoiceFinancialAmounts(invoice!, fyo);
}
