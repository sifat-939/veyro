<template>
  <div
    class="flex h-screen w-full overflow-hidden bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
    tabindex="0"
    @keydown.down.exact="onKeyDownList(1, $event)"
    @keydown.up.exact="onKeyDownList(-1, $event)"
  >
    <!-- LEFT COLUMN: Party List & Filtering (Strictly Party Names Only) -->
    <div
      class="w-72 md:w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full bg-gray-25 dark:bg-gray-890"
    >
      <!-- Left Header -->
      <div class="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-2 bg-white dark:bg-gray-850">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 flex items-center justify-center flex-shrink-0 text-blue-700 dark:text-blue-300">
            <feather-icon name="users" class="w-4 h-4" />
          </div>
          <div>
            <h1 class="text-sm font-bold truncate leading-tight text-gray-900 dark:text-gray-100">
              {{ t`Parties` }}
            </h1>
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">
              {{ filteredParties.length }} {{ t`total` }}
            </span>
          </div>
        </div>

        <Button
          type="primary"
          class="text-xs py-1.5 px-3 h-8 shadow-sm flex items-center gap-1.5 font-medium rounded-lg"
          @click="openNewPartyModal"
        >
          <feather-icon name="plus" class="w-3.5 h-3.5" />
          <span>{{ t`New Party` }}</span>
        </Button>
      </div>

      <!-- Search Box -->
      <div class="px-3 pt-3 pb-2">
        <div class="relative flex items-center">
          <feather-icon
            name="search"
            class="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none"
          />
          <input
            v-model="searchQuery"
            type="search"
            :placeholder="t`Search by name...`"
            class="w-full pl-9 pr-7 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500 shadow-sm"
            @keydown.esc="searchQuery = ''"
            @keydown.enter="filteredParties.length && selectParty(filteredParties[0])"
          />
          <button
            v-if="searchQuery"
            class="absolute right-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs p-0.5 rounded"
            @click="searchQuery = ''"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Segmented Role Filter Pills: All, Customer, Supplier, Both -->
      <div class="px-3 pb-2.5">
        <div class="p-1 bg-gray-100 dark:bg-gray-800 rounded-lg grid grid-cols-4 gap-1 text-center text-xs">
          <button
            v-for="filter in roleFilters"
            :key="filter.value"
            class="py-1 px-1 rounded-md text-xs transition duration-150 font-medium truncate"
            :class="
              selectedRoleFilter === filter.value
                ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 shadow-sm font-semibold'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            "
            @click="setRoleFilter(filter.value)"
          >
            {{ filter.label }}
          </button>
        </div>
      </div>

      <!-- Party Names List (Strictly Clean Business Names Only) -->
      <div
        ref="partyListContainer"
        class="flex-1 overflow-y-auto custom-scroll px-2 py-1 space-y-0.5 border-t border-gray-200 dark:border-gray-800"
      >
        <div v-if="loadingParties" class="p-6 text-center text-xs text-gray-500">
          <feather-icon name="refresh-cw" class="w-4 h-4 animate-spin mx-auto mb-2 text-blue-600" />
          {{ t`Loading parties...` }}
        </div>

        <div
          v-else-if="filteredParties.length === 0"
          class="p-8 text-center text-xs text-gray-500 dark:text-gray-400"
        >
          <div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-2 text-gray-400">
            <feather-icon name="user-x" class="w-5 h-5" />
          </div>
          <p class="font-medium mb-1">{{ t`No parties found` }}</p>
          <p class="text-xs text-gray-400 mb-3">{{ t`Try a different keyword or create one.` }}</p>
          <button
            v-if="searchQuery"
            class="text-xs text-blue-600 dark:text-blue-400 underline font-medium"
            @click="searchQuery = ''"
          >
            {{ t`Clear search` }}
          </button>
        </div>

        <div
          v-for="party in filteredParties"
          :id="'party-item-' + party.name"
          :key="party.name"
          class="group px-3 py-2.5 rounded-lg cursor-pointer text-xs transition duration-150 flex items-center gap-2.5 select-none"
          :class="
            selectedParty && selectedParty.name === party.name
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-semibold shadow-sm border-s-4 border-blue-600 dark:border-blue-400'
              : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium'
          "
          @click="selectParty(party)"
        >
          <!-- Subtle Monogram Indicator -->
          <div
            class="w-7 h-7 rounded-md text-xs font-bold flex items-center justify-center flex-shrink-0 transition-colors duration-150"
            :class="
              selectedParty && selectedParty.name === party.name
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 group-hover:bg-blue-100 group-hover:text-blue-800 dark:group-hover:bg-blue-900 dark:group-hover:text-blue-200'
            "
          >
            {{ getInitials(party.name) }}
          </div>

          <!-- Strictly Party Name (No subtitle clutter) -->
          <span class="truncate block text-sm leading-snug flex-1" :title="party.name">
            {{ party.name }}
          </span>
        </div>
      </div>
    </div>

    <!-- RIGHT COLUMN: Party Detail Workspace -->
    <div class="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-gray-900">
      <!-- When no party is selected -->
      <div
        v-if="!selectedParty"
        class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-900"
      >
        <div class="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400 shadow-sm">
          <feather-icon name="users" class="w-8 h-8" />
        </div>
        <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
          {{ t`Select a party or create a new one` }}
        </h2>
        <p class="text-xs text-gray-500 dark:text-gray-400 max-w-sm mb-5 leading-relaxed">
          {{ t`Track customer and supplier live running ledger balances, record sales, purchases, and instant payments.` }}
        </p>
        <Button type="primary" class="rounded-lg shadow-sm" @click="openNewPartyModal">
          {{ t`+ Add New Party` }}
        </Button>
      </div>

      <!-- When party is selected: Executive Cockpit Layout -->
      <div v-else class="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-900">
        <!-- Main Scrollable Area with Smooth Transition -->
        <div ref="detailScrollContainer" class="flex-1 overflow-y-auto custom-scroll p-4">
          <transition name="fade-subtle" mode="out-in">
            <div :key="selectedParty.name" class="space-y-4">
              <!-- TOP SECTION: DUAL BALANCED EXECUTIVE CARDS -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            <!-- Card 1 (Left 7 Cols): Party Identity & Supply Details -->
            <div class="lg:col-span-7 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm flex flex-col justify-between">
              <div>
                <div class="flex items-start justify-between gap-3 mb-3">
                  <div class="flex items-center gap-3 min-w-0">
                    <!-- Party Monogram Badge -->
                    <div class="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-bold text-base flex items-center justify-center shadow-sm flex-shrink-0">
                      {{ getInitials(selectedParty.name) }}
                    </div>

                    <div class="min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 truncate tracking-tight" :title="selectedParty.name">
                          {{ selectedParty.name }}
                        </h2>
                        <span
                          class="px-2.5 py-0.5 rounded-md text-xs font-semibold"
                          :class="getRoleBadgeClass(selectedParty.role)"
                        >
                          {{ formatRoleLabel(selectedParty.role) }}
                        </span>
                      </div>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {{ t`Party ID:` }} <span class="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">{{ selectedParty.name }}</span>
                      </p>
                    </div>
                  </div>

                  <!-- Header Quick Action Icons -->
                  <div class="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      class="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shadow-sm"
                      @click="editSelectedParty"
                      :title="t`Edit Party Profile`"
                    >
                      <feather-icon name="edit-2" class="w-3.5 h-3.5" />
                    </button>
                    <button
                      class="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shadow-sm"
                      :disabled="loadingLedger"
                      @click="loadSelectedPartyLedger"
                      :title="t`Refresh Ledger Data`"
                    >
                      <feather-icon name="refresh-cw" class="w-3.5 h-3.5" :class="{ 'animate-spin': loadingLedger }" />
                    </button>
                  </div>
                </div>

                <!-- Structured Supply & Contact Details Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div class="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
                    <feather-icon name="phone" class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <span class="truncate font-mono text-gray-700 dark:text-gray-300">{{ selectedParty.phone || t`No phone provided` }}</span>
                  </div>
                  <div class="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
                    <feather-icon name="mail" class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <span class="truncate text-gray-700 dark:text-gray-300">{{ selectedParty.email || t`No email provided` }}</span>
                  </div>
                  <div class="flex items-center gap-2 sm:col-span-2 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
                    <feather-icon name="map-pin" class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <span class="truncate text-gray-700 dark:text-gray-300">{{ selectedParty.address || t`No address provided` }}</span>
                  </div>
                </div>
              </div>

              <!-- Supply Meta Footer -->
              <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{{ t`Control Account:` }} <strong class="text-gray-800 dark:text-gray-200">{{ selectedParty.defaultAccount || 'Debtors / Creditors' }}</strong></span>
                <span>{{ t`Credit Terms:` }} <strong class="text-gray-800 dark:text-gray-200">{{ t`Standard (30 Days)` }}</strong></span>
              </div>
            </div>

            <!-- Card 2 (Right 5 Cols): Net Balance Verdict Card -->
            <div
              class="lg:col-span-5 rounded-xl border p-4 shadow-sm flex flex-col justify-between transition-all"
              :class="getBalanceCardClass(currentNetBalance)"
            >
              <div>
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {{ t`Net Running Balance` }}
                  </span>
                  <span
                    class="px-2.5 py-1 rounded-md text-xs font-semibold"
                    :class="getBalanceStatusPillClass(currentNetBalance)"
                  >
                    {{ getBalanceStatusText(currentNetBalance) }}
                  </span>
                </div>

                <div class="mt-3">
                  <h3
                    class="text-3xl lg:text-4xl font-extrabold tracking-tight tabular-nums font-mono"
                    :class="getBalanceTextColor(currentNetBalance)"
                  >
                    {{ formatMoney(Math.abs(currentNetBalance)) }}
                  </h3>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {{ getBalanceSubtitleText(currentNetBalance) }}
                  </p>
                </div>
              </div>

              <!-- Mini Financial Summary Metrics -->
              <div class="grid grid-cols-3 gap-2 text-center text-xs mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div class="px-2 py-1.5 rounded-lg bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div class="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">{{ t`Total Debit` }}</div>
                  <div class="font-bold text-gray-900 dark:text-gray-100 tabular-nums font-mono text-[11px] sm:text-xs mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                    {{ formatMoney(selectedPartyStatement?.debit ?? selectedParty.debit) }}
                  </div>
                </div>
                <div class="px-2 py-1.5 rounded-lg bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div class="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">{{ t`Total Credit` }}</div>
                  <div class="font-bold text-gray-900 dark:text-gray-100 tabular-nums font-mono text-[11px] sm:text-xs mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                    {{ formatMoney(selectedPartyStatement?.credit ?? selectedParty.credit) }}
                  </div>
                </div>
                <div class="px-2 py-1.5 rounded-lg bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div class="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">{{ t`Vouchers` }}</div>
                  <div class="font-bold text-gray-900 dark:text-gray-100 tabular-nums font-mono text-[11px] sm:text-xs mt-0.5">
                    {{ selectedPartyStatement?.rows?.length ?? selectedParty.count }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- MIDDLE SECTION: EXECUTIVE ACTION COMMAND BAR -->
          <div class="bg-white dark:bg-gray-850 p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-wrap items-center justify-between gap-2.5">
            <!-- Left Group: Transaction Commands (Inflow & Outflow) -->
            <div class="flex items-center flex-wrap gap-2">
              <!-- Inflow: Payment In -->
              <button
                class="flex items-center gap-1.5 py-2 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all active:scale-95"
                @click="openFastPayment('Receive')"
              >
                <feather-icon name="arrow-down-circle" class="w-4 h-4 flex-shrink-0" />
                <span>{{ t`Payment In` }}</span>
              </button>

              <!-- Inflow: New Sale -->
              <button
                class="flex items-center gap-1.5 py-2 px-3.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700 font-semibold text-xs transition-all active:scale-95"
                @click="createNewSale"
              >
                <feather-icon name="file-text" class="w-4 h-4 flex-shrink-0" />
                <span>{{ t`New Sale` }}</span>
              </button>

              <div class="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"></div>

              <!-- Outflow: Payment Out -->
              <button
                class="flex items-center gap-1.5 py-2 px-3.5 rounded-lg bg-white hover:bg-gray-50 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 font-semibold text-xs shadow-sm transition-all active:scale-95"
                @click="openFastPayment('Pay')"
              >
                <feather-icon name="arrow-up-circle" class="w-4 h-4 flex-shrink-0" />
                <span>{{ t`Payment Out` }}</span>
              </button>

              <!-- Outflow: New Purchase -->
              <button
                class="flex items-center gap-1.5 py-2 px-3.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700 font-semibold text-xs transition-all active:scale-95"
                @click="createNewPurchase"
              >
                <feather-icon name="shopping-cart" class="w-4 h-4 flex-shrink-0" />
                <span>{{ t`New Purchase` }}</span>
              </button>
            </div>

            <!-- Right Group: Statement & Utilities -->
            <div class="flex items-center gap-2">
              <button
                class="flex items-center gap-1.5 py-2 px-3.5 rounded-lg bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 font-semibold text-xs shadow-sm transition-all active:scale-95"
                @click="openStatementPrint"
              >
                <feather-icon name="printer" class="w-4 h-4 flex-shrink-0" />
                <span>{{ t`Print Statement` }}</span>
              </button>
            </div>
          </div>

          <!-- BOTTOM SECTION: RUNNING LEDGER TABLE -->
          <div class="bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <!-- Table Header Toolbar -->
            <div class="px-5 py-3 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300">
                  <feather-icon name="book-open" class="w-4 h-4" />
                </div>
                <div>
                  <h4 class="font-bold text-sm text-gray-900 dark:text-gray-100 leading-tight">
                    {{ t`Running Ledger Statement` }}
                  </h4>
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    {{ ledgerRows.length }} {{ t`entries shown` }}
                  </span>
                </div>
              </div>

              <!-- Period Presets & Filter Toolbar -->
              <div class="flex items-center flex-wrap gap-2 text-xs">
                <!-- Vertical Date Period Dropdown Selector -->
                <div class="relative" ref="partyDateDropdownContainer">
                  <button
                    type="button"
                    data-testid="party-date-preset-trigger"
                    class="px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-blue-500 dark:hover:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm cursor-pointer flex items-center gap-1.5 transition select-none"
                    @click.stop="togglePartyDateDropdown"
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
                    class="absolute left-0 mt-1.5 w-44 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div class="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      {{ t`Date Filter` }}
                    </div>
                    <button
                      v-for="preset in datePresets"
                      :key="preset.value"
                      type="button"
                      :data-testid="`party-date-preset-${preset.value}`"
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

                <!-- Text Search within ledger -->
                <div class="relative flex items-center">
                  <feather-icon name="search" class="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
                  <input
                    v-model="ledgerFilterQuery"
                    type="search"
                    :placeholder="t`Filter vouchers...`"
                    class="pl-8 pr-3 py-1 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 w-44"
                  />
                </div>
              </div>
            </div>

            <!-- Ledger Table -->
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-800 uppercase text-xs tracking-wider">
                  <tr>
                    <th class="py-3 px-4 w-12 text-center whitespace-nowrap">#</th>
                    <th class="py-3 px-4 whitespace-nowrap">{{ t`Date` }}</th>
                    <th class="py-3 px-4 whitespace-nowrap">{{ t`Type` }}</th>
                    <th class="py-3 px-4 text-right whitespace-nowrap">{{ t`Debit` }}</th>
                    <th class="py-3 px-4 text-right whitespace-nowrap">{{ t`Credit` }}</th>
                    <th class="py-3 px-4 text-right whitespace-nowrap">{{ t`Running Balance` }}</th>
                    <th class="py-3 px-4 text-left whitespace-nowrap">{{ t`Note` }}</th>
                  </tr>
                </thead>
                <tbody
                  class="divide-y divide-gray-200 dark:divide-gray-800 transition-opacity duration-150"
                  :class="{ 'opacity-60 pointer-events-none': loadingLedger && selectedPartyStatement }"
                >
                  <!-- Loading State -->
                  <tr v-if="loadingLedger && !selectedPartyStatement">
                    <td colspan="7" class="py-12 text-center text-xs text-gray-500 dark:text-gray-400">
                      <feather-icon name="refresh-cw" class="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                      <p class="font-medium text-gray-600 dark:text-gray-300">{{ t`Loading ledger transactions...` }}</p>
                    </td>
                  </tr>

                  <!-- Loaded Content -->
                  <template v-else>
                    <!-- Empty State -->
                    <tr v-if="ledgerRows.length === 0">
                      <td colspan="7" class="py-12 text-center text-gray-400 dark:text-gray-500 text-xs">
                        <feather-icon name="inbox" class="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                        <p class="font-medium text-gray-600 dark:text-gray-400">{{ t`No transactions recorded for this period.` }}</p>
                        <button
                          v-if="selectedDatePreset !== 'all' || ledgerFilterQuery"
                          class="text-blue-600 dark:text-blue-400 underline font-medium text-xs mt-2"
                          @click="resetLedgerFilters"
                        >
                          {{ t`View all transactions` }}
                        </button>
                      </td>
                    </tr>

                    <!-- Statement Rows (Latest on top, earlier below) -->
                    <tr
                      v-for="(row, idx) in ledgerRows"
                      :key="row.name || idx"
                      class="hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
                      @click="openReferenceDoc(row.referenceType, row.referenceName)"
                      :title="t`Click to open voucher ${row.referenceName || row.name}`"
                    >
                      <td class="py-2.5 px-4 text-center text-gray-400 tabular-nums font-mono whitespace-nowrap">
                        {{ idx + 1 }}
                      </td>
                      <td class="py-2.5 px-4 text-gray-700 dark:text-gray-300 whitespace-nowrap font-mono text-xs">
                        {{ row.day || formatDate(row.date) }}
                      </td>
                      <td class="py-2.5 px-4 whitespace-nowrap">
                        <span
                          class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border transition-colors group-hover:border-blue-400"
                          :class="getTransactionBadgeClass(row.referenceType)"
                        >
                          <feather-icon
                            :name="getTransactionIcon(row.referenceType, row.debit, row.credit)"
                            class="w-3 h-3"
                          />
                          <span>{{ formatReferenceTypeLabel(row.referenceType) }}</span>
                          <feather-icon name="external-link" class="w-3 h-3 opacity-0 group-hover:opacity-70 transition-opacity" />
                        </span>
                      </td>
                      <td class="py-2.5 px-4 text-right tabular-nums font-mono font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {{ row.debit > 0 ? formatMoney(row.debit) : '—' }}
                      </td>
                      <td class="py-2.5 px-4 text-right tabular-nums font-mono font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {{ row.credit > 0 ? formatMoney(row.credit) : '—' }}
                      </td>
                      <td
                        class="py-2.5 px-4 text-right tabular-nums font-mono font-bold whitespace-nowrap"
                        :class="getBalanceTextColor(row.balance)"
                      >
                        {{ formatBalanceLabel(row.balance) }}
                      </td>
                      <td class="py-2.5 px-4 text-left text-gray-600 dark:text-gray-400 max-w-xs truncate font-normal">
                        <span v-if="row.note" :title="row.note">{{ row.note }}</span>
                        <span v-else class="text-gray-300 dark:text-gray-600">—</span>
                      </td>
                    </tr>

                    <!-- Opening Balance Row (At bottom of reverse chronological ledger) -->
                    <tr v-if="openingBalance !== 0 || (filterFromDate && selectedPartyStatement)" class="bg-blue-50 dark:bg-blue-900 font-medium">
                      <td class="py-2.5 px-4 text-center text-gray-400 whitespace-nowrap">—</td>
                      <td class="py-2.5 px-4 text-gray-700 dark:text-gray-300 whitespace-nowrap font-mono text-xs">
                        {{ filterFromDate || t`Initial` }}
                      </td>
                      <td class="py-2.5 px-4 whitespace-nowrap">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                          {{ t`Opening Balance` }}
                        </span>
                      </td>
                      <td class="py-2.5 px-4 text-right tabular-nums font-mono text-gray-400 whitespace-nowrap">—</td>
                      <td class="py-2.5 px-4 text-right tabular-nums font-mono text-gray-400 whitespace-nowrap">—</td>
                      <td class="py-2.5 px-4 text-right tabular-nums font-mono font-bold whitespace-nowrap" :class="getBalanceTextColor(openingBalance)">
                        {{ formatBalanceLabel(openingBalance) }}
                      </td>
                      <td class="py-2.5 px-4 text-left text-gray-400 whitespace-nowrap font-mono text-xs">
                        {{ t`Period starting balance` }}
                      </td>
                    </tr>
                  </template>
                </tbody>

                <!-- Summary Footer (tfoot) -->
                <tfoot v-if="ledgerRows.length > 0" class="bg-gray-50 dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-700 font-bold text-xs">
                  <tr>
                    <td colspan="3" class="py-3 px-4 text-gray-800 dark:text-gray-200 whitespace-nowrap">
                      <span>{{ t`Period Total & Closing Balance` }}</span>
                      <span v-if="ledgerFilterQuery" class="text-xs font-normal text-gray-500 ms-1">
                        ({{ t`Showing` }} {{ ledgerRows.length }} {{ t`of` }} {{ selectedPartyStatement?.rows?.length ?? 0 }})
                      </span>
                    </td>
                    <td class="py-3 px-4 text-right tabular-nums font-mono text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {{ formatMoney(visibleDebitTotal) }}
                    </td>
                    <td class="py-3 px-4 text-right tabular-nums font-mono text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {{ formatMoney(visibleCreditTotal) }}
                    </td>
                    <td class="py-3 px-4 text-right tabular-nums font-mono font-extrabold whitespace-nowrap" :class="getBalanceTextColor(currentNetBalance)">
                      {{ formatBalanceLabel(currentNetBalance) }}
                    </td>
                    <td class="py-3 px-4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- QUICK PAYMENT MODAL (100% English & Bank Validation Compliant) -->
    <Modal :open-modal="showQuickPaymentModal" @closemodal="closeQuickPaymentModal">
      <div style="width: 480px; max-width: 90vw;" class="p-6 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-850 rounded-xl shadow-xl">
        <div class="flex items-center justify-between pb-3.5 border-b border-gray-200 dark:border-gray-800">
          <div class="flex items-center gap-2.5">
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
              :class="quickPaymentType === 'Receive' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-white dark:bg-gray-700'"
            >
              <feather-icon
                :name="quickPaymentType === 'Receive' ? 'arrow-down-circle' : 'arrow-up-circle'"
                class="w-4 h-4"
              />
            </div>
            <div>
              <h3 class="font-bold text-base leading-tight">
                {{ quickPaymentType === 'Receive' ? t`Payment In (Receive)` : t`Payment Out (Pay)` }}
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ quickPaymentType === 'Receive' ? t`Record money received from customer` : t`Record money paid to supplier` }}
              </p>
            </div>
          </div>
          <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-base p-1" @click="closeQuickPaymentModal">
            ✕
          </button>
        </div>

        <div class="mt-4 space-y-4">
          <!-- Selected Party Banner -->
          <div class="p-3 rounded-lg bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <feather-icon name="user" class="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span class="text-xs text-gray-600 dark:text-gray-300 font-medium">{{ t`Party:` }}</span>
            </div>
            <span class="text-xs font-bold text-blue-900 dark:text-blue-100">{{ selectedParty?.name }}</span>
          </div>

          <!-- Amount Input -->
          <div>
            <label class="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
              {{ t`Amount` }} <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <input
                ref="quickPaymentAmountInput"
                v-model.number="quickPaymentAmount"
                type="number"
                step="any"
                min="0.01"
                placeholder="0.00"
                class="w-full px-3.5 py-2.5 text-lg font-bold rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 tabular-nums font-mono shadow-sm"
                @keydown.enter="submitQuickPayment"
              />
            </div>
            <p v-if="quickPaymentAmount && quickPaymentAmount > 0" class="text-xs text-blue-700 dark:text-blue-300 font-mono mt-1 font-semibold">
              {{ formatMoney(quickPaymentAmount) }}
            </p>
          </div>

          <!-- Payment Method -->
          <div>
            <label class="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
              {{ t`Payment Method` }} <span class="text-red-500">*</span>
            </label>
            <select
              v-model="quickPaymentMethod"
              class="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
            >
              <option v-for="method in paymentMethods" :key="method.name" :value="method.name">
                {{ method.name }} ({{ method.type }})
              </option>
            </select>
          </div>

          <!-- Posting Date -->
          <div>
            <label class="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
              {{ t`Posting Date` }} <span class="text-red-500">*</span>
            </label>
            <input
              v-model="quickPaymentDate"
              type="date"
              class="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <!-- Reference / Cheque ID (Required for Bank methods to prevent validation crashes) -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                {{ isBankPaymentMethod ? t`Reference / Cheque No` : t`Reference / Note (Optional)` }}
                <span v-if="isBankPaymentMethod" class="text-red-500">*</span>
              </label>
              <span v-if="isBankPaymentMethod" class="text-xs text-blue-600 dark:text-blue-400 font-medium">
                {{ t`Required for Bank transactions` }}
              </span>
            </div>
            <input
              v-model="quickPaymentRef"
              type="text"
              :placeholder="isBankPaymentMethod ? t`e.g. CHQ-9901, TRX-0012` : t`e.g. Receipt no, remarks...`"
              class="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <!-- Clearance Date (Displayed for Bank payment methods) -->
          <div v-if="isBankPaymentMethod">
            <label class="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
              {{ t`Bank Clearance Date` }} <span class="text-red-500">*</span>
            </label>
            <input
              v-model="quickPaymentClearanceDate"
              type="date"
              class="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <!-- Error Alert -->
          <div v-if="quickPaymentError" class="p-3 rounded-lg text-xs bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-200 border border-red-200 dark:border-red-800">
            {{ quickPaymentError }}
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-2.5 pt-3.5 border-t border-gray-200 dark:border-gray-800">
          <Button class="rounded-lg" @click="closeQuickPaymentModal">
            {{ t`Cancel` }}
          </Button>
          <Button
            type="primary"
            class="rounded-lg shadow-sm font-semibold"
            :disabled="isSubmittingPayment || !quickPaymentAmount || quickPaymentAmount <= 0"
            @click="submitQuickPayment"
          >
            {{ isSubmittingPayment ? t`Saving Payment...` : t`Confirm & Save Payment` }}
          </Button>
        </div>
      </div>
    </Modal>

    <!-- NEW PARTY MODAL (100% English & Refined UI) -->
    <Modal :open-modal="showNewPartyModal" @closemodal="closeNewPartyModal">
      <div style="width: 480px; max-width: 90vw;" class="p-6 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-850 rounded-xl shadow-xl">
        <div class="flex items-center justify-between pb-3.5 border-b border-gray-200 dark:border-gray-800">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 shadow-sm">
              <feather-icon name="user-plus" class="w-4 h-4" />
            </div>
            <div>
              <h3 class="font-bold text-base leading-tight">
                {{ t`Create New Party` }}
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ t`Add a customer, supplier, or dual-role commercial entity` }}
              </p>
            </div>
          </div>
          <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-base p-1" @click="closeNewPartyModal">
            ✕
          </button>
        </div>

        <div class="mt-4 space-y-3.5">
          <!-- Party Name -->
          <div>
            <label class="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
              {{ t`Party Name` }} <span class="text-red-500">*</span>
            </label>
            <input
              ref="newPartyNameInput"
              v-model="newPartyName"
              type="text"
              :placeholder="t`e.g. Acme Corporation`"
              class="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
              @keydown.enter="submitNewParty"
            />
          </div>

          <!-- Role -->
          <div>
            <label class="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
              {{ t`Role` }} <span class="text-red-500">*</span>
            </label>
            <select
              v-model="newPartyRole"
              class="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
            >
              <option value="Both">{{ t`Both (Customer & Supplier)` }}</option>
              <option value="Customer">{{ t`Customer` }}</option>
              <option value="Supplier">{{ t`Supplier` }}</option>
            </select>
          </div>

          <!-- Phone & Email (2 Cols) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label class="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                {{ t`Phone` }}
              </label>
              <input
                v-model="newPartyPhone"
                type="tel"
                placeholder="+880 1XXXXXXXXX"
                class="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                {{ t`Email` }}
              </label>
              <input
                v-model="newPartyEmail"
                type="email"
                placeholder="contact@example.com"
                class="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <!-- Address -->
          <div>
            <label class="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
              {{ t`Address` }}
            </label>
            <textarea
              v-model="newPartyAddress"
              rows="2"
              :placeholder="t`Street address, City, District...`"
              class="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 resize-none"
            ></textarea>
          </div>

          <!-- Error Alert -->
          <div v-if="newPartyError" class="p-3 rounded-lg text-xs bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-200 border border-red-200 dark:border-red-800">
            {{ newPartyError }}
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-2.5 pt-3.5 border-t border-gray-200 dark:border-gray-800">
          <Button class="rounded-lg" @click="closeNewPartyModal">
            {{ t`Cancel` }}
          </Button>
          <Button
            type="primary"
            class="rounded-lg shadow-sm font-semibold"
            :disabled="isSubmittingNewParty || !newPartyName.trim()"
            @click="submitNewParty"
          >
            {{ isSubmittingNewParty ? t`Creating Party...` : t`Create Party` }}
          </Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script lang="ts">
import { defineComponent, nextTick } from 'vue';
import { fyo } from 'src/initFyo';
import { ModelNameEnum } from 'models/types';
import { PartyRole } from 'models/baseModels/Party/types';
import { buildStatement, dateKey, StatementEntry } from 'utils/standardPrint';
import { showToast } from 'src/utils/interactive';
import Button from 'src/components/Button.vue';
import Modal from 'src/components/Modal.vue';

interface PartyItem {
  name: string;
  role: string;
  phone: string;
  email: string;
  address: string;
  defaultAccount: string;
  balance: number;
  debit: number;
  credit: number;
  count: number;
}

interface StatementResult {
  opening: number;
  closing: number;
  debit: number;
  credit: number;
  rows: Array<StatementEntry & {
    day: string;
    debit: number;
    credit: number;
    balance: number;
    note?: string;
  }>;
}

export default defineComponent({
  name: 'PartyHub',
  components: { Button, Modal },
  props: {
    name: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      parties: [] as PartyItem[],
      loadingParties: false,
      loadingLedger: false,
      searchQuery: '',
      selectedRoleFilter: 'all',
      selectedParty: null as PartyItem | null,
      selectedPartyStatement: null as StatementResult | null,
      controlAccounts: new Set<string>(),

      // Ledger Filtering & Date Ranges
      ledgerFilterQuery: '',
      selectedDatePreset: 'all' as 'all' | 'today' | 'yesterday' | 'this_month' | 'this_year',
      filterFromDate: '',
      filterToDate: '',
      isDateDropdownOpen: false,
      boundClickListener: null as ((e: MouseEvent) => void) | null,

      // Quick Payment Modal State
      showQuickPaymentModal: false,
      quickPaymentType: 'Receive' as 'Receive' | 'Pay',
      quickPaymentAmount: null as number | null,
      quickPaymentMethod: 'Cash',
      quickPaymentDate: dateKey(new Date()),
      quickPaymentClearanceDate: dateKey(new Date()),
      quickPaymentRef: '',
      quickPaymentError: '',
      isSubmittingPayment: false,
      paymentMethods: [] as Array<{ name: string; type: string }>,

      // New Party Modal State
      showNewPartyModal: false,
      newPartyName: '',
      newPartyRole: 'Both' as PartyRole,
      newPartyPhone: '',
      newPartyEmail: '',
      newPartyAddress: '',
      newPartyError: '',
      isSubmittingNewParty: false,
    };
  },
  computed: {
    activeDatePresetLabel(): string {
      const match = this.datePresets.find((p) => p.value === this.selectedDatePreset);
      return match ? match.label : this.t`All Time`;
    },
    roleFilters(): Array<{ label: string; value: string }> {
      return [
        { label: this.t`All`, value: 'all' },
        { label: this.t`Customer`, value: 'Customer' },
        { label: this.t`Supplier`, value: 'Supplier' },
        { label: this.t`Both`, value: 'Both' },
      ];
    },
    datePresets(): Array<{ label: string; value: 'all' | 'today' | 'yesterday' | 'this_month' | 'this_year' }> {
      return [
        { label: this.t`All Time`, value: 'all' },
        { label: this.t`Today`, value: 'today' },
        { label: this.t`Yesterday`, value: 'yesterday' },
        { label: this.t`This Month`, value: 'this_month' },
        { label: this.t`This Year`, value: 'this_year' },
      ];
    },
    filteredParties(): PartyItem[] {
      const q = this.searchQuery.trim().toLowerCase();
      return this.parties.filter((party) => {
        // Role filter
        if (this.selectedRoleFilter !== 'all') {
          if (this.selectedRoleFilter === 'Customer') {
            if (party.role !== 'Customer' && party.role !== 'Both') return false;
          } else if (this.selectedRoleFilter === 'Supplier') {
            if (party.role !== 'Supplier' && party.role !== 'Both') return false;
          } else if (this.selectedRoleFilter === 'Both') {
            if (party.role !== 'Both') return false;
          }
        }

        // Search text
        if (q) {
          const matchName = party.name.toLowerCase().includes(q);
          const matchPhone = party.phone.toLowerCase().includes(q);
          const matchEmail = party.email.toLowerCase().includes(q);
          if (!matchName && !matchPhone && !matchEmail) return false;
        }

        return true;
      });
    },
    currentNetBalance(): number {
      if (this.selectedPartyStatement) {
        return this.selectedPartyStatement.closing;
      }
      return this.selectedParty?.balance ?? 0;
    },
    openingBalance(): number {
      return this.selectedPartyStatement?.opening ?? 0;
    },
    ledgerRows(): Array<StatementEntry & { day: string; debit: number; credit: number; balance: number; note?: string }> {
      const rows = this.selectedPartyStatement?.rows ?? [];
      const q = this.ledgerFilterQuery.trim().toLowerCase();
      let list = rows;
      if (q) {
        list = rows.filter((r) => {
          const typeLabel = this.formatReferenceTypeLabel(r.referenceType).toLowerCase();
          const rawType = (r.referenceType || '').toLowerCase();
          const refName = (r.referenceName || r.name || '').toLowerCase();
          const day = (r.day || '').toLowerCase();
          const debitStr = r.debit > 0 ? String(r.debit) : '';
          const creditStr = r.credit > 0 ? String(r.credit) : '';
          const noteStr = (r.note || '').toLowerCase();
          return (
            refName.includes(q) ||
            typeLabel.includes(q) ||
            rawType.includes(q) ||
            day.includes(q) ||
            debitStr.includes(q) ||
            creditStr.includes(q) ||
            noteStr.includes(q)
          );
        });
      }
      // Latest transaction on top, earlier transactions below
      return [...list].reverse();
    },
    visibleDebitTotal(): number {
      return this.ledgerRows.reduce((sum, r) => sum + (Number(r.debit) || 0), 0);
    },
    visibleCreditTotal(): number {
      return this.ledgerRows.reduce((sum, r) => sum + (Number(r.credit) || 0), 0);
    },
    isBankPaymentMethod(): boolean {
      const current = this.paymentMethods.find((m) => m.name === this.quickPaymentMethod);
      return current?.type === 'Bank';
    },
  },
  watch: {
    name(newName: string) {
      if (newName && this.parties.length) {
        const decoded = decodeURIComponent(newName);
        if (this.selectedParty?.name !== decoded && this.selectedParty?.name !== newName) {
          const found = this.parties.find((p) => p.name === decoded || p.name === newName);
          if (found) {
            // When navigating externally, if current filter hides the party, relax filter to all
            if (this.selectedRoleFilter !== 'all') {
              if (this.selectedRoleFilter === 'Customer' && found.role !== 'Customer' && found.role !== 'Both') {
                this.selectedRoleFilter = 'all';
              } else if (this.selectedRoleFilter === 'Supplier' && found.role !== 'Supplier' && found.role !== 'Both') {
                this.selectedRoleFilter = 'all';
              } else if (this.selectedRoleFilter === 'Both' && found.role !== 'Both') {
                this.selectedRoleFilter = 'all';
              }
            }
            this.selectParty(found);
          }
        }
      }
    },
  },
  async mounted() {
    this.boundClickListener = (e: MouseEvent) => {
      const el = this.$refs.partyDateDropdownContainer as HTMLElement | undefined;
      if (el && !el.contains(e.target as Node)) {
        this.closePartyDateDropdown();
      }
    };
    window.addEventListener('click', this.boundClickListener);
    await this.init();
  },
  beforeUnmount() {
    if (this.boundClickListener) {
      window.removeEventListener('click', this.boundClickListener);
      this.boundClickListener = null;
    }
  },
  async activated() {
    await this.init();
  },
  methods: {
    async init() {
      await this.loadPaymentMethods();
      await this.loadParties();
    },
    onKeyDownList(direction: number, event: KeyboardEvent) {
      // Don't intercept when user is typing in an input
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }
      if (!this.filteredParties.length) return;
      event.preventDefault();
      if (!this.selectedParty) {
        this.selectParty(this.filteredParties[0]);
        return;
      }
      const currentIndex = this.filteredParties.findIndex((p) => p.name === this.selectedParty?.name);
      if (currentIndex === -1) {
        this.selectParty(this.filteredParties[0]);
        return;
      }
      const nextIndex = currentIndex + direction;
      if (nextIndex >= 0 && nextIndex < this.filteredParties.length) {
        this.selectParty(this.filteredParties[nextIndex]);
      }
    },
    scrollSelectedIntoView() {
      nextTick(() => {
        if (!this.selectedParty) return;
        const el = document.getElementById('party-item-' + this.selectedParty.name);
        el?.scrollIntoView({ block: 'nearest' });
      });
    },
    getInitials(name: string): string {
      if (!name) return '—';
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    },
    async loadPaymentMethods() {
      try {
        const raw = await fyo.db.getAllRaw('PaymentMethod', {
          fields: ['name', 'type'],
        });
        if (raw && raw.length) {
          this.paymentMethods = raw.map((r) => ({
            name: String(r.name),
            type: String(r.type || 'Cash'),
          }));
        } else {
          this.paymentMethods = [{ name: 'Cash', type: 'Cash' }];
        }
      } catch {
        this.paymentMethods = [{ name: 'Cash', type: 'Cash' }];
      }
    },
    async loadParties(preferPartyName?: string) {
      this.loadingParties = true;
      try {
        const controlAccountsRaw = await fyo.db.getAllRaw('Account', {
          filters: { accountType: ['in', ['Receivable', 'Payable']] },
          fields: ['name', 'accountType'],
        });
        this.controlAccounts = new Set(controlAccountsRaw.map((a) => String(a.name)));

        const [partiesRaw, addressesRaw] = await Promise.all([
          fyo.db.getAllRaw('Party', {
            fields: ['name', 'role', 'phone', 'email', 'address', 'defaultAccount'],
            orderBy: 'name',
            order: 'asc',
          }),
          fyo.db
            .getAllRaw('Address', {
              fields: ['name', 'addressDisplay', 'addressLine1', 'city'],
            })
            .catch(() => []),
        ]);

        const addressMap = new Map<string, string>();
        for (const addr of addressesRaw || []) {
          const display = (addr.addressDisplay || addr.addressLine1 || addr.city || '') as string;
          if (display) {
            addressMap.set(String(addr.name), display);
          }
        }

        const partySummaryMap = new Map<string, { balance: number; debit: number; credit: number; count: number }>();
        if (this.controlAccounts.size > 0) {
          const entries = await fyo.db.getAllRaw('AccountingLedgerEntry', {
            filters: {
              account: ['in', Array.from(this.controlAccounts)],
              reverted: false,
            },
            fields: ['party', 'debit', 'credit', 'reverts'],
            orderBy: 'date',
            order: 'asc',
          });

          for (const entry of entries) {
            const p = String(entry.party || '');
            if (!p || entry.reverts) continue;
            const d = Number(entry.debit || 0);
            const c = Number(entry.credit || 0);
            const current = partySummaryMap.get(p) || { balance: 0, debit: 0, credit: 0, count: 0 };
            current.balance += d - c;
            current.debit += d;
            current.credit += c;
            current.count += 1;
            partySummaryMap.set(p, current);
          }
        }

        this.parties = partiesRaw.map((p) => {
          const name = String(p.name);
          const summary = partySummaryMap.get(name) || { balance: 0, debit: 0, credit: 0, count: 0 };
          const linkedAddr = p.address ? addressMap.get(String(p.address)) : '';
          return {
            name,
            role: (p.role as string) || 'Both',
            phone: String(p.phone || ''),
            email: String(p.email || ''),
            address: linkedAddr || String(p.address || ''),
            defaultAccount: String(p.defaultAccount || ''),
            balance: summary.balance,
            debit: summary.debit,
            credit: summary.credit,
            count: summary.count,
          };
        });

        // Target party selection priority:
        const targetName = preferPartyName || (this.name ? decodeURIComponent(this.name) : '') || this.selectedParty?.name;
        if (targetName) {
          const match = this.parties.find((p) => p.name === targetName || p.name === decodeURIComponent(targetName));
          if (match) {
            await this.selectParty(match);
            return;
          }
        }

        if (this.parties.length > 0) {
          await this.selectParty(this.parties[0]);
        } else {
          this.selectedParty = null;
          this.selectedPartyStatement = null;
        }
      } catch (err) {
        console.error('Error loading parties:', err);
      } finally {
        this.loadingParties = false;
      }
    },
    setRoleFilter(filterValue: string) {
      if (this.selectedRoleFilter === filterValue) return;
      this.selectedRoleFilter = filterValue;
      nextTick(() => {
        if (this.filteredParties.length > 0) {
          const isCurrentPartyVisible = this.filteredParties.some(
            (p) => p.name === this.selectedParty?.name
          );
          if (!isCurrentPartyVisible) {
            this.selectParty(this.filteredParties[0]);
          } else {
            this.scrollSelectedIntoView();
          }
        }
      });
    },
    async selectParty(party: PartyItem) {
      if (!party) return;
      if (this.selectedParty?.name === party.name && this.selectedPartyStatement) {
        return;
      }
      this.selectedParty = party;
      this.selectedPartyStatement = null;
      if (this.name !== party.name) {
        await this.$router.replace(`/parties/${encodeURIComponent(party.name)}`);
      }
      this.scrollSelectedIntoView();
      (this.$refs.detailScrollContainer as HTMLElement | undefined)?.scrollTo({ top: 0, behavior: 'auto' });
      await this.loadSelectedPartyLedger();
    },
    async loadSelectedPartyLedger() {
      if (!this.selectedParty) return;
      const currentPartyName = this.selectedParty.name;
      this.loadingLedger = true;
      try {
        // Defensive check: if no control accounts loaded, return empty clean statement
        if (this.controlAccounts.size === 0) {
          this.selectedPartyStatement = {
            opening: 0,
            closing: 0,
            debit: 0,
            credit: 0,
            rows: [],
          };
          return;
        }

        // Defensive check: prevent invalid date ranges (from > to) from crashing buildStatement
        let fromDate = this.filterFromDate;
        let toDate = this.filterToDate;
        if (fromDate && toDate && fromDate > toDate) {
          const temp = fromDate;
          fromDate = toDate;
          toDate = temp;
          this.filterFromDate = fromDate;
          this.filterToDate = toDate;
        }

        const rawEntries = await fyo.db.getAllRaw('AccountingLedgerEntry', {
          filters: {
            party: this.selectedParty.name,
            account: ['in', Array.from(this.controlAccounts)],
            reverted: false,
          },
          fields: [
            'name',
            'date',
            'account',
            'debit',
            'credit',
            'referenceType',
            'referenceName',
            'reverted',
            'reverts',
          ],
          orderBy: 'date',
          order: 'asc',
        });

        // Guard against race conditions when user switches party quickly
        if (this.selectedParty?.name !== currentPartyName) {
          return;
        }

        const stmt = buildStatement(
          rawEntries as unknown as StatementEntry[],
          this.controlAccounts,
          fromDate || undefined,
          toDate || undefined
        );

        if (this.selectedParty?.name !== currentPartyName) {
          return;
        }

        // Batch load notes/remarks for reference documents
        const paymentNames: string[] = [];
        const salesNames: string[] = [];
        const purchaseNames: string[] = [];
        const journalNames: string[] = [];

        for (const r of stmt.rows) {
          if (!r.referenceName) continue;
          if (r.referenceType === 'Payment') paymentNames.push(r.referenceName);
          else if (r.referenceType === 'SalesInvoice') salesNames.push(r.referenceName);
          else if (r.referenceType === 'PurchaseInvoice') purchaseNames.push(r.referenceName);
          else if (r.referenceType === 'JournalEntry') journalNames.push(r.referenceName);
        }

        const noteMap = new Map<string, string>();
        const [payments, sales, purchases, journals] = await Promise.all([
          paymentNames.length
            ? fyo.db.getAllRaw('Payment', {
                filters: { name: ['in', Array.from(new Set(paymentNames))] },
                fields: ['name', 'referenceId'],
              }).catch(() => [])
            : [],
          salesNames.length
            ? fyo.db.getAllRaw('SalesInvoice', {
                filters: { name: ['in', Array.from(new Set(salesNames))] },
                fields: ['name', 'terms'],
              }).catch(() => [])
            : [],
          purchaseNames.length
            ? fyo.db.getAllRaw('PurchaseInvoice', {
                filters: { name: ['in', Array.from(new Set(purchaseNames))] },
                fields: ['name', 'terms'],
              }).catch(() => [])
            : [],
          journalNames.length
            ? fyo.db.getAllRaw('JournalEntry', {
                filters: { name: ['in', Array.from(new Set(journalNames))] },
                fields: ['name', 'userRemark', 'referenceNumber'],
              }).catch(() => [])
            : [],
        ]);

        for (const p of payments || []) {
          if (p.referenceId) noteMap.set(String(p.name), String(p.referenceId));
        }
        for (const s of sales || []) {
          if (s.terms) noteMap.set(String(s.name), String(s.terms));
        }
        for (const p of purchases || []) {
          if (p.terms) noteMap.set(String(p.name), String(p.terms));
        }
        for (const j of journals || []) {
          const remark = (j as { userRemark?: string; referenceNumber?: string }).userRemark || (j as { userRemark?: string; referenceNumber?: string }).referenceNumber || '';
          if (remark) noteMap.set(String(j.name), String(remark));
        }

        const rowsWithNotes = stmt.rows.map((r) => ({
          ...r,
          note: noteMap.get(r.referenceName) || '',
        }));

        if (this.selectedParty?.name !== currentPartyName) {
          return;
        }

        this.selectedPartyStatement = {
          ...stmt,
          rows: rowsWithNotes,
        };

        // Keep party summary in sync
        this.selectedParty.balance = stmt.closing;
        this.selectedParty.debit = stmt.debit;
        this.selectedParty.credit = stmt.credit;
        this.selectedParty.count = stmt.rows.length;
      } catch (err) {
        console.error('Error loading party ledger:', err);
      } finally {
        if (this.selectedParty?.name === currentPartyName) {
          this.loadingLedger = false;
        }
      }
    },
    togglePartyDateDropdown() {
      this.isDateDropdownOpen = !this.isDateDropdownOpen;
    },
    closePartyDateDropdown() {
      this.isDateDropdownOpen = false;
    },
    onSelectDatePreset(preset: 'all' | 'today' | 'yesterday' | 'this_month' | 'this_year') {
      this.applyDatePreset(preset);
      this.isDateDropdownOpen = false;
    },
    applyDatePreset(preset: 'all' | 'today' | 'yesterday' | 'this_month' | 'this_year') {
      if (this.selectedDatePreset === preset) return;
      this.selectedDatePreset = preset;
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
      this.loadSelectedPartyLedger();
    },
    resetLedgerFilters() {
      this.selectedDatePreset = 'all';
      this.filterFromDate = '';
      this.filterToDate = '';
      this.ledgerFilterQuery = '';
      this.loadSelectedPartyLedger();
    },
    formatMoney(amount: number | unknown): string {
      const num = typeof amount === 'number' ? amount : Number(amount || 0);
      try {
        return fyo.format(fyo.pesa(num), 'Currency');
      } catch {
        return (num < 0 ? '-' : '') + '$ ' + Math.abs(num).toFixed(2);
      }
    },
    formatDate(d: string | Date | unknown): string {
      if (!d) return '—';
      try {
        const dateObj = d instanceof Date ? d : new Date(String(d));
        if (Number.isNaN(dateObj.getTime())) return String(d);
        return dateKey(dateObj);
      } catch {
        return String(d);
      }
    },
    formatBalanceLabel(balance: number): string {
      const absFormatted = this.formatMoney(Math.abs(balance));
      if (balance > 0.005) {
        return `+${absFormatted}`;
      } else if (balance < -0.005) {
        return `-${absFormatted}`;
      }
      return `${absFormatted}`;
    },
    formatRoleLabel(role: string): string {
      if (role === 'Both') return this.t`Dual Role (Customer & Supplier)`;
      return role;
    },
    getBalanceTextColor(balance: number): string {
      if (balance > 0.005) {
        return 'text-blue-700 dark:text-blue-300';
      } else if (balance < -0.005) {
        return 'text-gray-900 dark:text-gray-100';
      }
      return 'text-gray-500 dark:text-gray-400';
    },
    getBalanceCardClass(balance: number): string {
      if (balance > 0.005) {
        return 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-800';
      } else if (balance < -0.005) {
        return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700';
      }
      return 'bg-white dark:bg-gray-850 border-gray-200 dark:border-gray-800';
    },
    getBalanceStatusPillClass(balance: number): string {
      if (balance > 0.005) {
        return 'bg-blue-600 text-white dark:bg-blue-500';
      } else if (balance < -0.005) {
        return 'bg-gray-800 text-white dark:bg-gray-700 dark:text-gray-100';
      }
      return 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    },
    getBalanceStatusText(balance: number): string {
      const role = this.selectedParty?.role || 'Both';
      if (balance > 0.005) {
        if (role === 'Supplier') return this.t`Advance Paid (Debit)`;
        if (role === 'Customer') return this.t`Receivable`;
        return this.t`Net Receivable`;
      } else if (balance < -0.005) {
        if (role === 'Customer') return this.t`Customer Credit (Advance)`;
        if (role === 'Supplier') return this.t`Payable`;
        return this.t`Net Payable`;
      }
      return this.t`Settled`;
    },
    getBalanceSubtitleText(balance: number): string {
      const role = this.selectedParty?.role || 'Both';
      if (balance > 0.005) {
        if (role === 'Supplier') return this.t`Advance payment deposited to supplier`;
        return this.t`Outstanding amount owed to your business`;
      } else if (balance < -0.005) {
        if (role === 'Customer') return this.t`Advance deposit credit held for customer`;
        return this.t`Outstanding balance you owe to this party`;
      }
      return this.t`All transactions fully settled with zero balance`;
    },
    getRoleBadgeClass(role: string): string {
      if (role === 'Both') {
        return 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-700';
      } else if (role === 'Customer') {
        return 'bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800';
      }
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700';
    },
    getTransactionBadgeClass(type: string): string {
      if (type === 'SalesInvoice') {
        return 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700';
      }
      if (type === 'PurchaseInvoice') {
        return 'bg-gray-100 text-gray-800 border border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700';
      }
      if (type === 'Payment') {
        return 'bg-blue-100 text-blue-900 border border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700';
      }
      return 'bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    },
    getTransactionIcon(type: string, debit: number, _credit: number): string {
      if (type === 'SalesInvoice') return 'file-text';
      if (type === 'PurchaseInvoice') return 'shopping-cart';
      if (type === 'Payment') return debit > 0 ? 'arrow-up-circle' : 'arrow-down-circle';
      return 'file';
    },
    formatReferenceTypeLabel(type: string): string {
      const map: Record<string, string> = {
        SalesInvoice: this.t`Sales Invoice`,
        PurchaseInvoice: this.t`Purchase Invoice`,
        Payment: this.t`Payment`,
        JournalEntry: this.t`Journal Entry`,
      };
      return map[type] || type;
    },

    // HELPER: Auto-upgrade party to dual-role if doing cross-role action
    async ensurePartyRole(requiredRole: 'Customer' | 'Supplier') {
      if (!this.selectedParty) return;
      if (this.selectedParty.role === 'Both') return;
      if (this.selectedParty.role !== requiredRole) {
        try {
          const partyDoc = await fyo.doc.getDoc('Party', this.selectedParty.name);
          await partyDoc.setAndSync('role', 'Both');
          this.selectedParty.role = 'Both';
          const inList = this.parties.find((p) => p.name === this.selectedParty!.name);
          if (inList) inList.role = 'Both';
        } catch (err) {
          console.warn('Could not auto-upgrade party role:', err);
        }
      }
    },

    // 5 QUICK ACTIONS
    async createNewSale() {
      if (!this.selectedParty) return;
      try {
        await this.ensurePartyRole('Customer');

        let account = 'Debtors';
        const receivableAccounts = (await fyo.db.getAllRaw('Account', {
          filters: { accountType: 'Receivable' },
          fields: ['name'],
        })) as Array<{ name: string }>;
        if (receivableAccounts.length) {
          account = String(receivableAccounts[0].name);
        }
        if (this.selectedParty.defaultAccount) {
          try {
            const accDoc = await fyo.db.get('Account', this.selectedParty.defaultAccount, ['accountType']);
            if (accDoc && accDoc.accountType === 'Receivable') {
              account = this.selectedParty.defaultAccount;
            }
          } catch {
            // fallback
          }
        }

        const doc = fyo.doc.getNewDoc('SalesInvoice', {
          party: this.selectedParty.name,
          account,
        });
        await this.$router.push(`/edit/SalesInvoice/${encodeURIComponent(doc.name!)}`);
      } catch (err) {
        showToast({ type: 'error', message: (err as Error).message });
      }
    },
    async createNewPurchase() {
      if (!this.selectedParty) return;
      try {
        await this.ensurePartyRole('Supplier');

        let account = 'Creditors';
        const payableAccounts = (await fyo.db.getAllRaw('Account', {
          filters: { accountType: 'Payable' },
          fields: ['name'],
        })) as Array<{ name: string }>;
        if (payableAccounts.length) {
          account = String(payableAccounts[0].name);
        }
        if (this.selectedParty.defaultAccount) {
          try {
            const accDoc = await fyo.db.get('Account', this.selectedParty.defaultAccount, ['accountType']);
            if (accDoc && accDoc.accountType === 'Payable') {
              account = this.selectedParty.defaultAccount;
            }
          } catch {
            // fallback
          }
        }

        const doc = fyo.doc.getNewDoc('PurchaseInvoice', {
          party: this.selectedParty.name,
          account,
        });
        await this.$router.push(`/edit/PurchaseInvoice/${encodeURIComponent(doc.name!)}`);
      } catch (err) {
        showToast({ type: 'error', message: (err as Error).message });
      }
    },
    async openFastPayment(type: 'Receive' | 'Pay') {
      if (!this.selectedParty) return;
      await this.ensurePartyRole(type === 'Receive' ? 'Customer' : 'Supplier');
      this.quickPaymentType = type;
      this.quickPaymentAmount = null;
      const cashMethod = this.paymentMethods.find((m) => m.name.toLowerCase() === 'cash' || m.type.toLowerCase() === 'cash');
      this.quickPaymentMethod = cashMethod?.name || this.paymentMethods[0]?.name || 'Cash';
      this.quickPaymentDate = dateKey(new Date());
      this.quickPaymentClearanceDate = dateKey(new Date());
      this.quickPaymentRef = '';
      this.quickPaymentError = '';
      this.showQuickPaymentModal = true;
      nextTick(() => {
        (this.$refs.quickPaymentAmountInput as HTMLInputElement)?.focus();
      });
    },
    closeQuickPaymentModal() {
      this.showQuickPaymentModal = false;
      this.quickPaymentError = '';
    },
    async submitQuickPayment() {
      if (this.isSubmittingPayment) return;
      if (!this.selectedParty) return;
      if (!this.quickPaymentAmount || this.quickPaymentAmount <= 0) {
        this.quickPaymentError = this.t`Please enter a valid amount greater than 0`;
        return;
      }

      // Bank payment validation to prevent Frappe Books model crashes
      if (this.isBankPaymentMethod) {
        if (!this.quickPaymentRef.trim()) {
          this.quickPaymentRef = `TRX-${Date.now().toString().slice(-6)}`;
        }
        if (!this.quickPaymentClearanceDate) {
          this.quickPaymentClearanceDate = this.quickPaymentDate || dateKey(new Date());
        }
      }

      this.isSubmittingPayment = true;
      this.quickPaymentError = '';
      try {
        await this.ensurePartyRole(
          this.quickPaymentType === 'Receive' ? 'Customer' : 'Supplier'
        );

        let postingDate = new Date();
        if (this.quickPaymentDate) {
          const [year, month, day] = this.quickPaymentDate.split('-').map(Number);
          if (year && month && day) {
            postingDate = new Date(year, month - 1, day, 12, 0, 0);
          }
        }

        let clearanceDate: Date | undefined;
        if (this.isBankPaymentMethod && this.quickPaymentClearanceDate) {
          const [cyear, cmonth, cday] = this.quickPaymentClearanceDate.split('-').map(Number);
          if (cyear && cmonth && cday) {
            clearanceDate = new Date(cyear, cmonth - 1, cday, 12, 0, 0);
          }
        }

        // Account routing: Respect party's defaultAccount if defined
        let account: string | undefined;
        let paymentAccount: string | undefined;
        if (this.selectedParty.defaultAccount) {
          try {
            const acc = await fyo.db.get('Account', this.selectedParty.defaultAccount, ['accountType']);
            if (acc) {
              if (this.quickPaymentType === 'Receive' && acc.accountType === 'Receivable') {
                account = this.selectedParty.defaultAccount;
              } else if (this.quickPaymentType === 'Pay' && acc.accountType === 'Payable') {
                paymentAccount = this.selectedParty.defaultAccount;
              }
            }
          } catch {
            // fallback
          }
        }

        const payment = fyo.doc.getNewDoc(ModelNameEnum.Payment, {
          party: this.selectedParty.name,
          paymentType: this.quickPaymentType,
          paymentMethod: this.quickPaymentMethod || 'Cash',
          date: postingDate,
          clearanceDate: clearanceDate || (this.isBankPaymentMethod ? postingDate : undefined),
          amount: fyo.pesa(this.quickPaymentAmount),
          referenceId: this.quickPaymentRef || (this.isBankPaymentMethod ? `REF-${Date.now().toString().slice(-6)}` : undefined),
          account,
          paymentAccount,
        });

        await payment.runFormulas();
        await payment.sync();
        await payment.submit();

        showToast({
          type: 'success',
          message: this.quickPaymentType === 'Receive'
            ? this.t`Payment received and posted successfully`
            : this.t`Payment disbursed and posted successfully`,
        });

        const activePartyName = this.selectedParty.name;
        this.closeQuickPaymentModal();
        await this.loadParties(activePartyName);
      } catch (err) {
        this.quickPaymentError = (err as Error).message || String(err);
      } finally {
        this.isSubmittingPayment = false;
      }
    },
    async openStatementPrint() {
      if (!this.selectedParty) return;
      const query: Record<string, string> = {
        preset: this.selectedDatePreset,
      };
      if (this.filterFromDate) query.from = this.filterFromDate;
      if (this.filterToDate) query.to = this.filterToDate;
      await this.$router.push({
        path: `/print/Party/${encodeURIComponent(this.selectedParty.name)}`,
        query,
      });
    },
    async openReferenceDoc(refType: string, refName: string) {
      if (refType && refName) {
        await this.$router.push(`/edit/${encodeURIComponent(refType)}/${encodeURIComponent(refName)}`);
      }
    },
    async editSelectedParty() {
      if (!this.selectedParty) return;
      await this.$router.push(`/edit/Party/${encodeURIComponent(this.selectedParty.name)}`);
    },

    // NEW PARTY CREATION
    openNewPartyModal() {
      this.newPartyName = '';
      this.newPartyRole = 'Both';
      this.newPartyPhone = '';
      this.newPartyEmail = '';
      this.newPartyAddress = '';
      this.newPartyError = '';
      this.showNewPartyModal = true;
      nextTick(() => {
        (this.$refs.newPartyNameInput as HTMLInputElement)?.focus();
      });
    },
    closeNewPartyModal() {
      this.showNewPartyModal = false;
      this.newPartyError = '';
    },
    async submitNewParty() {
      if (this.isSubmittingNewParty) return;
      const name = this.newPartyName.trim();
      if (!name) {
        this.newPartyError = this.t`Party name is required`;
        return;
      }

      this.isSubmittingNewParty = true;
      this.newPartyError = '';
      try {
        const exists = await fyo.db.exists(ModelNameEnum.Party, name);
        if (exists) {
          throw new Error(this.t`A party with this name already exists`);
        }

        const party = fyo.doc.getNewDoc(ModelNameEnum.Party, {
          name,
          role: this.newPartyRole,
          phone: this.newPartyPhone.trim() || undefined,
          email: this.newPartyEmail.trim() || undefined,
        });

        await party.sync();

        if (this.newPartyAddress.trim()) {
          try {
            const companyCountry =
              (fyo.singles.AccountingSettings?.country as string) || 'Bangladesh';
            const safeAddrSuffix = Date.now().toString().slice(-4);
            const addrName = `${party.name}-Address-${safeAddrSuffix}`;
            const addr = fyo.doc.getNewDoc('Address', {
              name: addrName,
              addressLine1: this.newPartyAddress.trim(),
              city: 'Default',
              country: companyCountry,
              party: party.name,
            });
            await addr.runFormulas();
            await addr.sync();
            await party.setAndSync('address', addr.name);
          } catch (addrErr) {
            console.warn('Could not create address:', addrErr);
          }
        }

        showToast({
          type: 'success',
          message: this.t`Party created successfully`,
        });

        this.closeNewPartyModal();
        await this.loadParties(name);
      } catch (err) {
        this.newPartyError = (err as Error).message || String(err);
      } finally {
        this.isSubmittingNewParty = false;
      }
    },
  },
});
</script>

<style scoped>
.fade-subtle-enter-active,
.fade-subtle-leave-active {
  transition: opacity 120ms ease-out, transform 120ms ease-out;
}
.fade-subtle-enter-from {
  opacity: 0;
  transform: translateY(3px);
}
.fade-subtle-leave-to {
  opacity: 0;
  transform: translateY(-3px);
}
</style>
