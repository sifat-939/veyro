<template>
  <div class="h-screen flex flex-col w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden" style="width: var(--w-desk)">
    <!-- Page Header & Global Controls -->
    <PageHeader :title="t`Dashboard`">
      <template #left>
        <!-- Period Filters: Segmented Pill Buttons -->
        <div class="inline-flex p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <button
            v-for="opt in periodOptions"
            :key="opt.value"
            class="px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150"
            :class="period === opt.value
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm font-semibold'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'"
            @click="setPeriod(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </template>

      <!-- Right Controls: Refresh + Quick Actions -->
      <div class="flex items-center gap-2">
        <Button
          type="secondary"
          class="gap-1.5 border border-gray-200 text-xs dark:border-gray-700 px-2.5 shadow-sm"
          :disabled="loading"
          @click="loadData"
        >
          <feather-icon
            name="refresh-cw"
            class="h-3.5 w-3.5"
            :class="{ 'animate-spin-custom': loading }"
          />
          <span class="hidden sm:inline">{{ t`Refresh` }}</span>
        </Button>

        <Button
          type="primary"
          class="gap-1.5 text-xs font-semibold px-3 shadow-sm"
          @click="createNewSale"
        >
          <feather-icon name="plus" class="h-3.5 w-3.5" />
          <span>{{ t`New Sale` }}</span>
        </Button>

        <Button
          type="secondary"
          class="gap-1.5 border border-gray-200 text-xs dark:border-gray-700 px-3 shadow-sm"
          @click="createNewPurchase"
        >
          <feather-icon name="plus" class="h-3.5 w-3.5" />
          <span>{{ t`New Purchase` }}</span>
        </Button>
      </div>
    </PageHeader>

    <!-- Scrollable Dashboard Content Body -->
    <div
      class="flex-1 no-scrollbar overflow-y-auto p-4 lg:p-6 space-y-5 bg-gray-50 dark:bg-gray-900"
      style="height: calc(100vh - var(--h-row-largest) - 1px)"
    >
      <div class="max-w-7xl mx-auto space-y-5">
        <!-- 1. PRIMARY 4 KPI METRIC CARDS -->
        <section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <!-- Card 1: Total Sales (মোট বিক্রয়) -->
          <div
            class="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-875 shadow-sm hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
            @click="routeTo('/list/SalesInvoice')"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center">
                  <feather-icon name="trending-up" class="w-4 h-4" />
                </div>
                <span class="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  মোট বিক্রয় · Sales
                </span>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                {{ periodLabel }}
              </span>
            </div>

            <div class="mt-3">
              <div class="text-2xl lg:text-3xl font-bold font-mono tracking-tight text-gray-900 dark:text-white">
                {{ formatMoney(metrics.totalSales) }}
              </div>
              <div class="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-500 dark:text-gray-400">
                <span>{{ metrics.salesCount }} টি বিক্রয় চালান</span>
                <span class="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                  চালান দেখুন →
                </span>
              </div>
            </div>
          </div>

          <!-- Card 2: Total Purchases (মোট ক্রয়) -->
          <div
            class="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-875 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
            @click="routeTo('/list/PurchaseInvoice')"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center">
                  <feather-icon name="truck" class="w-4 h-4" />
                </div>
                <span class="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  মোট ক্রয় · Purchases
                </span>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                {{ periodLabel }}
              </span>
            </div>

            <div class="mt-3">
              <div class="text-2xl lg:text-3xl font-bold font-mono tracking-tight text-gray-900 dark:text-white">
                {{ formatMoney(metrics.totalPurchases) }}
              </div>
              <div class="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-500 dark:text-gray-400">
                <span>{{ metrics.purchaseCount }} টি ক্রয় বিল</span>
                <span class="text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-0.5">
                  বিল দেখুন →
                </span>
              </div>
            </div>
          </div>

          <!-- Card 3: Total Receivables (গ্রাহকের কাছে বাকি পাওনা) -->
          <div
            class="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-875 shadow-sm hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
            @click="routeToUnpaid('SalesInvoice')"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center">
                  <feather-icon name="users" class="w-4 h-4" />
                </div>
                <span class="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  গ্রাহকের বাকি · Receivables
                </span>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50">
                {{ period === 'all' ? 'সর্বমোট' : 'চলতি সময়ে' }}
              </span>
            </div>

            <div class="mt-3">
              <div class="text-2xl lg:text-3xl font-bold font-mono tracking-tight text-amber-600 dark:text-amber-400">
                {{ formatMoney(period === 'all' ? metrics.allTimeReceivables : metrics.periodReceivables) }}
              </div>
              <div class="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-500 dark:text-gray-400">
                <span v-if="period !== 'all'">
                  সর্বমোট বাকি: <strong class="text-amber-600 dark:text-amber-400 font-mono">{{ formatMoney(metrics.allTimeReceivables) }}</strong>
                </span>
                <span v-else>
                  {{ metrics.allTimeUnpaidSalesCount }} টি চালানে বাকি রয়েছে
                </span>
                <span class="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-0.5">
                  বাকি তালিকা →
                </span>
              </div>
            </div>
          </div>

          <!-- Card 4: Total Payables (সাপ্লায়ার দেনা) -->
          <div
            class="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-875 shadow-sm hover:border-rose-400 dark:hover:border-rose-500 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
            @click="routeToUnpaid('PurchaseInvoice')"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 flex items-center justify-center">
                  <feather-icon name="credit-card" class="w-4 h-4" />
                </div>
                <span class="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  সাপ্লায়ার দেনা · Payables
                </span>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/50">
                {{ period === 'all' ? 'সর্বমোট' : 'চলতি সময়ে' }}
              </span>
            </div>

            <div class="mt-3">
              <div class="text-2xl lg:text-3xl font-bold font-mono tracking-tight text-rose-600 dark:text-rose-400">
                {{ formatMoney(period === 'all' ? metrics.allTimePayables : metrics.periodPayables) }}
              </div>
              <div class="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-500 dark:text-gray-400">
                <span v-if="period !== 'all'">
                  সর্বমোট দেনা: <strong class="text-rose-600 dark:text-rose-400 font-mono">{{ formatMoney(metrics.allTimePayables) }}</strong>
                </span>
                <span v-else>
                  {{ metrics.allTimeUnpaidPurchasesCount }} টি বিলে দেনা রয়েছে
                </span>
                <span class="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-0.5">
                  দেনা তালিকা →
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- 2. LIQUID FUNDS & COMMERCIAL TRADING HEALTH -->
        <section class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- Left: Liquid Funds Card (2 Columns) -->
          <div class="lg:col-span-2 p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-875 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/60 flex items-center justify-center">
                    <feather-icon name="dollar-sign" class="w-4 h-4" />
                  </div>
                  <div>
                    <h2 class="text-sm font-bold text-gray-900 dark:text-white">
                      ক্যাশ ও ব্যাংক লিকুইড ব্যালেন্স · Liquid Funds
                    </h2>
                    <p class="text-[11px] text-gray-500 dark:text-gray-400">
                      হাতে নগদ এবং ব্যাংকে তাৎক্ষণিক ব্যবহারের উপযোগী মোট স্থিতি
                    </p>
                  </div>
                </div>
                <button
                  class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  @click="routeTo('/bank-cash')"
                >
                  <span>সব অ্যাকাউন্ট</span>
                  <feather-icon name="arrow-right" class="w-3.5 h-3.5" />
                </button>
              </div>

              <!-- Quick Balance Summary Pills -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
                <!-- Total Liquid -->
                <div class="p-3 rounded-lg bg-sky-50/50 dark:bg-sky-950/30 border border-sky-200/50 dark:border-sky-800/40">
                  <div class="text-[11px] font-medium text-sky-700 dark:text-sky-300">
                    সর্বমোট লিকুইড তহবিল
                  </div>
                  <div class="text-xl font-bold font-mono text-gray-900 dark:text-white mt-1">
                    {{ formatMoney(totalLiquid) }}
                  </div>
                  <div class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                    ক্যাশ + ব্যাংক হিসাবের যোগফল
                  </div>
                </div>

                <!-- Cash in Hand -->
                <div class="p-3 rounded-lg bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200/50 dark:border-teal-800/40">
                  <div class="text-[11px] font-medium text-teal-700 dark:text-teal-300">
                    ক্যাশ ইন হ্যান্ড (হাতে নগদ)
                  </div>
                  <div class="text-xl font-bold font-mono text-teal-700 dark:text-teal-300 mt-1">
                    {{ formatMoney(totalCash) }}
                  </div>
                  <div class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {{ cashAccounts.length }} টি নগদ ড্রয়ার/ক্যাশ হিসাব
                  </div>
                </div>

                <!-- Bank Balance -->
                <div class="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/40">
                  <div class="text-[11px] font-medium text-blue-700 dark:text-blue-300">
                    ব্যাংক স্থিতি (ব্যাংক একাউন্ট)
                  </div>
                  <div class="text-xl font-bold font-mono text-blue-700 dark:text-blue-300 mt-1">
                    {{ formatMoney(totalBank) }}
                  </div>
                  <div class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {{ bankAccounts.length }} টি সক্রিয় ব্যাংক হিসাব
                  </div>
                </div>
              </div>

              <!-- Account Breakdown List -->
              <div class="mt-2">
                <div class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                  <span>হিসাব ভিত্তিক বিস্তারিত ব্যালেন্স (Account Breakdown)</span>
                  <span class="text-[11px] font-normal text-gray-500">{{ bankCashAccounts.length }} টি অ্যাকাউন্ট</span>
                </div>

                <div v-if="bankCashAccounts.length > 0" class="divide-y divide-gray-100 dark:divide-gray-800 max-h-48 overflow-y-auto no-scrollbar pr-1">
                  <div
                    v-for="acc in bankCashAccounts"
                    :key="acc.name"
                    class="py-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/40 rounded px-2 -mx-2 transition cursor-pointer"
                    @click="routeToAccountLedger(acc.name)"
                  >
                    <div class="flex items-center gap-2 min-w-0">
                      <span
                        class="px-1.5 py-0.5 text-[10px] font-semibold rounded"
                        :class="acc.accountType === 'Cash'
                          ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'"
                      >
                        {{ acc.accountType === 'Cash' ? 'নগদ' : 'ব্যাংক' }}
                      </span>
                      <span class="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                        {{ acc.name }}
                      </span>
                    </div>
                    <div class="font-mono text-xs font-semibold text-gray-900 dark:text-white tabular-nums">
                      {{ formatMoney(acc.balance) }}
                    </div>
                  </div>
                </div>
                <div v-else class="text-xs text-gray-400 text-center py-4">
                  কোনো সক্রিয় ক্যাশ বা ব্যাংক হিসাব পাওয়া যায়নি।
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Executive Commercial Net Position (1 Column) -->
          <div class="p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-875 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center">
                  <feather-icon name="check-circle" class="w-4 h-4" />
                </div>
                <div>
                  <h2 class="text-sm font-bold text-gray-900 dark:text-white">
                    বাণিজ্যিক সার্বিক অবস্থান
                  </h2>
                  <p class="text-[11px] text-gray-500 dark:text-gray-400">
                    ট্রেডিং ব্যালেন্স ও সার্বিক তারল্য সারসংক্ষেপ
                  </p>
                </div>
              </div>

              <div class="mt-4 space-y-3.5">
                <!-- 1. Period Trading Margin / Spread -->
                <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-gray-600 dark:text-gray-400">বিক্রয় ও ক্রয় ব্যবধান (Spread)</span>
                    <span
                      class="font-mono font-bold"
                      :class="periodMargin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'"
                    >
                      {{ formatMoney(periodMargin) }}
                    </span>
                  </div>
                  <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                    মোট বিক্রয় বিয়োগ মোট ক্রয় (নির্বাচিত সময়কালের মধ্যে)
                  </p>
                </div>

                <!-- 2. Net Working Capital Liquidity Position -->
                <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-gray-600 dark:text-gray-400">কার্যকর তারল্য অবস্থান</span>
                    <span
                      class="font-mono font-bold"
                      :class="netWorkingCapital >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'"
                    >
                      {{ formatMoney(netWorkingCapital) }}
                    </span>
                  </div>
                  <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                    (নগদ ও ব্যাংক স্থিতি + কাস্টমার বাকি) − সাপ্লায়ার দেনা
                  </p>
                </div>

                <!-- 3. Operational Shortcuts -->
                <div class="pt-2">
                  <div class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    প্রয়োজনীয় শর্টকাট
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      class="px-2.5 py-2 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-left transition flex items-center justify-between"
                      @click="routeTo('/party-hub')"
                    >
                      <span>পার্টি হাব</span>
                      <feather-icon name="arrow-right" class="w-3 h-3 text-gray-400" />
                    </button>
                    <button
                      class="px-2.5 py-2 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-left transition flex items-center justify-between"
                      @click="routeTo('/list/Payment')"
                    >
                      <span>পেমেন্ট ভাউচার</span>
                      <feather-icon name="arrow-right" class="w-3 h-3 text-gray-400" />
                    </button>
                    <button
                      class="px-2.5 py-2 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-left transition flex items-center justify-between"
                      @click="routeTo('/reports-hub')"
                    >
                      <span>রিপোর্টস হাব</span>
                      <feather-icon name="arrow-right" class="w-3 h-3 text-gray-400" />
                    </button>
                    <button
                      class="px-2.5 py-2 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-left transition flex items-center justify-between"
                      @click="routeTo('/bank-cash')"
                    >
                      <span>ব্যাংক ও ক্যাশ</span>
                      <feather-icon name="arrow-right" class="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 3. RECENT TRANSACTIONS TABLE (সাম্প্রতিক লেনদেন) -->
        <section class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-875 shadow-sm overflow-hidden">
          <!-- Table Header Bar -->
          <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-center">
                <feather-icon name="file-text" class="w-4 h-4" />
              </div>
              <div>
                <h2 class="text-sm font-bold text-gray-900 dark:text-white">
                  সাম্প্রতিক লেনদেন · Recent Transactions
                </h2>
                <p class="text-[11px] text-gray-500 dark:text-gray-400">
                  সর্বশেষ বিক্রয় ইনভয়েস ও ক্রয় বিলের রিয়েল-টাইম স্ট্যাটাস
                </p>
              </div>
            </div>

            <!-- Tab Filters & Quick Add -->
            <div class="flex items-center gap-3">
              <div class="inline-flex p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <button
                  class="px-2.5 py-1 text-xs font-medium rounded-md transition"
                  :class="activeTxTab === 'all'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'"
                  @click="activeTxTab = 'all'"
                >
                  সব ({{ recentTransactions.length }})
                </button>
                <button
                  class="px-2.5 py-1 text-xs font-medium rounded-md transition"
                  :class="activeTxTab === 'sales'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'"
                  @click="activeTxTab = 'sales'"
                >
                  বিক্রয় ({{ recentSales.length }})
                </button>
                <button
                  class="px-2.5 py-1 text-xs font-medium rounded-md transition"
                  :class="activeTxTab === 'purchases'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'"
                  @click="activeTxTab = 'purchases'"
                >
                  ক্রয় ({{ recentPurchases.length }})
                </button>
              </div>

              <div class="flex items-center gap-1.5">
                <button
                  class="px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition flex items-center gap-1"
                  @click="createNewSale"
                >
                  <feather-icon name="plus" class="w-3 h-3" />
                  <span>নতুন বিক্রয়</span>
                </button>
                <button
                  class="px-2.5 py-1 text-xs font-medium rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition flex items-center gap-1"
                  @click="createNewPurchase"
                >
                  <feather-icon name="plus" class="w-3 h-3" />
                  <span>নতুন ক্রয়</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Transactions Table Content -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-800 bg-gray-50/75 dark:bg-gray-850/50 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                  <th class="py-2.5 px-4">তারিখ (Date)</th>
                  <th class="py-2.5 px-4">ভাউচার নং (Invoice No)</th>
                  <th class="py-2.5 px-4">পার্টি নাম (Party)</th>
                  <th class="py-2.5 px-4">ধরণ (Type)</th>
                  <th class="py-2.5 px-4 text-right">মোট পরিমাণ (Amount)</th>
                  <th class="py-2.5 px-4 text-center">স্ট্যাটাস (Status)</th>
                  <th class="py-2.5 px-3 text-right">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                <tr
                  v-for="tx in displayedTransactions"
                  :key="tx.schemaName + tx.name"
                  class="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition cursor-pointer group"
                  @click="openTransaction(tx)"
                >
                  <!-- Date -->
                  <td class="py-3 px-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {{ formatDate(tx.date) }}
                  </td>

                  <!-- Voucher No -->
                  <td class="py-3 px-4 font-mono font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap group-hover:underline">
                    {{ tx.name }}
                  </td>

                  <!-- Party Name -->
                  <td class="py-3 px-4 font-medium text-gray-900 dark:text-gray-100 max-w-xs truncate">
                    {{ tx.party || '—' }}
                  </td>

                  <!-- Type Badge -->
                  <td class="py-3 px-4 whitespace-nowrap">
                    <span
                      class="px-2 py-0.5 rounded text-[11px] font-semibold border inline-flex items-center gap-1"
                      :class="tx.type === 'Sale'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'"
                    >
                      <feather-icon :name="tx.type === 'Sale' ? 'trending-up' : 'truck'" class="w-3 h-3" />
                      {{ tx.type === 'Sale' ? 'বিক্রয়' : 'ক্রয়' }}
                    </span>
                  </td>

                  <!-- Amount -->
                  <td class="py-3 px-4 text-right font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                    {{ formatMoney(tx.amount) }}
                  </td>

                  <!-- Status Pill -->
                  <td class="py-3 px-4 text-center whitespace-nowrap">
                    <span
                      class="px-2.5 py-0.5 rounded-full text-[11px] font-medium border inline-flex items-center gap-1"
                      :class="getStatusBadgeClass(tx.status)"
                    >
                      <span class="w-1.5 h-1.5 rounded-full" :class="getStatusDotClass(tx.status)" />
                      {{ tx.statusLabel }}
                      <span v-if="tx.status === 'PARTIAL' || tx.status === 'UNPAID'" class="font-mono text-[10px] opacity-80">
                        (বাকি {{ formatMoney(tx.outstanding) }})
                      </span>
                    </span>
                  </td>

                  <!-- Action -->
                  <td class="py-3 px-3 text-right text-gray-400 group-hover:text-blue-500 whitespace-nowrap">
                    <feather-icon name="arrow-right" class="w-4 h-4 ml-auto" />
                  </td>
                </tr>

                <!-- Empty State -->
                <tr v-if="displayedTransactions.length === 0">
                  <td colspan="7" class="py-8 text-center text-gray-400 dark:text-gray-500 text-xs">
                    কোনো সাম্প্রতিক লেনদেন পাওয়া যায়নি।
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Bottom Footer Navigation -->
          <div class="p-3 bg-gray-50/60 dark:bg-gray-850/40 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
            <span>সর্বোচ্চ ১৫ টি সাম্প্রতিক লেনদেন দেখানো হচ্ছে</span>
            <div class="flex items-center gap-4">
              <button class="hover:text-blue-600 dark:hover:text-blue-400 font-medium" @click="routeTo('/list/SalesInvoice')">
                সব বিক্রয় ইনভয়েস দেখুন →
              </button>
              <button class="hover:text-blue-600 dark:hover:text-blue-400 font-medium" @click="routeTo('/list/PurchaseInvoice')">
                সব ক্রয় বিল দেখুন →
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
    return { status: 'CANCELLED', label: 'বাতিল' };
  }
  if (!isDocSubmitted(doc)) {
    return { status: 'DRAFT', label: 'খসড়া' };
  }
  if (outstanding <= 0.005) {
    return { status: 'PAID', label: 'পরিশোধিত' };
  }
  if (outstanding >= grandTotal - 0.005) {
    return { status: 'UNPAID', label: 'বাকি' };
  }
  return { status: 'PARTIAL', label: 'আংশিক বাকি' };
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
        { value: 'today', label: 'আজ' },
        { value: 'month', label: 'চলতি মাস' },
        { value: 'year', label: 'চলতি বছর' },
        { value: 'all', label: 'সর্বমোট' },
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
          return 'আজ';
        case 'month':
          return 'চলতি মাস';
        case 'year':
          return 'চলতি বছর';
        case 'all':
          return 'সর্বমোট';
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
    periodMargin(): number {
      return this.metrics.totalSales - this.metrics.totalPurchases;
    },
    netWorkingCapital(): number {
      // (Liquid Funds + All-time Receivables) - All-time Payables
      const liquid = this.totalLiquid.float;
      const receivables = this.metrics.allTimeReceivables;
      const payables = this.metrics.allTimePayables;
      return liquid + receivables - payables;
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
    getStatusDotClass(status: string): string {
      switch (status) {
        case 'PAID':
          return 'bg-emerald-500';
        case 'UNPAID':
          return 'bg-rose-500';
        case 'PARTIAL':
          return 'bg-amber-500';
        case 'DRAFT':
          return 'bg-gray-400';
        case 'CANCELLED':
          return 'bg-gray-300';
        default:
          return 'bg-gray-400';
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
    async routeToAccountLedger(accountName: string) {
      const query = {
        filters: JSON.stringify({ account: accountName }),
      };
      await routeTo({ path: '/general-ledger', query });
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
