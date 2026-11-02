import { Fyo } from 'fyo';
import { Doc } from 'fyo/model/doc';
import {
  Action,
  FiltersMap,
  FormulaMap,
  ListViewSettings,
  ValidationMap,
} from 'fyo/model/types';
import {
  validateEmail,
  validatePhoneNumber,
} from 'fyo/model/validationFunction';
import { Money } from 'pesa';
import { PartyRole } from './types';
import { ModelNameEnum } from 'models/types';
import { isLoyaltyProgramExpiredAndMaxed } from 'models/helpers';

export class Party extends Doc {
  role?: PartyRole;
  party?: string;
  fromLead?: string;
  defaultAccount?: string;
  loyaltyPoints?: number;
  outstandingAmount?: Money;
  async updateOutstandingAmount() {
    /**
     * If Role === "Both" then outstanding Amount
     * will be the net amount (receivable - payable).
     * Direct payments without invoice allocations are factored into
     * running party outstanding so invoice matching is never required.
     */

    const role = this.role as PartyRole;
    let outstandingAmount = this.fyo.pesa(0);

    if (role === 'Customer') {
      const outstandingReceive = await this._getTotalOutstandingAmount(
        'SalesInvoice'
      );
      const unallocatedReceive = await this._getUnallocatedPaymentAmount(
        'Receive'
      );
      const unallocatedPay = await this._getUnallocatedPaymentAmount('Pay');
      outstandingAmount = outstandingAmount
        .add(outstandingReceive)
        .sub(unallocatedReceive)
        .add(unallocatedPay);
    }

    if (role === 'Supplier') {
      const outstandingPay = await this._getTotalOutstandingAmount(
        'PurchaseInvoice'
      );
      const unallocatedPay = await this._getUnallocatedPaymentAmount('Pay');
      const unallocatedReceive = await this._getUnallocatedPaymentAmount(
        'Receive'
      );
      outstandingAmount = outstandingAmount
        .add(outstandingPay)
        .sub(unallocatedPay)
        .add(unallocatedReceive);
    }

    if (role === 'Both') {
      const outstandingReceive = await this._getTotalOutstandingAmount(
        'SalesInvoice'
      );
      const unallocatedReceive = await this._getUnallocatedPaymentAmount(
        'Receive'
      );
      const netReceivable = outstandingReceive.sub(unallocatedReceive);

      const outstandingPay = await this._getTotalOutstandingAmount(
        'PurchaseInvoice'
      );
      const unallocatedPay = await this._getUnallocatedPaymentAmount('Pay');
      const netPayable = outstandingPay.sub(unallocatedPay);

      outstandingAmount = netReceivable.sub(netPayable);
    }

    await this.setAndSync({ outstandingAmount });
  }

  async updateLoyaltyPoints() {
    let loyaltyPoints = 0;

    if (this.role === 'Customer' || this.role === 'Both') {
      loyaltyPoints = await this._getTotalLoyaltyPoints();
    }

    await this.setAndSync({ loyaltyPoints });
  }

  async _getTotalLoyaltyPoints() {
    const loyaltyProgramName = this.loyaltyProgram as string;
    if (loyaltyProgramName) {
      const isExpiredAndMaxed = await isLoyaltyProgramExpiredAndMaxed(
        this.fyo,
        loyaltyProgramName
      );
      if (isExpiredAndMaxed) {
        return 0;
      }
    }

    const data = (await this.fyo.db.getAll(ModelNameEnum.LoyaltyPointEntry, {
      fields: ['name', 'loyaltyPoints', 'expiryDate', 'postingDate'],
      filters: {
        customer: this.name as string,
      },
    })) as {
      name: string;
      loyaltyPoints: number;
      expiryDate: Date;
      postingDate: Date;
    }[];

    const totalLoyaltyPoints = data.reduce((total, entry) => {
      if (entry.expiryDate > entry.postingDate) {
        return total + entry.loyaltyPoints;
      }

      return total;
    }, 0);

    return totalLoyaltyPoints;
  }

  async _getTotalOutstandingAmount(
    schemaName: 'SalesInvoice' | 'PurchaseInvoice'
  ) {
    const outstandingAmounts = await this.fyo.db.getAllRaw(schemaName, {
      fields: ['outstandingAmount'],
      filters: {
        submitted: true,
        cancelled: false,
        party: this.name as string,
      },
    });

    return outstandingAmounts
      .map(({ outstandingAmount }) =>
        this.fyo.pesa(outstandingAmount as number)
      )
      .reduce((a, b) => a.add(b), this.fyo.pesa(0));
  }

  async _getUnallocatedPaymentAmount(
    paymentType: 'Receive' | 'Pay'
  ): Promise<Money> {
    const payments = (await this.fyo.db.getAllRaw(ModelNameEnum.Payment, {
      fields: ['name', 'amount'],
      filters: {
        submitted: true,
        cancelled: false,
        party: this.name as string,
        paymentType,
      },
    })) as Array<{ name: string; amount: number }>;

    if (!payments.length) {
      return this.fyo.pesa(0);
    }

    const paymentNames = payments.map((p) => String(p.name));
    const allocations = (await this.fyo.db.getAllRaw(ModelNameEnum.PaymentFor, {
      fields: ['parent', 'amount'],
      filters: {
        parent: ['in', paymentNames],
      },
    })) as Array<{ parent: string; amount: number }>;

    const allocatedByPayment = new Map<string, Money>();
    for (const alloc of allocations) {
      const parent = String(alloc.parent);
      const amt = this.fyo.pesa(alloc.amount ?? 0);
      const current = allocatedByPayment.get(parent) || this.fyo.pesa(0);
      allocatedByPayment.set(parent, current.add(amt));
    }

    let unallocatedTotal = this.fyo.pesa(0);
    for (const p of payments) {
      const totalAmt = this.fyo.pesa(p.amount ?? 0);
      const allocatedAmt =
        allocatedByPayment.get(String(p.name)) || this.fyo.pesa(0);
      const unallocated = totalAmt.sub(allocatedAmt);
      if (unallocated.gt(0)) {
        unallocatedTotal = unallocatedTotal.add(unallocated);
      }
    }

    return unallocatedTotal;
  }

  formulas: FormulaMap = {
    defaultAccount: {
      formula: async () => {
        const role = this.role as PartyRole;
        if (role === 'Both') {
          return '';
        }

        let accountName = 'Debtors';
        if (role === 'Supplier') {
          accountName = 'Creditors';
        }

        const accountExists = await this.fyo.db.exists('Account', accountName);
        return accountExists ? accountName : '';
      },
      dependsOn: ['role'],
    },
    currency: {
      formula: () => {
        if (!this.currency) {
          return this.fyo.singles.SystemSettings!.currency as string;
        }
      },
    },
  };

  validations: ValidationMap = {
    email: validateEmail,
    phone: validatePhoneNumber,
  };

  static filters: FiltersMap = {
    defaultAccount: (doc: Doc) => {
      const role = doc.role as PartyRole;
      if (role === 'Both') {
        return {
          isGroup: false,
          accountType: ['in', ['Payable', 'Receivable']],
        };
      }

      return {
        isGroup: false,
        accountType: role === 'Customer' ? 'Receivable' : 'Payable',
      };
    },
  };

  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['name', 'email', 'phone', 'outstandingAmount'],
    };
  }

  async afterDelete() {
    await super.afterDelete();
    if (!this.fromLead) {
      return;
    }
    const leadData = await this.fyo.doc.getDoc(ModelNameEnum.Lead, this.name);
    await leadData.setAndSync('status', 'Interested');
  }

  async afterSync() {
    await super.afterSync();
    if (!this.fromLead) {
      return;
    }

    const leadData = await this.fyo.doc.getDoc(ModelNameEnum.Lead, this.name);
    await leadData.setAndSync('status', 'Converted');
  }

  static getActions(fyo: Fyo): Action[] {
    return [
      {
        label: fyo.t`Create Purchase`,
        condition: (doc: Doc) =>
          !doc.notInserted && (doc.role as PartyRole) !== 'Customer',
        action: async (partyDoc, router) => {
          const doc = fyo.doc.getNewDoc('PurchaseInvoice', {
            party: partyDoc.name,
            account: partyDoc.defaultAccount as string,
          });

          await router.push({
            path: `/edit/PurchaseInvoice/${doc.name!}`,
            query: {
              schemaName: 'PurchaseInvoice',
              values: {
                // @ts-ignore
                party: partyDoc.name!,
              },
            },
          });
        },
      },
      {
        label: fyo.t`View Purchases`,
        condition: (doc: Doc) =>
          !doc.notInserted && (doc.role as PartyRole) !== 'Customer',
        action: async (partyDoc, router) => {
          await router.push({
            path: '/list/PurchaseInvoice',
            query: { filters: JSON.stringify({ party: partyDoc.name }) },
          });
        },
      },
      {
        label: fyo.t`Create Sale`,
        condition: (doc: Doc) =>
          !doc.notInserted && (doc.role as PartyRole) !== 'Supplier',
        action: async (partyDoc, router) => {
          const doc = fyo.doc.getNewDoc('SalesInvoice', {
            party: partyDoc.name,
            account: partyDoc.defaultAccount as string,
          });

          await router.push({
            path: `/edit/SalesInvoice/${doc.name!}`,
            query: {
              schemaName: 'SalesInvoice',
              values: {
                // @ts-ignore
                party: partyDoc.name!,
              },
            },
          });
        },
      },
      {
        label: fyo.t`View Sales`,
        condition: (doc: Doc) =>
          !doc.notInserted && (doc.role as PartyRole) !== 'Supplier',
        action: async (partyDoc, router) => {
          await router.push({
            path: '/list/SalesInvoice',
            query: { filters: JSON.stringify({ party: partyDoc.name }) },
          });
        },
      },
    ];
  }
}
