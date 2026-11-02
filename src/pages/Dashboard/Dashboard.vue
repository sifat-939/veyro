<template>
  <div class="h-screen" style="width: var(--w-desk)">
    <PageHeader :title="t`Dashboard`">
      <div
        class="
          border
          dark:border-gray-900
          rounded
          bg-gray-50
          dark:bg-gray-890
          focus-within:bg-gray-100
          dark:focus-within:bg-gray-900
          flex
          items-center
        "
      >
        <PeriodSelector
          class="px-3"
          :value="period"
          :options="['This Year', 'This Quarter', 'This Month', 'YTD']"
          @change="handleTopPeriodChange"
        />
      </div>
    </PageHeader>

    <div
      class="no-scrollbar overflow-auto dark:bg-gray-875"
      style="height: calc(100vh - var(--h-row-largest) - 1px)"
    >
      <div
        style="min-width: var(--w-desk-fixed)"
        class="nivo-dashboard overflow-auto"
      >
        <!-- Executive Financial KPI Summary -->
        <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-3">
          <!-- 1. Realized Cash Profit -->
          <div class="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-875 shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between gap-1">
              <span class="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{{ t`Realized Cash Profit` }}</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                {{ t`Cash Basis` }}
              </span>
            </div>
            <div class="mt-2.5">
              <div
                class="text-xl font-bold font-mono tracking-tight"
                :class="kpi.realizedCashProfit >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'"
              >
                {{ formatMoney(kpi.realizedCashProfit) }}
              </div>
              <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-1 truncate">
                {{ t`Cash & Bank In minus Out` }}
              </p>
            </div>
          </div>

          <!-- 2. Cash & Bank Inflow -->
          <div class="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-875 shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between gap-1">
              <span class="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{{ t`Cash & Bank In` }}</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {{ t`Collections` }}
              </span>
            </div>
            <div class="mt-2.5">
              <div class="text-xl font-bold font-mono tracking-tight text-blue-600 dark:text-blue-400">
                {{ formatMoney(kpi.totalInflow) }}
              </div>
              <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-1 truncate">
                {{ t`Direct cash received` }}
              </p>
            </div>
          </div>

          <!-- 3. Cash & Bank Outflow -->
          <div class="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-875 shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between gap-1">
              <span class="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{{ t`Cash & Bank Out` }}</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-pink-50 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300 border border-pink-200 dark:border-pink-800">
                {{ t`Disbursed` }}
              </span>
            </div>
            <div class="mt-2.5">
              <div class="text-xl font-bold font-mono tracking-tight text-pink-600 dark:text-pink-400">
                {{ formatMoney(kpi.totalOutflow) }}
              </div>
              <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-1 truncate">
                {{ t`Direct cash spent` }}
              </p>
            </div>
          </div>

          <!-- 4. Sales Revenue -->
          <div class="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-875 shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between gap-1">
              <span class="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{{ t`Sales Revenue` }}</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {{ t`Revenue` }}
              </span>
            </div>
            <div class="mt-2.5">
              <div class="text-xl font-bold font-mono tracking-tight text-gray-900 dark:text-gray-100">
                {{ formatMoney(kpi.totalSales) }}
              </div>
              <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-1 truncate">
                {{ t`Total sales & income` }}
              </p>
            </div>
          </div>

          <!-- 5. Purchases & Expenses -->
          <div class="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-875 shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between gap-1">
              <span class="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{{ t`Purchases & Costs` }}</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                {{ t`Costs` }}
              </span>
            </div>
            <div class="mt-2.5">
              <div class="text-xl font-bold font-mono tracking-tight text-gray-900 dark:text-gray-100">
                {{ formatMoney(kpi.totalPurchases) }}
              </div>
              <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-1 truncate">
                {{ t`Total bills & expenses` }}
              </p>
            </div>
          </div>

          <!-- 6. Operating Profit -->
          <div class="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-875 shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between gap-1">
              <span class="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{{ t`Operating Profit` }}</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {{ t`Booked` }}
              </span>
            </div>
            <div class="mt-2.5">
              <div
                class="text-xl font-bold font-mono tracking-tight"
                :class="kpi.operatingProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'"
              >
                {{ formatMoney(kpi.operatingProfit) }}
              </div>
              <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-1 truncate">
                {{ t`Revenue minus expenses` }}
              </p>
            </div>
          </div>
        </section>

        <Cashflow
          class="p-4 nivo-dashboard-card"
          :common-period="period"
          :dark-mode="darkMode"
          @period-change="handlePeriodChange"
        />

        <div class="flex w-full gap-3 my-3">
          <UnpaidInvoices
            :schema-name="'SalesInvoice'"
            :common-period="period"
            :dark-mode="darkMode"
            class="nivo-dashboard-card"
            @period-change="handlePeriodChange"
          />
          <UnpaidInvoices
            :schema-name="'PurchaseInvoice'"
            class="nivo-dashboard-card"
            :common-period="period"
            :dark-mode="darkMode"
            @period-change="handlePeriodChange"
          />
        </div>

        <div class="flex gap-3">
          <ProfitAndLoss
            class="w-full p-4 nivo-dashboard-card"
            :common-period="period"
            :dark-mode="darkMode"
            @period-change="handlePeriodChange"
          />
          <Expenses
            class="w-full p-4 nivo-dashboard-card"
            :common-period="period"
            :dark-mode="darkMode"
            @period-change="handlePeriodChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PageHeader from 'src/components/PageHeader.vue';
import UnpaidInvoices from './UnpaidInvoices.vue';
import Cashflow from './Cashflow.vue';
import Expenses from './Expenses.vue';
import PeriodSelector from './PeriodSelector.vue';
import ProfitAndLoss from './ProfitAndLoss.vue';
import { docsPathRef } from 'src/utils/refs';
import { fyo } from 'src/initFyo';
import { getDatesAndPeriodList } from 'src/utils/misc';

export default {
  name: 'Dashboard',
  components: {
    PageHeader,
    Cashflow,
    ProfitAndLoss,
    Expenses,
    PeriodSelector,
    UnpaidInvoices,
  },
  props: {
    darkMode: { type: Boolean, default: false },
  },
  data() {
    return {
      period: 'This Year',
      kpiPeriod: 'This Year',
      kpi: {
        realizedCashProfit: 0,
        totalInflow: 0,
        totalOutflow: 0,
        totalSales: 0,
        totalPurchases: 0,
        operatingProfit: 0,
      },
      loadingKpi: false,
    };
  },
  activated() {
    docsPathRef.value = 'books/dashboard';
    this.loadKpi();
  },
  deactivated() {
    docsPathRef.value = '';
  },
  methods: {
    async loadKpi(periodToUse) {
      try {
        this.loadingKpi = true;
        const targetPeriod =
          periodToUse || this.kpiPeriod || this.period || 'This Year';
        this.kpiPeriod = targetPeriod;
        const { fromDate, toDate } = getDatesAndPeriodList(targetPeriod);
        const [cashflowData, incomeExpenseData] = await Promise.all([
          fyo.db.getCashflow(fromDate.toISO(), toDate.toISO()),
          fyo.db.getIncomeAndExpenses(fromDate.toISO(), toDate.toISO()),
        ]);

        const totalInflow = (cashflowData || []).reduce(
          (sum, row) => sum + (Number(row.inflow) || 0),
          0
        );
        const totalOutflow = (cashflowData || []).reduce(
          (sum, row) => sum + (Number(row.outflow) || 0),
          0
        );
        const realizedCashProfit = totalInflow - totalOutflow;

        const totalSales = (incomeExpenseData?.income || []).reduce(
          (sum, row) => sum + (Number(row.balance) || 0),
          0
        );
        const totalPurchases = (incomeExpenseData?.expense || []).reduce(
          (sum, row) => sum + (Number(row.balance) || 0),
          0
        );
        const operatingProfit = totalSales - totalPurchases;

        this.kpi = {
          realizedCashProfit,
          totalInflow,
          totalOutflow,
          totalSales,
          totalPurchases,
          operatingProfit,
        };
      } catch (err) {
        console.error('Failed to load dashboard KPI:', err);
      } finally {
        this.loadingKpi = false;
      }
    },
    formatMoney(val) {
      return fyo.format(val ?? 0, 'Currency');
    },
    handleTopPeriodChange(val) {
      this.period = val;
      this.kpiPeriod = val;
      this.loadKpi(val);
    },
    handlePeriodChange(childPeriod) {
      if (childPeriod === this.period) {
        return;
      }

      this.period = '';
      if (childPeriod) {
        this.kpiPeriod = childPeriod;
        this.loadKpi(childPeriod);
      }
    },
  },
};
</script>

<style scoped>
.nivo-dashboard {
  padding: 16px;
  background: theme('colors.gray.50');
}

.nivo-dashboard-card {
  min-width: 0;
  border: 1px solid theme('colors.gray.200');
  border-radius: 14px;
  background: white;
}

.dark .nivo-dashboard {
  background: theme('colors.gray.900');
}

.dark .nivo-dashboard-card {
  border-color: theme('colors.gray.800');
  background: theme('colors.gray.875');
}
</style>
