<template>
  <div class="flex flex-col w-full h-full bg-white dark:bg-gray-875 overflow-hidden">
    <!-- View 1: Print View Mode (Exact match to Party Print View / Image 2) -->
    <div v-if="isPrintView" class="flex flex-col w-full h-full bg-gray-100 dark:bg-gray-900 overflow-hidden">
      <!-- Print View Top Navigation Bar -->
      <header class="px-6 py-3 bg-white dark:bg-gray-850 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shadow-xs flex-shrink-0">
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            :title="t`Back to Report`"
            @click="isPrintView = false"
          >
            <feather-icon name="arrow-left" class="w-4 h-4" />
          </button>
          <div>
            <h1 class="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span>{{ t`Print View` }}</span>
              <span class="text-xs font-normal text-gray-500 dark:text-gray-400">
                ({{ activeReport === 'sales' ? t`Sales Report` : t`Purchase Report` }})
              </span>
            </h1>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-4 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition flex items-center gap-1.5 shadow-sm"
            @click="exportPdf"
          >
            <feather-icon name="download" class="w-3.5 h-3.5" />
            <span>{{ t`Save as PDF` }}</span>
          </button>
          <button
            type="button"
            class="px-4 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 transition flex items-center gap-1.5 shadow-sm"
            @click="printDocumentDirectly"
          >
            <feather-icon name="printer" class="w-3.5 h-3.5" />
            <span>{{ t`Print` }}</span>
          </button>
        </div>
      </header>

      <!-- Date Preset Navigation Bar (Identical to Image 2) -->
      <div class="flex flex-wrap items-center justify-between gap-3 p-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-850 flex-shrink-0">
        <div class="flex flex-wrap items-center gap-2">
          <div class="p-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-1 text-xs shadow-sm">
            <button
              v-for="preset in datePresets"
              :key="preset.value"
              type="button"
              class="px-2.5 py-1 rounded-md transition duration-150 font-medium whitespace-nowrap text-xs"
              :class="selectedDatePreset === preset.value
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'"
              @click="applyDatePreset(preset.value)"
            >
              {{ preset.label }}
            </button>
          </div>

          <!-- Custom Range Input -->
          <div v-if="selectedDatePreset === 'custom'" class="flex items-center gap-2 text-xs bg-white dark:bg-gray-800 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <span class="text-xs text-gray-500 font-medium ps-1">{{ t`Range:` }}</span>
            <input
              v-model="filterFromDate"
              type="date"
              class="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <span class="text-gray-400">→</span>
            <input
              v-model="filterToDate"
              type="date"
              class="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      <!-- Scrollable Canvas showing the A4 sheet -->
      <div class="flex-1 overflow-y-auto custom-scroll custom-scroll-thumb1 p-6 flex justify-center">
        <div class="max-w-[230mm] w-full bg-white text-gray-900 shadow-2xl rounded-sm p-10 min-h-[297mm] my-auto">
          <!-- Sheet Header -->
          <div class="flex items-start justify-between pb-6 border-b-2 border-teal-600">
            <div class="flex items-center gap-4">
              <img v-if="companyLogo" :src="companyLogo" class="w-16 h-16 object-contain" alt="Logo" />
              <div>
                <h2 class="text-xl font-bold text-gray-900 tracking-tight">
                  {{ companyName }}
                </h2>
                <p v-if="companyPhone || companyEmail" class="text-xs text-gray-600 mt-1">
                  <span v-if="companyPhone">{{ companyPhone }}</span>
                  <span v-if="companyPhone && companyEmail"> &bull; </span>
                  <span v-if="companyEmail">{{ companyEmail }}</span>
                </p>
                <p v-if="companyAddress" class="text-xs text-gray-500 mt-0.5 whitespace-pre-line">
                  {{ companyAddress }}
                </p>
              </div>
            </div>
            <div class="text-right">
              <h3 class="text-xl font-extrabold text-teal-800">
                {{ activeReport === 'sales' ? t`Sales Report` : t`Purchase Report` }}
              </h3>
              <p class="text-xs text-gray-500 mt-0.5">
                {{ activeReport === 'sales' ? t`Customer Invoices Ledger` : t`Supplier Bills Ledger` }}
              </p>
              <p class="text-xs text-gray-600 font-medium mt-1">
                {{ dateRangeText }}
              </p>
            </div>
          </div>

          <!-- Meta Summary Box -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 py-3 px-4 bg-gray-50 rounded-lg border border-gray-200 text-xs my-6">
            <div>
              <span class="block text-[10px] text-gray-500 uppercase font-semibold">{{ t`Total Entries` }}</span>
              <span class="text-sm font-bold font-mono text-gray-900">{{ summaryStats.count }}</span>
            </div>
            <div>
              <span class="block text-[10px] text-gray-500 uppercase font-semibold">{{ activeReport === 'sales' ? t`Total Sales` : t`Total Purchases` }}</span>
              <span class="text-sm font-bold font-mono text-gray-900">{{ formatMoney(summaryStats.totalAmount) }}</span>
            </div>
            <div>
              <span class="block text-[10px] text-gray-500 uppercase font-semibold">{{ activeReport === 'sales' ? t`Received Amount` : t`Paid Amount` }}</span>
              <span class="text-sm font-bold font-mono text-emerald-700">{{ formatMoney(summaryStats.paidAmount) }}</span>
            </div>
            <div>
              <span class="block text-[10px] text-gray-500 uppercase font-semibold">{{ t`Unpaid Balance` }}</span>
              <span class="text-sm font-bold font-mono text-amber-700">{{ formatMoney(summaryStats.balanceAmount) }}</span>
            </div>
          </div>

          <!-- Document Table -->
          <table class="w-full border-collapse text-xs mt-4">
            <thead>
              <tr class="bg-teal-600 text-white font-semibold">
                <th class="py-2.5 px-3 text-center border border-teal-700 w-12">{{ t`S.N` }}</th>
                <th class="py-2.5 px-3 text-left border border-teal-700">{{ t`Date` }}</th>
                <th class="py-2.5 px-3 text-left border border-teal-700">{{ activeReport === 'sales' ? t`Invoice No` : t`Bill No` }}</th>
                <th class="py-2.5 px-3 text-left border border-teal-700">{{ activeReport === 'sales' ? t`Customer Name` : t`Supplier Name` }}</th>
                <th class="py-2.5 px-3 text-right border border-teal-700">{{ t`Total Amount` }}</th>
                <th class="py-2.5 px-3 text-right border border-teal-700">{{ activeReport === 'sales' ? t`Received Amount` : t`Paid Amount` }}</th>
                <th class="py-2.5 px-3 text-right border border-teal-700">{{ t`Balance Amount` }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, idx) in filteredRows"
                :key="row.name"
                class="border-b border-gray-200"
                :class="idx % 2 === 1 ? 'bg-gray-50/50' : ''"
              >
                <td class="py-2 px-3 border border-gray-200 text-center text-gray-500 font-mono">{{ idx + 1 }}</td>
                <td class="py-2 px-3 border border-gray-200 font-mono">{{ formatDisplayDate(row.date) }}</td>
                <td class="py-2 px-3 border border-gray-200 font-mono font-semibold text-gray-800">{{ row.name }}</td>
                <td class="py-2 px-3 border border-gray-200">{{ row.party || '—' }}</td>
                <td class="py-2 px-3 border border-gray-200 text-right font-mono font-semibold">{{ formatMoney(row.grandTotal) }}</td>
                <td class="py-2 px-3 border border-gray-200 text-right font-mono text-emerald-700">
                  {{ row.paidAmount > 0.005 ? formatMoney(row.paidAmount) : '--' }}
                </td>
                <td class="py-2 px-3 border border-gray-200 text-right font-mono text-amber-700">
                  {{ row.balanceAmount > 0.005 ? formatMoney(row.balanceAmount) : '--' }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="bg-gray-100 font-bold border-t-2 border-gray-400">
                <td colspan="4" class="py-2.5 px-3 border border-gray-300 text-left uppercase">
                  {{ t`TOTAL (${filteredRows.length} ENTRIES)` }}
                </td>
                <td class="py-2.5 px-3 border border-gray-300 text-right font-mono">{{ formatMoney(summaryStats.totalAmount) }}</td>
                <td class="py-2.5 px-3 border border-gray-300 text-right font-mono text-emerald-700">{{ formatMoney(summaryStats.paidAmount) }}</td>
                <td class="py-2.5 px-3 border border-gray-300 text-right font-mono text-amber-700">{{ formatMoney(summaryStats.balanceAmount) }}</td>
              </tr>
            </tfoot>
          </table>

          <!-- Authorized Signature (if present) -->
          <div v-if="companySignature" class="flex justify-end mt-8 mb-2">
            <div class="text-center w-40">
              <img :src="companySignature" alt="Authorized Signature" class="h-12 max-w-full object-contain mx-auto mb-1" />
              <div class="border-t border-gray-400 pt-1 text-xs font-semibold text-gray-700">
                {{ t`Authorized Signature` }}
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="mt-10 pt-4 border-t border-gray-200 text-center text-[10px] text-gray-400 flex items-center justify-between">
            <span>Report generated from VEYRO &bull; Business, in Balance.</span>
            <span>Document confidential &bull; Page 1 of 1</span>
          </div>
        </div>
      </div>
    </div>

    <!-- View 2: Standard Interactive Hub View -->
    <div v-else class="flex flex-col w-full h-full overflow-hidden">
      <!-- Top Header Bar with Report Switcher & Actions -->
      <header class="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/60 flex-shrink-0">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <!-- Title & Subtitle -->
          <div class="flex items-center gap-3">
            <div>
              <div class="flex items-center gap-2.5">
                <h1 class="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                  {{ activeReport === 'sales' ? t`Sales Report` : t`Purchase Report` }}
                </h1>
                <span
                  class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
                  :class="activeReport === 'sales'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                    : 'bg-teal-50 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300 border-teal-200 dark:border-teal-800'"
                >
                  {{ activeReport === 'sales' ? t`Customer Invoices` : t`Vendor Bills` }}
                </span>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {{ activeReport === 'sales'
                  ? t`Comprehensive view of all customer sales invoices, collections, and dues.`
                  : t`Comprehensive view of all supplier purchase bills, disbursements, and dues.` }}
              </p>
            </div>
          </div>

          <!-- Top Right Actions & Report Switcher -->
          <div class="flex flex-wrap items-center gap-2.5">
            <!-- Sales / Purchase Segmented Switcher -->
            <div class="p-1 bg-gray-200/80 dark:bg-gray-800 rounded-lg flex items-center gap-1 border border-gray-300/60 dark:border-gray-700 shadow-inner">
              <button
                type="button"
                class="px-3.5 py-1.5 text-xs font-semibold rounded-md transition duration-150 flex items-center gap-1.5"
                :class="activeReport === 'sales'
                  ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'"
                @click="switchReport('sales')"
              >
                <feather-icon name="shopping-bag" class="w-3.5 h-3.5" />
                <span>{{ t`Sales Report` }}</span>
              </button>
              <button
                type="button"
                class="px-3.5 py-1.5 text-xs font-semibold rounded-md transition duration-150 flex items-center gap-1.5"
                :class="activeReport === 'purchase'
                  ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'"
                @click="switchReport('purchase')"
              >
                <feather-icon name="shopping-cart" class="w-3.5 h-3.5" />
                <span>{{ t`Purchase Report` }}</span>
              </button>
            </div>

            <!-- Print View Button -->
            <button
              type="button"
              class="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition flex items-center gap-1.5 shadow-sm"
              :title="t`Open Print & Document View`"
              @click="isPrintView = true"
            >
              <feather-icon name="printer" class="w-3.5 h-3.5" />
              <span>{{ t`Print View` }}</span>
            </button>

            <!-- Download Excel Button -->
            <button
              type="button"
              class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 transition flex items-center gap-1.5 shadow-sm"
              :title="t`Download Excel / CSV spreadsheet`"
              @click="exportExcel"
            >
              <feather-icon name="download" class="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              <span>{{ t`Download Excel` }}</span>
            </button>

            <!-- Refresh Button -->
            <button
              type="button"
              class="p-2 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750 transition shadow-sm"
              :title="t`Refresh report data`"
              @click="loadReportData"
            >
              <feather-icon
                name="refresh-cw"
                class="w-3.5 h-3.5"
                :class="{ 'animate-spin': loading }"
              />
            </button>
          </div>
        </div>
      </header>

    <!-- Scrollable Main Container -->
    <div class="flex-1 overflow-y-auto custom-scroll custom-scroll-thumb1 p-6 space-y-6">
      <!-- 4 Executive Summary Cards -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Card 1: Total Entries -->
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-850 p-4 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">
              {{ activeReport === 'sales' ? t`Total Sales` : t`Total Purchase` }}
            </span>
            <div class="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <feather-icon :name="activeReport === 'sales' ? 'file-text' : 'shopping-cart'" class="w-3.5 h-3.5" />
            </div>
          </div>
          <div class="mt-3">
            <h2 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 font-mono">
              {{ summaryStats.count }} <span class="text-sm font-normal text-gray-500 dark:text-gray-400">{{ t`Entries` }}</span>
            </h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ activeReport === 'sales' ? t`Total customer invoices` : t`Total supplier purchase bills` }}
            </p>
          </div>
        </div>

        <!-- Card 2: Total Amount -->
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-850 p-4 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">
              {{ activeReport === 'sales' ? t`Total Sales Amount` : t`Total Purchase Amount` }}
            </span>
            <div class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <feather-icon name="dollar-sign" class="w-3.5 h-3.5" />
            </div>
          </div>
          <div class="mt-3">
            <h2 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 font-mono">
              {{ formatMoney(summaryStats.totalAmount) }}
            </h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ activeReport === 'sales' ? t`Gross sales revenue` : t`Gross purchase expenditure` }}
            </p>
          </div>
        </div>

        <!-- Card 3: Received / Paid Amount -->
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-850 p-4 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">
              {{ activeReport === 'sales' ? t`Received Amount` : t`Paid Amount` }}
            </span>
            <div class="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 flex items-center justify-center">
              <feather-icon name="check-circle" class="w-3.5 h-3.5" />
            </div>
          </div>
          <div class="mt-3">
            <h2
              class="text-2xl font-bold tracking-tight font-mono"
              :class="summaryStats.paidAmount > 0.005 ? 'text-teal-600 dark:text-teal-300' : 'text-gray-900 dark:text-gray-100'"
            >
              {{ formatMoney(summaryStats.paidAmount) }}
            </h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ activeReport === 'sales' ? t`Collections deposited` : t`Disbursements paid to vendors` }}
            </p>
          </div>
        </div>

        <!-- Card 4: Unpaid Amount -->
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-850 p-4 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">
              {{ t`Unpaid Amount` }}
            </span>
            <div class="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <feather-icon name="alert-circle" class="w-3.5 h-3.5" />
            </div>
          </div>
          <div class="mt-3">
            <h2
              class="text-2xl font-bold tracking-tight font-mono"
              :class="summaryStats.balanceAmount > 0.005 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-gray-100'"
            >
              {{ formatMoney(summaryStats.balanceAmount) }}
            </h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ activeReport === 'sales' ? t`Outstanding customer dues` : t`Outstanding supplier balances` }}
            </p>
          </div>
        </div>
      </section>

      <!-- Interactive Filters Toolbar -->
      <section class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850 p-3.5 shadow-sm space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <!-- Left: Search Box -->
          <div class="relative min-w-[240px] flex-1 max-w-sm">
            <feather-icon name="search" class="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              v-model="searchQuery"
              type="search"
              :placeholder="activeReport === 'sales' ? t`Search by invoice or customer...` : t`Search by bill or supplier...`"
              class="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition shadow-sm"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              @click="searchQuery = ''"
            >
              <feather-icon name="x" class="w-3 h-3" />
            </button>
          </div>

          <!-- Middle / Right: Status Dropdown, Date Presets, Sort Dropdown -->
          <div class="flex flex-wrap items-center gap-2.5">
            <!-- Status Dropdown -->
            <div class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span class="hidden sm:inline font-medium">{{ t`Status:` }}</span>
              <select
                v-model="selectedStatus"
                class="px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 shadow-sm cursor-pointer"
              >
                <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <!-- Vertical Date Period Dropdown Selector -->
            <div class="relative" ref="dateDropdownContainer">
              <button
                type="button"
                data-testid="report-date-preset-trigger"
                class="px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-blue-500 dark:hover:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm cursor-pointer flex items-center gap-1.5 transition select-none"
                @click.stop="toggleDateDropdown"
              >
                <feather-icon name="calendar" class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span class="font-medium">{{ activeDatePresetLabel }}</span>
                <feather-icon
                  name="chevron-down"
                  class="w-3.5 h-3.5 text-gray-400 transition-transform duration-150"
                  :class="{ 'rotate-180': isDateDropdownOpen }"
                />
              </button>

              <!-- Vertical Dropdown Options Menu -->
              <div
                v-if="isDateDropdownOpen"
                class="absolute right-0 mt-1.5 w-44 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
              >
                <div class="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {{ t`Date Filter` }}
                </div>
                <button
                  v-for="preset in datePresets"
                  :key="preset.value"
                  type="button"
                  :data-testid="`report-date-preset-${preset.value}`"
                  class="w-full text-left px-3 py-2 flex items-center justify-between text-xs transition rounded-md"
                  :class="selectedDatePreset === preset.value
                    ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'"
                  @click.stop="onSelectDatePreset(preset.value)"
                >
                  <span>{{ preset.label }}</span>
                  <feather-icon
                    v-if="selectedDatePreset === preset.value"
                    name="check"
                    class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400"
                  />
                </button>
              </div>
            </div>

            <!-- Sort By Selector -->
            <div class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span class="hidden sm:inline font-medium">{{ t`Sort By:` }}</span>
              <select
                v-model="sortBy"
                class="px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 shadow-sm cursor-pointer"
              >
                <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Custom Date Range Row (Revealed when Custom is selected) -->
        <div
          v-if="selectedDatePreset === 'custom'"
          class="pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-3 text-xs"
        >
          <span class="font-medium text-gray-600 dark:text-gray-300">{{ t`Custom Range:` }}</span>
          <div class="flex items-center gap-2">
            <label class="text-gray-500 dark:text-gray-400">{{ t`From:` }}</label>
            <input
              v-model="filterFromDate"
              type="date"
              class="px-2.5 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs"
            />
          </div>
          <div class="flex items-center gap-2">
            <label class="text-gray-500 dark:text-gray-400">{{ t`To:` }}</label>
            <input
              v-model="filterToDate"
              type="date"
              class="px-2.5 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs"
            />
          </div>
          <button
            v-if="filterFromDate || filterToDate"
            type="button"
            class="text-xs text-red-600 dark:text-red-400 hover:underline ml-auto"
            @click="clearCustomRange"
          >
            {{ t`Reset Dates` }}
          </button>
        </div>
      </section>

      <!-- Ledger Table Section (Streamlined to 6 Columns) -->
      <section class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-850 shadow-sm overflow-hidden">
        <div class="overflow-x-auto custom-scroll">
          <table class="w-full text-left border-collapse text-xs">
            <!-- Table Headers -->
            <thead class="bg-gray-100/70 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 uppercase tracking-wider font-semibold">
              <tr>
                <th scope="col" class="py-3 px-4 whitespace-nowrap">{{ t`Date` }}</th>
                <th scope="col" class="py-3 px-4 whitespace-nowrap">
                  {{ activeReport === 'sales' ? t`Invoice No` : t`Bill No` }}
                </th>
                <th scope="col" class="py-3 px-4 whitespace-nowrap">
                  {{ activeReport === 'sales' ? t`Party Name` : t`Supplier Name` }}
                </th>
                <th scope="col" class="py-3 px-4 text-right whitespace-nowrap">{{ t`Total Amount` }}</th>
                <th scope="col" class="py-3 px-4 text-right whitespace-nowrap">
                  {{ activeReport === 'sales' ? t`Received Amount` : t`Paid Amount` }}
                </th>
                <th scope="col" class="py-3 px-4 text-right whitespace-nowrap">{{ t`Balance Amount` }}</th>
              </tr>
            </thead>
            <tbody
              class="divide-y divide-gray-200 dark:divide-gray-800 transition-opacity duration-150"
              :class="{ 'opacity-60 pointer-events-none': loading }"
            >
              <!-- Loading Spinner Row -->
              <tr v-if="loading && !invoices.length">
                <td colspan="6" class="py-16 text-center text-xs text-gray-500 dark:text-gray-400">
                  <feather-icon name="refresh-cw" class="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                  <p>{{ t`Loading report data...` }}</p>
                </td>
              </tr>

              <!-- Empty State Row -->
              <tr v-else-if="!filteredRows.length">
                <td colspan="6" class="py-16 text-center text-xs text-gray-500 dark:text-gray-400">
                  <feather-icon name="file-text" class="w-8 h-8 mx-auto mb-2 text-gray-400 opacity-60" />
                  <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {{ t`No Transactions Found` }}
                  </p>
                  <p class="mt-1 text-gray-400 max-w-sm mx-auto">
                    {{ t`No records match this report type, filter criteria, and date range.` }}
                  </p>
                </td>
              </tr>

              <!-- Transaction Data Rows -->
              <tr
                v-for="row in filteredRows"
                :key="row.name"
                class="hover:bg-blue-50/70 dark:hover:bg-gray-800/80 cursor-pointer transition-colors group"
                :title="t`Click to open ${row.name}`"
                @click="openInvoiceDoc(row)"
              >
                <!-- 1. Date -->
                <td class="py-2.5 px-4 text-gray-600 dark:text-gray-400 whitespace-nowrap font-mono text-xs" :title="row.date">
                  {{ formatDisplayDate(row.date) }}
                </td>

                <!-- 2. Invoice / Bill No (bold monospace clickable link) -->
                <td class="py-2.5 px-4 whitespace-nowrap font-semibold font-mono text-xs text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-1.5">
                  <span>{{ row.name }}</span>
                  <feather-icon name="arrow-up-right" class="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span
                    v-if="row.status === 'DRAFT'"
                    class="ms-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 no-underline"
                  >
                    {{ t`Draft` }}
                  </span>
                </td>

                <!-- 3. Party Name / Supplier Name -->
                <td class="py-2.5 px-4 text-gray-800 dark:text-gray-200 font-medium whitespace-nowrap max-w-xs truncate" :title="row.party || ''">
                  {{ row.party || '—' }}
                </td>

                <!-- 4. Total Amount -->
                <td class="py-2.5 px-4 text-right font-mono font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                  {{ formatMoney(row.grandTotal) }}
                </td>

                <!-- 5. Received / Paid Amount -->
                <td class="py-2.5 px-4 text-right font-mono text-gray-600 dark:text-gray-300 whitespace-nowrap">
                  <span v-if="row.paidAmount > 0.005" class="text-teal-600 dark:text-teal-300 font-semibold">
                    {{ formatMoney(row.paidAmount) }}
                  </span>
                  <span v-else class="text-gray-400">--</span>
                </td>

                <!-- 6. Balance Amount -->
                <td class="py-2.5 px-4 text-right font-mono font-semibold whitespace-nowrap">
                  <span v-if="row.balanceAmount > 0.005" class="text-amber-600 dark:text-amber-400">
                    {{ formatMoney(row.balanceAmount) }}
                  </span>
                  <span v-else class="text-gray-400">--</span>
                </td>
              </tr>
            </tbody>

            <!-- Table Footer: Totals Row -->
            <tfoot v-if="filteredRows.length" class="bg-gray-100/80 dark:bg-gray-800/90 font-semibold border-t-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100">
              <tr>
                <td colspan="3" class="py-3 px-4 text-left text-xs uppercase tracking-wider">
                  {{ t`Total` }} ({{ filteredRows.length }} {{ t`Entries` }})
                </td>
                <td class="py-3 px-4 text-right font-mono text-xs">
                  {{ formatMoney(summaryStats.totalAmount) }}
                </td>
                <td class="py-3 px-4 text-right font-mono text-xs text-teal-600 dark:text-teal-300 font-bold">
                  {{ formatMoney(summaryStats.paidAmount) }}
                </td>
                <td class="py-3 px-4 text-right font-mono text-xs text-amber-600 dark:text-amber-400 font-bold">
                  {{ formatMoney(summaryStats.balanceAmount) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { fyo } from 'src/initFyo';
import { dateKey } from 'utils/standardPrint';
import { showToast } from 'src/utils/interactive';
import { getSavePath, showExportInFolder } from 'src/utils/ui';
import { generateCSV } from 'utils/csvParser';
import { runSingleFlight, SingleFlightState } from 'src/utils/singleFlight';

export interface ReportInvoiceRow {
  name: string;
  party: string;
  date: string;
  status: 'PAID' | 'UNPAID' | 'PARTIALLY PAID' | 'DRAFT';
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  note: string;
  submitted: boolean;
  cancelled: boolean;
  schemaName: 'SalesInvoice' | 'PurchaseInvoice';
}

export default defineComponent({
  name: 'ReportsHub',
  props: {
    reportType: {
      type: String as PropType<'sales' | 'purchase'>,
      default: 'sales',
    },
    darkMode: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      activeReport: (this.reportType === 'purchase' ? 'purchase' : 'sales') as 'sales' | 'purchase',
      invoices: [] as ReportInvoiceRow[],
      loading: false,
      salesFlightState: { promise: null } as SingleFlightState<void>,
      purchaseFlightState: { promise: null } as SingleFlightState<void>,
      searchQuery: '',
      selectedStatus: 'all' as 'all' | 'paid' | 'unpaid' | 'partial' | 'draft',
      selectedDatePreset: 'all' as 'all' | 'today' | 'yesterday' | 'this_month' | 'this_year' | 'custom',
      filterFromDate: '',
      filterToDate: '',
      sortBy: 'date_desc' as 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'name_asc',
      isPrintView: false,
      isDateDropdownOpen: false,
      boundClickListener: null as ((e: MouseEvent) => void) | null,
      boundKeydownListener: null as ((e: KeyboardEvent) => void) | null,
    };
  },
  computed: {
    companyName(): string {
      const acc = fyo.singles?.AccountingSettings;
      const print = fyo.singles?.PrintSettings;
      return (
        (acc?.companyName as string) ||
        (print?.companyName as string) ||
        'Company'
      );
    },
    companySignature(): string {
      const print = fyo.singles?.PrintSettings;
      return (print?.authorizedSignature as unknown as string) || '';
    },
    companyLogo(): string {
      const print = fyo.singles?.PrintSettings;
      return (print?.logo as unknown as string) || '';
    },
    companyPhone(): string {
      const print = fyo.singles?.PrintSettings;
      return (print?.phone as string) || '';
    },
    companyEmail(): string {
      const print = fyo.singles?.PrintSettings;
      const acc = fyo.singles?.AccountingSettings;
      return (print?.email as string) || (acc?.email as string) || '';
    },
    companyAddress(): string {
      const print = fyo.singles?.PrintSettings;
      return (print?.address as string) || '';
    },
    dateRangeText(): string {
      if (this.filterFromDate && this.filterToDate) {
        return `${this.formatDisplayDate(this.filterFromDate)} → ${this.formatDisplayDate(this.filterToDate)}`;
      }
      if (this.filterFromDate) {
        return `From ${this.formatDisplayDate(this.filterFromDate)}`;
      }
      if (this.filterToDate) {
        return `Until ${this.formatDisplayDate(this.filterToDate)}`;
      }
      return this.activeDatePresetLabel;
    },
    activeDatePresetLabel(): string {
      const match = this.datePresets.find((p) => p.value === this.selectedDatePreset);
      return match ? match.label : this.t`All Time`;
    },
    datePresets() {
      return [
        { label: this.t`All Time`, value: 'all' as const },
        { label: this.t`Today`, value: 'today' as const },
        { label: this.t`Yesterday`, value: 'yesterday' as const },
        { label: this.t`This Month`, value: 'this_month' as const },
        { label: this.t`This Year`, value: 'this_year' as const },
        { label: this.t`Custom`, value: 'custom' as const },
      ];
    },
    statusOptions() {
      return [
        { label: this.t`All Status`, value: 'all' as const },
        { label: this.t`Paid`, value: 'paid' as const },
        { label: this.t`Unpaid`, value: 'unpaid' as const },
        { label: this.t`Partially Paid`, value: 'partial' as const },
        { label: this.t`Draft`, value: 'draft' as const },
      ];
    },
    sortOptions() {
      return [
        { label: this.t`Date (Newest First)`, value: 'date_desc' as const },
        { label: this.t`Date (Oldest First)`, value: 'date_asc' as const },
        { label: this.t`Total Amount (High to Low)`, value: 'amount_desc' as const },
        { label: this.t`Total Amount (Low to High)`, value: 'amount_asc' as const },
        { label: this.t`Voucher No (A-Z)`, value: 'name_asc' as const },
      ];
    },
    filteredRows(): ReportInvoiceRow[] {
      let result = [...this.invoices];

      // 1. Text Search (Voucher name or party name)
      const q = this.searchQuery.trim().toLowerCase();
      if (q) {
        result = result.filter((row) => {
          return (
            row.name.toLowerCase().includes(q) ||
            row.party.toLowerCase().includes(q)
          );
        });
      }

      // 2. Status Filter
      if (this.selectedStatus !== 'all') {
        result = result.filter((row) => {
          if (this.selectedStatus === 'paid') return row.status === 'PAID';
          if (this.selectedStatus === 'unpaid') return row.status === 'UNPAID';
          if (this.selectedStatus === 'partial') return row.status === 'PARTIALLY PAID';
          if (this.selectedStatus === 'draft') return row.status === 'DRAFT';
          return true;
        });
      }

      // 3. Date Filter (using timezone-safe date string slice to avoid UTC boundary shifts)
      if (this.filterFromDate || this.filterToDate) {
        result = result.filter((row) => {
          if (!row.date) return false;
          const rowKey = String(row.date).slice(0, 10);
          if (!rowKey) return false;
          if (this.filterFromDate && rowKey < this.filterFromDate) return false;
          if (this.filterToDate && rowKey > this.filterToDate) return false;
          return true;
        });
      }

      // 4. Sorting with deterministic tie-breaker
      result.sort((a, b) => {
        if (this.sortBy === 'date_desc') {
          const diff = String(b.date).localeCompare(String(a.date));
          return diff !== 0 ? diff : b.name.localeCompare(a.name);
        }
        if (this.sortBy === 'date_asc') {
          const diff = String(a.date).localeCompare(String(b.date));
          return diff !== 0 ? diff : a.name.localeCompare(b.name);
        }
        if (this.sortBy === 'amount_desc') {
          const diff = b.grandTotal - a.grandTotal;
          return diff !== 0 ? diff : b.name.localeCompare(a.name);
        }
        if (this.sortBy === 'amount_asc') {
          const diff = a.grandTotal - b.grandTotal;
          return diff !== 0 ? diff : a.name.localeCompare(b.name);
        }
        if (this.sortBy === 'name_asc') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });

      return result;
    },
    summaryStats() {
      let count = 0;
      let totalAmount = 0;
      let paidAmount = 0;
      let balanceAmount = 0;

      for (const row of this.filteredRows) {
        // Exclude unsubmitted draft vouchers from financial totals unless specifically filtered for draft
        if (!row.submitted && this.selectedStatus !== 'draft') {
          continue;
        }
        if (row.cancelled) {
          continue;
        }
        count += 1;
        totalAmount += row.grandTotal;
        paidAmount += row.paidAmount;
        balanceAmount += row.balanceAmount;
      }

      return {
        count,
        totalAmount,
        paidAmount,
        balanceAmount,
      };
    },
  },
  watch: {
    reportType(newVal) {
      if (newVal === 'purchase' || newVal === 'sales') {
        if (this.activeReport !== newVal) {
          this.activeReport = newVal;
          this.searchQuery = '';
          this.loadReportData();
        }
      }
    },
  },
  async mounted() {
    const param = this.$route?.params?.reportType || this.reportType;
    if (param === 'purchase' || param === 'sales') {
      this.activeReport = param;
    }
    this.boundClickListener = (e: MouseEvent) => {
      const el = this.$refs.dateDropdownContainer as HTMLElement | undefined;
      if (el && !el.contains(e.target as Node)) {
        this.closeDateDropdown();
      }
    };
    window.addEventListener('click', this.boundClickListener);
    this.boundKeydownListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.isPrintView) {
        this.isPrintView = false;
      }
    };
    window.addEventListener('keydown', this.boundKeydownListener);
    await this.loadReportData();
  },
  beforeUnmount() {
    if (this.boundClickListener) {
      window.removeEventListener('click', this.boundClickListener);
      this.boundClickListener = null;
    }
    if (this.boundKeydownListener) {
      window.removeEventListener('keydown', this.boundKeydownListener);
      this.boundKeydownListener = null;
    }
  },
  async activated() {
    const param = this.$route?.params?.reportType || this.reportType;
    const targetReport = param === 'purchase' ? 'purchase' : 'sales';
    if (this.activeReport !== targetReport) {
      this.activeReport = targetReport;
      this.searchQuery = '';
    }
    await this.loadReportData();
  },
  methods: {
    async switchReport(tab: 'sales' | 'purchase') {
      if (this.activeReport === tab) return;
      this.activeReport = tab;
      this.searchQuery = '';
      await this.$router.push(`/reports/${tab}`);
      await this.loadReportData();
    },
    async loadReportData() {
      const targetReport = this.activeReport;
      const flightState =
        targetReport === 'sales'
          ? this.salesFlightState
          : this.purchaseFlightState;
      return runSingleFlight(flightState, async () => {
        this.loading = true;
        try {
          const schemaName: 'SalesInvoice' | 'PurchaseInvoice' =
            targetReport === 'sales' ? 'SalesInvoice' : 'PurchaseInvoice';
          const rawDocs = await fyo.db.getAllRaw(schemaName, {
            fields: [
              'name',
              'party',
              'date',
              'grandTotal',
              'outstandingAmount',
              'submitted',
              'cancelled',
              'terms',
              'currency',
              'exchangeRate',
            ],
            orderBy: 'date',
            order: 'desc',
          });

          // Discard results if user switched tabs while query was in-flight
          if (this.activeReport !== targetReport) {
            return;
          }

          const rows: ReportInvoiceRow[] = [];
          for (const doc of rawDocs || []) {
            if (doc.cancelled) continue;
            const grandTotal = parseFloat(String(doc.grandTotal || '0')) || 0;
            const exchangeRate = parseFloat(String(doc.exchangeRate || '1')) || 1;
            const isSubmitted = Boolean(doc.submitted);
            const isCancelled = Boolean(doc.cancelled);

            // In Frappe Books / Fyo, draft invoices have outstandingAmount = 0 before submission.
            // For submitted invoices, outstandingAmount reflects true unpaid balance in company base currency.
            // Convert outstanding to document currency before calculating paid amount:
            const rawOutstanding = isSubmitted
              ? parseFloat(String(doc.outstandingAmount || '0')) || 0
              : null;
            const dueInDocCurrency =
              rawOutstanding !== null
                ? (exchangeRate > 0 ? rawOutstanding / exchangeRate : rawOutstanding)
                : grandTotal;
            const paid = isSubmitted
              ? Math.max(0, grandTotal - dueInDocCurrency)
              : 0;

            let status: ReportInvoiceRow['status'] = 'UNPAID';
            if (!isSubmitted) {
              status = 'DRAFT';
            } else if (dueInDocCurrency <= 0.005) {
              status = 'PAID';
            } else if (dueInDocCurrency >= grandTotal - 0.005) {
              status = 'UNPAID';
            } else {
              status = 'PARTIALLY PAID';
            }

            rows.push({
              name: String(doc.name || ''),
              party: String(doc.party || ''),
              date: String(doc.date || ''),
              status,
              grandTotal,
              paidAmount: paid,
              balanceAmount: dueInDocCurrency,
              note: String(doc.terms || ''),
              submitted: isSubmitted,
              cancelled: isCancelled,
              schemaName,
            });
          }

          this.invoices = rows;
        } catch (err) {
          if (this.activeReport === targetReport) {
            showToast({
              message: this.t`Failed to load report data: ${err instanceof Error ? err.message : String(err)}`,
              type: 'error',
            });
          }
        } finally {
          if (this.activeReport === targetReport) {
            this.loading = false;
          }
        }
      });
    },
    toggleDateDropdown() {
      this.isDateDropdownOpen = !this.isDateDropdownOpen;
    },
    closeDateDropdown() {
      this.isDateDropdownOpen = false;
    },
    onSelectDatePreset(preset: 'all' | 'today' | 'yesterday' | 'this_month' | 'this_year' | 'custom') {
      this.applyDatePreset(preset);
      this.isDateDropdownOpen = false;
    },
    applyDatePreset(preset: 'all' | 'today' | 'yesterday' | 'this_month' | 'this_year' | 'custom') {
      this.selectedDatePreset = preset;
      if (preset === 'custom') {
        return;
      }

      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();

      if (preset === 'all') {
        this.filterFromDate = '';
        this.filterToDate = '';
      } else if (preset === 'today') {
        const todayStr = dateKey(now);
        this.filterFromDate = todayStr;
        this.filterToDate = todayStr;
      } else if (preset === 'yesterday') {
        const yest = new Date();
        yest.setDate(yest.getDate() - 1);
        const yestStr = dateKey(yest);
        this.filterFromDate = yestStr;
        this.filterToDate = yestStr;
      } else if (preset === 'this_month') {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        this.filterFromDate = dateKey(firstDay);
        this.filterToDate = dateKey(lastDay);
      } else if (preset === 'this_year') {
        const firstDay = new Date(year, 0, 1);
        const lastDay = new Date(year, 11, 31);
        this.filterFromDate = dateKey(firstDay);
        this.filterToDate = dateKey(lastDay);
      }
    },
    clearCustomRange() {
      this.filterFromDate = '';
      this.filterToDate = '';
      this.selectedDatePreset = 'all';
    },
    formatMoney(amount: number | unknown): string {
      const num = typeof amount === 'number' ? amount : Number(amount || 0);
      try {
        return fyo.format(fyo.pesa(num), 'Currency');
      } catch {
        return (num < 0 ? '-' : '') + 'Tk. ' + Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
    },
    formatDate(d: string | Date | unknown): string {
      if (!d) return '—';
      return String(d).slice(0, 10);
    },
    formatDisplayDate(d: string | Date | unknown): string {
      if (!d) return '—';
      try {
        const raw = String(d).slice(0, 10);
        const parts = raw.split('-');
        if (parts.length === 3) {
          const year = parts[0];
          const monthIdx = parseInt(parts[1], 10) - 1;
          const day = parts[2].padStart(2, '0');
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          if (monthIdx >= 0 && monthIdx < 12) {
            return `${day} ${months[monthIdx]} ${year}`;
          }
        }
        const dateObj = d instanceof Date ? d : new Date(String(d));
        if (Number.isNaN(dateObj.getTime())) return String(d).slice(0, 10);
        const day = dateObj.getDate().toString().padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[dateObj.getMonth()];
        const year = dateObj.getFullYear();
        return `${day} ${month} ${year}`;
      } catch {
        return String(d).slice(0, 10);
      }
    },
    async openInvoiceDoc(row: ReportInvoiceRow) {
      try {
        await this.$router.push(`/edit/${row.schemaName}/${encodeURIComponent(row.name)}`);
      } catch (err) {
        showToast({
          message: this.t`Failed to open voucher: ${err instanceof Error ? err.message : String(err)}`,
          type: 'error',
        });
      }
    },
    async exportExcel() {
      try {
        const rows = this.filteredRows;
        if (!rows.length) {
          showToast({ message: this.t`No data to export.`, type: 'info' });
          return;
        }

        const isSales = this.activeReport === 'sales';
        const headers = [
          'Date',
          isSales ? 'Invoice No' : 'Bill No',
          isSales ? 'Party Name' : 'Supplier Name',
          'Total Amount',
          isSales ? 'Received Amount' : 'Paid Amount',
          'Balance Amount',
        ];

        const data: (string | number)[][] = [headers];
        rows.forEach((r) => {
          data.push([
            this.formatDisplayDate(r.date),
            r.name,
            r.party,
            r.grandTotal.toFixed(2),
            r.paidAmount.toFixed(2),
            r.balanceAmount.toFixed(2),
          ]);
        });

        // Summary footer
        data.push([
          'Total (' + rows.length + ' Entries)',
          '',
          '',
          this.summaryStats.totalAmount.toFixed(2),
          this.summaryStats.paidAmount.toFixed(2),
          this.summaryStats.balanceAmount.toFixed(2),
        ]);

        const csvContent = generateCSV(data);
        const fileName = `${isSales ? 'Sales_Report' : 'Purchase_Report'}_${dateKey(new Date())}`;
        const { canceled, filePath } = await getSavePath(fileName, 'csv');

        if (canceled || !filePath) return;

        // Write UTF-8 BOM + CSV for immediate Excel compatibility
        await ipc.saveData('\ufeff' + csvContent, filePath);
        showExportInFolder(this.t`Report exported successfully.`, filePath);
      } catch (err) {
        showToast({
          message: this.t`Export failed: ${err instanceof Error ? err.message : String(err)}`,
          type: 'error',
        });
      }
    },
    constructReportPrintHtml(): string {
      const isSales = this.activeReport === 'sales';
      const title = isSales ? 'Sales Report' : 'Purchase Report';
      const docSubtitle = isSales ? 'Customer Invoices Ledger' : 'Supplier Bills Ledger';
      const partyCol = isSales ? 'Customer Name' : 'Supplier Name';
      const voucherCol = isSales ? 'Invoice No' : 'Bill No';
      const paidCol = isSales ? 'Received Amount' : 'Paid Amount';

      const fromText = this.filterFromDate ? this.formatDisplayDate(this.filterFromDate) : 'Beginning';
      const toText = this.filterToDate ? this.formatDisplayDate(this.filterToDate) : this.formatDisplayDate(new Date());

      const rowsHtml = this.filteredRows.map((r, i) => `
        <tr class="${i % 2 === 1 ? 'even' : ''}">
          <td class="center font-mono">${i + 1}</td>
          <td class="font-mono">${this.formatDisplayDate(r.date)}</td>
          <td class="font-mono font-bold">${r.name}</td>
          <td>${r.party || '—'}</td>
          <td class="num">${this.formatMoney(r.grandTotal)}</td>
          <td class="num ${r.paidAmount > 0.005 ? 'paid' : ''}">${r.paidAmount > 0.005 ? this.formatMoney(r.paidAmount) : '--'}</td>
          <td class="num ${r.balanceAmount > 0.005 ? 'unpaid' : ''}">${r.balanceAmount > 0.005 ? this.formatMoney(r.balanceAmount) : '--'}</td>
        </tr>
      `).join('');

      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title} - ${this.companyName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      margin: 0;
      padding: 0;
      font-size: 11px;
      background: #ffffff;
    }
    .header-box {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      border-bottom: 2px solid #0d9488;
      padding-bottom: 14px;
      margin-bottom: 16px;
    }
    .company-area {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .company-logo {
      width: 52px;
      height: 52px;
      object-fit: contain;
      border-radius: 4px;
    }
    .company-name {
      font-size: 17px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: -0.01em;
      color: #0f172a;
      margin: 0 0 3px 0;
    }
    .company-info {
      font-size: 10px;
      color: #475569;
      margin: 0;
      line-height: 1.4;
    }
    .report-title-area {
      text-align: right;
    }
    .report-title {
      font-size: 19px;
      font-weight: 800;
      color: #0f766e;
      margin: 0 0 3px 0;
    }
    .report-sub {
      font-size: 10px;
      color: #64748b;
      margin: 0 0 3px 0;
    }
    .report-range {
      font-size: 10.5px;
      font-weight: 600;
      color: #334155;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 9px 12px;
      margin-bottom: 14px;
    }
    .meta-cell .label {
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.04em;
    }
    .meta-cell .val {
      font-size: 13.5px;
      font-weight: 700;
      font-family: monospace;
      margin-top: 3px;
      color: #0f172a;
    }
    .meta-cell .val.paid {
      color: #059669;
    }
    .meta-cell .val.unpaid {
      color: #d97706;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    th {
      background-color: #0d9488 !important;
      color: #ffffff !important;
      font-weight: 700;
      text-align: left;
      padding: 6.5px 7px;
      border: 1px solid #0f766e;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    th.center, td.center {
      text-align: center;
    }
    th.num, td.num {
      text-align: right;
      font-family: monospace;
    }
    td {
      padding: 5.5px 7px;
      border: 1px solid #cbd5e1;
      color: #1e293b;
    }
    tr.even td {
      background-color: #f8fafc;
    }
    td.paid {
      color: #059669;
      font-weight: 600;
    }
    td.unpaid {
      color: #d97706;
      font-weight: 600;
    }
    tfoot td {
      background-color: #f1f5f9 !important;
      font-weight: 700;
      border-top: 2px solid #64748b;
      padding: 7px;
      font-size: 9.5px;
    }
    .font-mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .font-bold {
      font-weight: 700;
    }
    .footer {
      margin-top: 20px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      font-size: 8.5px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="header-box">
    <div class="company-area">
      ${this.companyLogo ? `<img src="${this.companyLogo}" class="company-logo" alt="Logo" />` : ''}
      <div>
        <h2 class="company-name">${this.companyName}</h2>
        <p class="company-info">
          ${[this.companyPhone, this.companyEmail].filter(Boolean).join(' &bull; ')}
          ${this.companyAddress ? `<br>${this.companyAddress}` : ''}
        </p>
      </div>
    </div>
    <div class="report-title-area">
      <h1 class="report-title">${title}</h1>
      <p class="report-sub">${docSubtitle}</p>
      <p class="report-range">${fromText} &rarr; ${toText}</p>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-cell">
      <div class="label">Total Entries</div>
      <div class="val">${this.filteredRows.length}</div>
    </div>
    <div class="meta-cell">
      <div class="label">${isSales ? 'Total Sales' : 'Total Purchases'}</div>
      <div class="val">${this.formatMoney(this.summaryStats.totalAmount)}</div>
    </div>
    <div class="meta-cell">
      <div class="label">${isSales ? 'Received Amount' : 'Paid Amount'}</div>
      <div class="val paid">${this.formatMoney(this.summaryStats.paidAmount)}</div>
    </div>
    <div class="meta-cell">
      <div class="label">Outstanding Dues</div>
      <div class="val unpaid">${this.formatMoney(this.summaryStats.balanceAmount)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="center" style="width: 34px;">S.N.</th>
        <th style="width: 75px;">Date</th>
        <th style="width: 90px;">${voucherCol}</th>
        <th>${partyCol}</th>
        <th class="num" style="width: 95px;">Total Amount</th>
        <th class="num" style="width: 95px;">${paidCol}</th>
        <th class="num" style="width: 95px;">Balance Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="4">TOTAL (${this.filteredRows.length} ENTRIES)</td>
        <td class="num">${this.formatMoney(this.summaryStats.totalAmount)}</td>
        <td class="num" style="color: #059669;">${this.formatMoney(this.summaryStats.paidAmount)}</td>
        <td class="num" style="color: #d97706;">${this.formatMoney(this.summaryStats.balanceAmount)}</td>
      </tr>
    </tfoot>
  </table>

  ${this.companySignature ? `
  <div style="display: flex; justify-content: flex-end; margin-top: 36px; margin-bottom: 12px; page-break-inside: avoid; break-inside: avoid;">
    <div style="text-align: center; width: 160px;">
      <img src="${this.companySignature}" style="max-height: 52px; max-width: 150px; object-fit: contain; margin: 0 auto 6px; display: block;" alt="Authorized Signature" />
      <div style="border-top: 1px solid #475569; padding-top: 5px; font-size: 11px; font-weight: 600; color: #1e293b;">
        Authorized Signature
      </div>
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <span>Report exported from VEYRO &bull; Business, in Balance.</span>
    <span>Confidential &bull; Page 1 of 1</span>
  </div>
</body>
</html>`;
    },
    async printDocumentDirectly() {
      try {
        const html = this.constructReportPrintHtml();
        if (typeof ipc !== 'undefined' && typeof ipc.printDocument === 'function') {
          const success = await ipc.printDocument(html, 21, 29.7);
          if (success) {
            showToast({ message: this.t`Print Successful`, type: 'success' });
          } else {
            showToast({ message: this.t`Print Failed`, type: 'error' });
          }
        } else {
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.print();
          } else {
            showToast({ message: this.t`Please allow popups to print report.`, type: 'warning' });
          }
        }
      } catch (err) {
        showToast({
          message: this.t`Print failed: ${err instanceof Error ? err.message : String(err)}`,
          type: 'error',
        });
      }
    },
    async exportPdf() {
      const isSales = this.activeReport === 'sales';
      const title = isSales ? 'Sales_Report' : 'Purchase_Report';
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const fileName = `${title}_${dateStr}`;

      try {
        const { canceled, filePath } = await getSavePath(fileName, 'pdf');
        if (canceled || !filePath) return;

        const html = this.constructReportPrintHtml();
        if (typeof ipc !== 'undefined' && typeof ipc.makePDF === 'function') {
          const success = await ipc.makePDF(html, filePath, 21, 29.7);
          if (success) {
            showExportInFolder(this.t`Save as PDF Successful`, filePath);
          } else {
            showToast({
              message: this.t`Export Failed`,
              type: 'error',
            });
          }
        } else {
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.print();
          } else {
            showToast({
              message: this.t`Please allow popups to export report.`,
              type: 'warning',
            });
          }
        }
      } catch (err) {
        showToast({
          message: this.t`Export failed: ${err instanceof Error ? err.message : String(err)}`,
          type: 'error',
        });
      }
    },
    printReport() {
      return this.exportPdf();
    },
  },
});
</script>

<style scoped>
.custom-scroll::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scroll-thumb1::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.4);
  border-radius: 4px;
}
.custom-scroll-thumb1::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}
</style>
