<template>
  <div class="flex flex-col h-full">
    <SectionHeader>
      <template #title>{{ t`Profit and Loss` }}</template>
      <template #action>
        <PeriodSelector
          :value="period"
          :options="periodOptions"
          @change="(value) => (period = value)"
        />
      </template>
    </SectionHeader>
    <div v-if="hasData" class="flex flex-wrap items-center gap-4 mt-2 text-xs">
      <div class="flex items-center gap-1.5 font-medium">
        <span class="text-gray-500 dark:text-gray-400">{{ t`Booked Profit:` }}</span>
        <span
          class="font-mono font-semibold"
          :class="totalProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-pink-600 dark:text-pink-400'"
        >
          {{ formatCurrency(totalProfit) }}
        </span>
      </div>
      <div class="flex items-center gap-1.5 font-medium">
        <span class="text-gray-500 dark:text-gray-400">{{ t`Realized Cash Profit:` }}</span>
        <span
          class="font-mono font-semibold"
          :class="totalRealizedCashProfit >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'"
        >
          {{ formatCurrency(totalRealizedCashProfit) }}
        </span>
      </div>
    </div>
    <BarChart
      v-if="hasData"
      class="mt-4"
      :aspect-ratio="2.05"
      :colors="chartData.colors"
      :grid-color="chartData.gridColor"
      :font-color="chartData.fontColor"
      :points="chartData.points"
      :x-labels="chartData.xLabels"
      :format="chartData.format"
      :format-x="chartData.formatX"
      :y-max="chartData.yMax"
      :y-min="chartData.yMin"
    />
    <div v-else class="flex-1 w-full h-full flex-center my-20">
      <span class="text-base text-gray-600 dark:text-gray-500">
        {{ t`No transactions yet` }}
      </span>
    </div>
  </div>
</template>
<script lang="ts">
import BarChart from 'src/components/Charts/BarChart.vue';
import { fyo } from 'src/initFyo';
import { formatXLabels, getYMax, getYMin } from 'src/utils/chart';
import { uicolors } from 'src/utils/colors';
import { getDatesAndPeriodList } from 'src/utils/misc';
import { getValueMapFromList } from 'utils';
import DashboardChartBase from './BaseDashboardChart.vue';
import PeriodSelector from './PeriodSelector.vue';
import SectionHeader from './SectionHeader.vue';
import { defineComponent } from 'vue';

// Linting broken in this file cause of `extends: ...`
/*
  eslint-disable @typescript-eslint/no-unsafe-argument,
  @typescript-eslint/no-unsafe-return
*/
export default defineComponent({
  name: 'ProfitAndLoss',
  components: {
    PeriodSelector,
    SectionHeader,
    BarChart,
  },
  extends: DashboardChartBase,
  props: {
    darkMode: { type: Boolean, default: false },
  },
  data: () => ({
    data: [] as { yearmonth: string; balance: number }[],
    totalProfit: 0,
    totalRealizedCashProfit: 0,
    hasData: false,
    periodOptions: ['This Year', 'This Quarter', 'YTD'],
  }),
  computed: {
    chartData() {
      const points = [this.data.map((d) => d.balance)];
      const colors = [
        {
          positive: uicolors.blue[this.darkMode ? '600' : '500'],
          negative: uicolors.pink[this.darkMode ? '600' : '500'],
        },
      ];
      const format = (value: number) => fyo.format(value ?? 0, 'Currency');
      const yMax = getYMax(points);
      const yMin = getYMin(points);
      return {
        xLabels: this.data.map((d) => d.yearmonth),
        points,
        format,
        colors,
        yMax,
        yMin,
        formatX: formatXLabels,
        gridColor: this.darkMode ? 'rgba(200, 200, 200, 0.2)' : undefined,
        fontColor: this.darkMode ? uicolors.gray['400'] : undefined,
        zeroLineColor: this.darkMode ? uicolors.gray['400'] : undefined,
      };
    },
  },
  activated() {
    this.setData();
  },
  methods: {
    async setData() {
      const { fromDate, toDate, periodList } = getDatesAndPeriodList(
        this.period
      );

      const [data, cashflowData] = await Promise.all([
        fyo.db.getIncomeAndExpenses(fromDate.toISO(), toDate.toISO()),
        fyo.db.getCashflow(fromDate.toISO(), toDate.toISO()),
      ]);

      const totalCashIn = (cashflowData || []).reduce(
        (sum, c) => sum + (Number(c.inflow) || 0),
        0
      );
      const totalCashOut = (cashflowData || []).reduce(
        (sum, c) => sum + (Number(c.outflow) || 0),
        0
      );
      this.totalRealizedCashProfit = totalCashIn - totalCashOut;

      const incomes = getValueMapFromList(data.income, 'yearmonth', 'balance');
      const expenses = getValueMapFromList(
        data.expense,
        'yearmonth',
        'balance'
      );

      const totalInc = (data.income || []).reduce(
        (sum, i) => sum + (Number(i.balance) || 0),
        0
      );
      const totalExp = (data.expense || []).reduce(
        (sum, e) => sum + (Number(e.balance) || 0),
        0
      );
      this.totalProfit = totalInc - totalExp;

      this.data = periodList.map((d) => {
        const key = d.toFormat('yyyy-MM');
        const inc = incomes[key] ?? 0;
        const exp = expenses[key] ?? 0;
        return { yearmonth: key, balance: inc - exp };
      });
      this.hasData =
        data.income.length > 0 ||
        data.expense.length > 0 ||
        cashflowData.length > 0;
    },
    formatCurrency(val: number) {
      return fyo.format(val ?? 0, 'Currency');
    },
  },
});
</script>
