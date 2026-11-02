<template>
  <div class="h-screen flex flex-col w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden" style="width: var(--w-desk)">
    <!-- Header -->
    <PageHeader :title="t`Dashboard`">
      <template #left>
        <div class="inline-flex p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <button
            v-for="opt in periodOptions"
            :key="opt.value"
            class="px-3 py-1 text-xs font-medium rounded-md transition-all duration-150"
            :class="period === opt.value
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs font-semibold'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'"
            @click="setPeriod(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </template>

      <div class="flex items-center gap-2">
        <Button
          type="secondary"
          class="gap-1.5 border border-gray-200 text-xs dark:border-gray-700 px-2.5 shadow-xs"
          :disabled="loading"
          @click="loadData"
        >
          <feather-icon
            name="refresh-cw"
            class="h-3.5 w-3.5"
            :class="{ 'animate-spin-custom': loading }"
          />
        </Button>

        <Button
          type="primary"
          class="gap-1.5 text-xs font-semibold px-3 shadow-xs"
          @click="createNewSale"
        >
          <feather-icon name="plus" class="h-3.5 w-3.5" />
          <span>{{ t`Sale` }}</span>
        </Button>

        <Button
          type="secondary"
          class="gap-1.5 border border-gray-200 text-xs dark:border-gray-700 px-3 shadow-xs"
          @click="createNewPurchase"
        >
          <feather-icon name="plus" class="h-3.5 w-3.5" />
          <span>{{ t`Purchase` }}</span>
        </Button>
      </div>
    </PageHeader>

    <!-- Main Content -->
    <div
      class="flex-1 no-scrollbar overflow-y-auto p-4 lg:p-6 space-y-4 bg-gray-50 dark:bg-gray-900"
      style="height: calc(100vh - var(--h-row-largest) - 1px)"
    >
      <div class="max-w-7xl mx-auto space-y-4">
        <!-- 1. KPI Cards Grid -->
        <section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
          <!-- Sales -->
          <div
            class="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-875 shadow-xs hover:border-gray-300 dark:hover:border-gray-700 transition cursor-pointer flex flex-col justify-between"
            @click="routeTo('/list/SalesInvoice')"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t`Sales` }}</span>
              <span class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                {{ periodLabel }}
              </span>
            </div>
            <div class="mt-3">
              <div class="text-2xl font-bold font-mono tracking-tight text-gray-900 dark:text-white">
                {{ formatMoney(metrics.totalSales) }}
              </div>
              <div class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {{ metrics.salesCount }} {{ t`invoices` }}
              </div>
            </div>
          </div>

          <!-- Purchases -->
          <div
            class="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-875 shadow-xs hover:border-gray-300 dark:hover:border-gray-700 transition cursor-pointer flex flex-col justify-between"
            @click="routeTo('/list/PurchaseInvoice')"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t`Purchases` }}</span>
              <span class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                {{ periodLabel }}
              </span>
            </div>
            <div class="mt-3">
              <div class="text-2xl font-bold font-mono tracking-tight text-gray-900 dark:text-white">
                {{ formatMoney(metrics.totalPurchases) }}
              </div>
              <div class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {{ metrics.purchaseCount }} {{ t`bills` }}
              </div>
            </div>
          </div>

          <!-- Receivables -->
          <div
            class="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-875 shadow-xs hover:border-gray-300 dark:hover:border-gray-700 transition cursor-pointer flex flex-col justify-between"
            @click="routeToUnpaid('SalesInvoice')"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t`Receivables` }}</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
                {{ t`Due` }}
              </span>
            </div>
            <div class="mt-3">
              <div class="text-2xl font-bold font-mono tracking-tight text-amber-600 dark:text-amber-400">
                {{ formatMoney(period === 'all' ? metrics.allTimeReceivables : metrics.periodReceivables) }}
              </div>
              <div class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {{ metrics.allTimeUnpaidSalesCount }} {{ t`unpaid invoices` }}
              </div>
            </div>
          </div>

          <!-- Payables -->
          <div
            class="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-875 shadow-xs hover:border-gray-300 dark:hover:border-gray-700 transition cursor-pointer flex flex-col justify-between"
            @click="routeToUnpaid('PurchaseInvoice')"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t`Payables` }}</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60">
                {{ t`Due` }}
              </span>
            </div>
            <div class="mt-3">
              <div class="text-2xl font-bold font-mono tracking-tight text-rose-600 dark:text-rose-400">
                {{ formatMoney(period === 'all' ? metrics.allTimePayables : metrics.periodPayables) }}
              </div>
              <div class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {{ metrics.allTimeUnpaidPurchasesCount }} {{ t`unpaid bills` }}
              </div>
            </div>
          </div>
        </section>

        <!-- 2. Cash & Bank Liquid Balance Bar -->
        <section class="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-875 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center">
              <feather-icon name="dollar-sign" class="w-4 h-4" />
            </div>
            <div>
              <div class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t`Cash & Bank` }}</div>
              <div class="text-xl font-bold font-mono text-gray-900 dark:text-white mt-0.5">
                {{ formatMoney(totalLiquid) }}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-4 text-xs">
            <div class="flex items-center gap-1.5">
              <span class="text-gray-400 dark:text-gray-500">{{ t`Cash:` }}</span>
              <span class="font-mono font-semibold text-gray-800 dark:text-gray-200">{{ formatMoney(totalCash) }}</span>
            </div>
            <div class="w-px h-3.5 bg-gray-200 dark:bg-gray-700" />
            <div class="flex items-center gap-1.5">
              <span class="text-gray-400 dark:text-gray-500">{{ t`Bank:` }}</span>
              <span class="font-mono font-semibold text-gray-800 dark:text-gray-200">{{ formatMoney(totalBank) }}</span>
            </div>
            <button
              class="ml-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
              @click="routeTo('/bank-cash')"
            >
              {{ t`View Accounts →` }}
            </button>
          </div>
        </section>

        <!-- 3. Recent Transactions Table -->
        <section class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-875 shadow-xs overflow-hidden">
          <div class="p-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 class="text-xs font-semibold text-gray-900 dark:text-white">
              {{ t`Recent Transactions` }}
            </h2>

            <div class="inline-flex p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                class="px-2.5 py-0.5 text-xs font-medium rounded-md transition"
                :class="activeTxTab === 'all'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'"
                @click="activeTxTab = 'all'"
              >
                {{ t`All` }}
              </button>
              <button
                class="px-2.5 py-0.5 text-xs font-medium rounded-md transition"
                :class="activeTxTab === 'sales'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'"
                @click="activeTxTab = 'sales'"
              >
                {{ t`Sales` }}
              </button>
              <button
                class="px-2.5 py-0.5 text-xs font-medium rounded-md transition"
                :class="activeTxTab === 'purchases'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'"
                @click="activeTxTab = 'purchases'"
              >
                {{ t`Purchases` }}
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/50 text-gray-400 dark:text-gray-500 font-medium">
                  <th class="py-2.5 px-4">{{ t`Date` }}</th>
                  <th class="py-2.5 px-4">{{ t`Number` }}</th>
                  <th class="py-2.5 px-4">{{ t`Party` }}</th>
                  <th class="py-2.5 px-4">{{ t`Type` }}</th>
                  <th class="py-2.5 px-4 text-right">{{ t`Amount` }}</th>
                  <th class="py-2.5 px-4 text-center">{{ t`Status` }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                <tr
                  v-for="tx in displayedTransactions"
                  :key="tx.schemaName + tx.name"
                  class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition cursor-pointer"
                  @click="openTransaction(tx)"
                >
                  <td class="py-2.5 px-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {{ formatDate(tx.date) }}
                  </td>
                  <td class="py-2.5 px-4 font-mono font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    {{ tx.name }}
                  </td>
                  <td class="py-2.5 px-4 text-gray-800 dark:text-gray-200 max-w-xs truncate">
                    {{ tx.party || '—' }}
                  </td>
                  <td class="py-2.5 px-4 whitespace-nowrap">
                    <span
                      class="px-2 py-0.5 rounded text-[10px] font-semibold border inline-block"
                      :class="tx.type === 'Sale'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'"
                    >
                      {{ tx.type }}
                    </span>
                  </td>
                  <td class="py-2.5 px-4 text-right font-mono font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                    {{ formatMoney(tx.amount) }}
                  </td>
                  <td class="py-2.5 px-4 text-center whitespace-nowrap">
                    <span
                      class="px-2 py-0.5 rounded-full text-[10px] font-medium border inline-block"
                      :class="getStatusBadgeClass(tx.status)"
                    >
                      {{ tx.statusLabel }}
                    </span>
                  </td>
                </tr>
                <tr v-if="displayedTransactions.length === 0">
                  <td colspan="6" class="py-8 text-center text-gray-400 dark:text-gray-500 text-xs">
                    {{ t`No transactions found.` }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="p-3 bg-gray-50/50 dark:bg-gray-850/40 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
            <span>{{ displayedTransactions.length }} {{ t`transactions` }}</span>
            <div class="flex items-center gap-4">
              <button class="hover:text-blue-600 dark:hover:text-blue-400" @click="routeTo('/list/SalesInvoice')">
                {{ t`View Sales →` }}
              </button>
              <button class="hover:text-blue-600 dark:hover:text-blue-400" @click="routeTo('/list/PurchaseInvoice')">
                {{ t`View Purchases →` }}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, shallowRef } from 'vue';
import PageHeader from 'src/components/PageHeader.vue';
import Button from 'src/components/Button.vue';
import { fyo } from 'src/initFyo';
import { docsPathRef } from 'src/utils/refs';
import { routeTo, getFormRoute } from 'src/utils/ui';
import { getBankCashBalances, BankCashBalance } from 'src/utils/bankCash';
import { DateTime } from 'luxon';
import type { RawValueMap } from 'fyo/core/types';
import type { Money } from 'pesa';

export type PeriodType = 'today' | 'month' | 'year' | 'all';
export type TxTabType = 'all' | 'sales' | 'purchases';

export interface DashboardTransaction {
  schemaName: 'SalesInvoice' | 'PurchaseInvoice';
  name: string;
  party: string;
  date: string;
  type: 'Sale' | 'Purchase';
  amount: number;
  outstanding: number;
  status: 'PAID' | 'UNPAID' | 'PARTIAL' | 'DRAFT' | 'CANCELLED';
  statusLabel: string;
}

export interface DashboardMetrics {
  totalSales: number;
  salesCount: number;
  totalPurchases: number;
  purchaseCount: number;
  periodReceivables: number;
  periodUnpaidSalesCount: number;
  allTimeReceivables: number;
  allTimeUnpaidSalesCount: number;
  periodPayables: number;
  periodUnpaidPurchasesCount: number;
  allTimePayables: number;
  allTimeUnpaidPurchasesCount: number;
}

function isDocCancelled(doc: RawValueMap): boolean {
  return doc.cancelled === true || doc.cancelled === 1 || doc.cancelled === '1';
}

function isDocSubmitted(doc: RawValueMap): boolean {
  return doc.submitted === true || doc.submitted === 1 || doc.submitted === '1';
}

function isDocInPeriod(
  dateVal: unknown,
  from: DateTime | null,
  to: DateTime | null
): boolean {
  if (!from || !to) return true;
  if (!dateVal) return false;

  let docDt: DateTime;
  if (typeof dateVal === 'string') {
    docDt = DateTime.fromISO(dateVal);
    if (!docDt.isValid) {
      docDt = DateTime.fromSQL(dateVal);
    }
    if (!docDt.isValid) {
      docDt = DateTime.fromJSDate(new Date(dateVal));
    }
  } else if (dateVal instanceof Date) {
    docDt = DateTime.fromJSDate(dateVal);
  } else {
    return false;
  }

  if (!docDt.isValid) return false;
  return docDt >= from && docDt <= to;
}

function getTransactionStatus(
  doc: RawValueMap,
  grandTotal: number,
  outstanding: number
): { status: 'PAID' | 'UNPAID' | 'PARTIAL' | 'DRAFT' | 'CANCELLED'; label: string } {
  if (isDocCancelled(doc)) {
    return { status: 'CANCELLED', label: 'Cancelled' };
  }
  if (!isDocSubmitted(doc)) {
    return { status: 'DRAFT', label: 'Draft' };
  }
  if (outstanding <= 0.005) {
    return { status: 'PAID', label: 'Paid' };
  }
  if (outstanding >= grandTotal - 0.005) {
    return { status: 'UNPAID', label: 'Unpaid' };
  }
  return { status: 'PARTIAL', label: 'Partial' };
}

export default defineComponent({
  name: 'Dashboard',
  components: {
    PageHeader,
    Button,
  },
  props: {
    darkMode: { type: Boolean, default: false },
  },
  data() {
    return {
      period: 'month' as PeriodType,
      activeTxTab: 'all' as TxTabType,
      loading: false,
      periodOptions: [
        { value: 'today', label: 'Today' },
        { value: 'month', label: 'This Month' },
        { value: 'year', label: 'This Year' },
        { value: 'all', label: 'All' },
      ] as const,
      metrics: {
        totalSales: 0,
        salesCount: 0,
        totalPurchases: 0,
        purchaseCount: 0,
        periodReceivables: 0,
        periodUnpaidSalesCount: 0,
        allTimeReceivables: 0,
        allTimeUnpaidSalesCount: 0,
        periodPayables: 0,
        periodUnpaidPurchasesCount: 0,
        allTimePayables: 0,
        allTimeUnpaidPurchasesCount: 0,
      } as DashboardMetrics,
      transactions: [] as DashboardTransaction[],
      bankCashAccounts: shallowRef<BankCashBalance[]>([]),
      allSalesDocs: [] as RawValueMap[],
      allPurchaseDocs: [] as RawValueMap[],
      recentSalesDocs: [] as RawValueMap[],
      recentPurchaseDocs: [] as RawValueMap[],
    };
  },
  computed: {
    periodLabel(): string {
      switch (this.period) {
        case 'today':
          return 'Today';
        case 'month':
          return 'This Month';
        case 'year':
          return 'This Year';
        case 'all':
          return 'All Time';
        default:
          return '';
      }
    },
    cashAccounts(): BankCashBalance[] {
      return this.bankCashAccounts.filter((a) => a.accountType === 'Cash');
    },
    bankAccounts(): BankCashBalance[] {
      return this.bankCashAccounts.filter((a) => a.accountType === 'Bank');
    },
    totalCash(): Money {
      return this.cashAccounts.reduce(
        (sum, acc) => sum.add(acc.balance),
        fyo.pesa(0)
      );
    },
    totalBank(): Money {
      return this.bankAccounts.reduce(
        (sum, acc) => sum.add(acc.balance),
        fyo.pesa(0)
      );
    },
    totalLiquid(): Money {
      return this.totalCash.add(this.totalBank);
    },
    recentTransactions(): DashboardTransaction[] {
      return this.transactions;
    },
    recentSales(): DashboardTransaction[] {
      return this.transactions.filter((tx) => tx.type === 'Sale');
    },
    recentPurchases(): DashboardTransaction[] {
      return this.transactions.filter((tx) => tx.type === 'Purchase');
    },
    displayedTransactions(): DashboardTransaction[] {
      if (this.activeTxTab === 'sales') {
        return this.recentSales.slice(0, 15);
      }
      if (this.activeTxTab === 'purchases') {
        return this.recentPurchases.slice(0, 15);
      }
      return this.recentTransactions.slice(0, 15);
    },
  },
  async activated() {
    docsPathRef.value = 'books/dashboard';
    await this.loadData();
  },
  deactivated() {
    docsPathRef.value = '';
  },
  methods: {
    routeTo,
    formatMoney(val: unknown): string {
      return fyo.format(val ?? 0, 'Currency');
    },
    formatDate(val: unknown): string {
      if (!val) return '—';
      try {
        if (typeof val === 'string') {
          const dt = DateTime.fromISO(val);
          if (dt.isValid) return dt.toFormat('dd LLL yyyy');
        }
        return fyo.format(val, 'Date');
      } catch {
        return String(val);
      }
    },
    getPeriodRange(period: PeriodType): { from: DateTime | null; to: DateTime | null } {
      const now = DateTime.now();
      switch (period) {
        case 'today':
          return {
            from: now.startOf('day'),
            to: now.endOf('day'),
          };
        case 'month':
          return {
            from: now.startOf('month'),
            to: now.endOf('month'),
          };
        case 'year':
          return {
            from: now.startOf('year'),
            to: now.endOf('year'),
          };
        case 'all':
        default:
          return { from: null, to: null };
      }
    },
    setPeriod(p: PeriodType) {
      this.period = p;
      this.computeMetrics();
    },
    async loadData() {
      this.loading = true;
      try {
        const [
          salesDocs,
          purchaseDocs,
          recentSalesDocs,
          recentPurchaseDocs,
          accountDocs,
        ] = await Promise.all([
          fyo.db.getAllRaw('SalesInvoice', {
            fields: [
              'name',
              'party',
              'date',
              'grandTotal',
              'outstandingAmount',
              'submitted',
              'cancelled',
            ],
            filters: { submitted: true, cancelled: false },
          }),
          fyo.db.getAllRaw('PurchaseInvoice', {
            fields: [
              'name',
              'party',
              'date',
              'grandTotal',
              'outstandingAmount',
              'submitted',
              'cancelled',
            ],
            filters: { submitted: true, cancelled: false },
          }),
          fyo.db.getAllRaw('SalesInvoice', {
            fields: [
              'name',
              'party',
              'date',
              'grandTotal',
              'outstandingAmount',
              'submitted',
              'cancelled',
            ],
            filters: { cancelled: false },
            orderBy: 'date',
            order: 'desc',
            limit: 20,
          }),
          fyo.db.getAllRaw('PurchaseInvoice', {
            fields: [
              'name',
              'party',
              'date',
              'grandTotal',
              'outstandingAmount',
              'submitted',
              'cancelled',
            ],
            filters: { cancelled: false },
            orderBy: 'date',
            order: 'desc',
            limit: 20,
          }),
          fyo.db.getAllRaw('Account', {
            filters: {
              rootType: 'Asset',
              accountType: ['in', ['Bank', 'Cash']],
            },
            fields: ['name', 'accountType', 'isGroup'],
          }),
        ]);

        const accountNames = (accountDocs || []).map((row) => String(row.name));
        const ledgerEntries = accountNames.length
          ? await fyo.db.getAllRaw('AccountingLedgerEntry', {
              filters: { account: ['in', accountNames], reverted: false },
              fields: ['account', 'debit', 'credit', 'reverted'],
            })
          : [];

        this.bankCashAccounts = getBankCashBalances(
          accountDocs || [],
          ledgerEntries,
          fyo
        );

        this.allSalesDocs = salesDocs || [];
        this.allPurchaseDocs = purchaseDocs || [];
        this.recentSalesDocs = recentSalesDocs || [];
        this.recentPurchaseDocs = recentPurchaseDocs || [];

        this.computeMetrics();
        this.computeRecentTransactions();
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        this.loading = false;
      }
    },
    computeMetrics() {
      const { from, to } = this.getPeriodRange(this.period);

      let allTimeReceivables = 0;
      let allTimePayables = 0;
      let allTimeUnpaidSalesCount = 0;
      let allTimeUnpaidPurchasesCount = 0;

      for (const doc of this.allSalesDocs) {
        if (isDocCancelled(doc) || !isDocSubmitted(doc)) continue;
        const outstanding = parseFloat(String(doc.outstandingAmount || 0)) || 0;
        allTimeReceivables += outstanding;
        if (outstanding > 0.005) {
          allTimeUnpaidSalesCount++;
        }
      }

      for (const doc of this.allPurchaseDocs) {
        if (isDocCancelled(doc) || !isDocSubmitted(doc)) continue;
        const outstanding = parseFloat(String(doc.outstandingAmount || 0)) || 0;
        allTimePayables += outstanding;
        if (outstanding > 0.005) {
          allTimeUnpaidPurchasesCount++;
        }
      }

      let totalSales = 0;
      let salesCount = 0;
      let periodReceivables = 0;
      let periodUnpaidSalesCount = 0;

      for (const doc of this.allSalesDocs) {
        if (isDocCancelled(doc) || !isDocSubmitted(doc)) continue;
        if (!isDocInPeriod(doc.date, from, to)) continue;

        const grandTotal = parseFloat(String(doc.grandTotal || 0)) || 0;
        const outstanding = parseFloat(String(doc.outstandingAmount || 0)) || 0;

        totalSales += grandTotal;
        salesCount++;
        periodReceivables += outstanding;
        if (outstanding > 0.005) {
          periodUnpaidSalesCount++;
        }
      }

      let totalPurchases = 0;
      let purchaseCount = 0;
      let periodPayables = 0;
      let periodUnpaidPurchasesCount = 0;

      for (const doc of this.allPurchaseDocs) {
        if (isDocCancelled(doc) || !isDocSubmitted(doc)) continue;
        if (!isDocInPeriod(doc.date, from, to)) continue;

        const grandTotal = parseFloat(String(doc.grandTotal || 0)) || 0;
        const outstanding = parseFloat(String(doc.outstandingAmount || 0)) || 0;

        totalPurchases += grandTotal;
        purchaseCount++;
        periodPayables += outstanding;
        if (outstanding > 0.005) {
          periodUnpaidPurchasesCount++;
        }
      }

      this.metrics = {
        totalSales,
        salesCount,
        totalPurchases,
        purchaseCount,
        periodReceivables,
        periodUnpaidSalesCount,
        allTimeReceivables,
        allTimeUnpaidSalesCount,
        periodPayables,
        periodUnpaidPurchasesCount,
        allTimePayables,
        allTimeUnpaidPurchasesCount,
      };
    },
    computeRecentTransactions() {
      const sales: DashboardTransaction[] = [];
      for (const doc of this.recentSalesDocs) {
        if (isDocCancelled(doc)) continue;
        const grandTotal = parseFloat(String(doc.grandTotal || 0)) || 0;
        const outstanding = parseFloat(String(doc.outstandingAmount || 0)) || 0;
        const { status, label } = getTransactionStatus(
          doc,
          grandTotal,
          outstanding
        );

        sales.push({
          schemaName: 'SalesInvoice',
          name: String(doc.name || ''),
          party: String(doc.party || '—'),
          date: String(doc.date || ''),
          type: 'Sale',
          amount: grandTotal,
          outstanding,
          status,
          statusLabel: label,
        });
      }

      const purchases: DashboardTransaction[] = [];
      for (const doc of this.recentPurchaseDocs) {
        if (isDocCancelled(doc)) continue;
        const grandTotal = parseFloat(String(doc.grandTotal || 0)) || 0;
        const outstanding = parseFloat(String(doc.outstandingAmount || 0)) || 0;
        const { status, label } = getTransactionStatus(
          doc,
          grandTotal,
          outstanding
        );

        purchases.push({
          schemaName: 'PurchaseInvoice',
          name: String(doc.name || ''),
          party: String(doc.party || '—'),
          date: String(doc.date || ''),
          type: 'Purchase',
          amount: grandTotal,
          outstanding,
          status,
          statusLabel: label,
        });
      }

      this.transactions = [...sales, ...purchases].sort((a, b) => {
        const timeA = a.date ? new Date(a.date).getTime() : 0;
        const timeB = b.date ? new Date(b.date).getTime() : 0;
        return timeB - timeA;
      });
    },
    getStatusBadgeClass(status: string): string {
      switch (status) {
        case 'PAID':
          return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
        case 'UNPAID':
          return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800';
        case 'PARTIAL':
          return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
        case 'DRAFT':
          return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700';
        case 'CANCELLED':
          return 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 border-gray-200 dark:border-gray-700 line-through';
        default:
          return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700';
      }
    },
    async createNewSale() {
      const doc = fyo.doc.getNewDoc('SalesInvoice');
      await routeTo(getFormRoute('SalesInvoice', doc.name!));
    },
    async createNewPurchase() {
      const doc = fyo.doc.getNewDoc('PurchaseInvoice');
      await routeTo(getFormRoute('PurchaseInvoice', doc.name!));
    },
    async openTransaction(tx: DashboardTransaction) {
      const route = getFormRoute(tx.schemaName, tx.name);
      await routeTo(route);
    },
    async routeToUnpaid(schemaName: 'SalesInvoice' | 'PurchaseInvoice') {
      const zero = fyo.pesa(0).store;
      const filters = {
        outstandingAmount: ['!=', zero],
        cancelled: false,
        submitted: true,
      };
      const schemaLabel = fyo.schemaMap[schemaName]?.label ?? schemaName;
      const label = this.t`Unpaid ${schemaLabel}`;
      const path = `/list/${schemaName}/${encodeURIComponent(label)}`;
      const query = { filters: JSON.stringify(filters) };
      await routeTo({ path, query });
    },
  },
});
</script>

<style scoped>
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.animate-spin-custom {
  animation: spin 0.8s linear infinite;
}
</style>
