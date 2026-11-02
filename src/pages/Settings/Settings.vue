<template>
  <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-y-auto custom-scroll custom-scroll-thumb1">
    <!-- Top Header -->
    <header class="sticky top-0 z-10 bg-white/95 dark:bg-gray-850/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between shadow-xs">
      <div>
        <h1 class="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <feather-icon name="settings" class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>{{ t`Settings` }}</span>
        </h1>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {{ t`Manage your company profile, data backup, and display preferences.` }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isSaving"
          @click="saveAllSettings"
        >
          <feather-icon
            :name="isSaving ? 'refresh-cw' : 'check'"
            class="w-3.5 h-3.5"
            :class="{ 'animate-spin': isSaving }"
          />
          <span>{{ isSaving ? t`Saving...` : t`Save Settings` }}</span>
        </button>
      </div>
    </header>

    <!-- Main Content Body -->
    <main class="max-w-4xl w-full mx-auto p-6 space-y-6">
      <!-- Section 1: Company Profile -->
      <section class="bg-white dark:bg-gray-850 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <div class="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <feather-icon name="briefcase" class="w-4 h-4" />
            </div>
            <div>
              <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">
                {{ t`Company Profile` }}
              </h2>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ t`Basic information used in invoices, receipts, and system headers.` }}
              </p>
            </div>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Company Name -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {{ t`Company Name` }} <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.companyName"
              type="text"
              class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              :placeholder="t`Enter company name`"
            />
          </div>

          <!-- Owner / Contact Person -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {{ t`Owner / Contact Person` }}
            </label>
            <input
              v-model="form.fullname"
              type="text"
              class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              :placeholder="t`Enter owner or manager name`"
            />
          </div>

          <!-- Phone -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {{ t`Phone / Mobile` }}
            </label>
            <input
              v-model="form.phone"
              type="text"
              class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              :placeholder="t`+880 1700-000000`"
            />
          </div>

          <!-- Email -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {{ t`Business Email` }}
            </label>
            <input
              v-model="form.email"
              type="email"
              class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              :placeholder="t`office@example.com`"
            />
          </div>

          <!-- Address -->
          <div class="md:col-span-2">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {{ t`Business Address` }}
            </label>
            <textarea
              v-model="form.address"
              rows="2"
              class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
              :placeholder="t`Full business address (will appear on invoices)`"
            ></textarea>
          </div>

          <!-- Currency -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {{ t`Currency` }}
            </label>
            <select
              v-model="form.currency"
              class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              <option value="BDT">BDT (৳ - Bangladeshi Taka)</option>
              <option value="INR">INR (₹ - Indian Rupee)</option>
              <option value="USD">USD ($ - US Dollar)</option>
              <option value="EUR">EUR (€ - Euro)</option>
              <option value="GBP">GBP (£ - British Pound)</option>
              <option value="AED">AED (د.إ - UAE Dirham)</option>
              <option value="SAR">SAR (﷼ - Saudi Riyal)</option>
            </select>
          </div>

          <!-- Fiscal Year Start & End -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {{ t`Fiscal Year Start` }}
              </label>
              <input
                v-model="form.fiscalYearStart"
                type="date"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {{ t`Fiscal Year End` }}
              </label>
              <input
                v-model="form.fiscalYearEnd"
                type="date"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <!-- Multi-Asset Upload Section: 3 image upload cards side-by-side -->
          <div class="md:col-span-2 pt-5 border-t border-gray-100 dark:border-gray-800">
            <div class="mb-3">
              <label class="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                {{ t`Print & Branding Assets` }}
              </label>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {{ t`Upload company assets for customized PDF invoices, receipts, statements, and reports.` }}
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- a) Company Logo -->
              <div class="rounded-xl border border-gray-200 dark:border-gray-750 bg-gray-50/60 dark:bg-gray-800/40 p-4 flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-semibold text-gray-900 dark:text-gray-100">
                      {{ t`Company Logo` }}
                    </span>
                    <span class="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                      {{ t`প্রতিষ্ঠানের লোগো` }}
                    </span>
                  </div>
                  <div class="h-28 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 p-2 flex items-center justify-center overflow-hidden mb-2.5 shadow-2xs">
                    <img
                      v-if="form.logo"
                      :src="form.logo"
                      alt="Company Logo"
                      class="max-h-full max-w-full object-contain"
                    />
                    <div v-else class="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 gap-1">
                      <feather-icon name="image" class="w-6 h-6 stroke-1" />
                      <span class="text-[11px]">{{ t`No logo uploaded` }}</span>
                    </div>
                  </div>
                  <p class="text-[11px] text-gray-500 dark:text-gray-400 leading-tight mb-3">
                    {{ t`Appears on top headers, invoices, bills, and report banners.` }}
                  </p>
                </div>
                <div class="flex items-center gap-2 pt-2 border-t border-gray-200/60 dark:border-gray-750">
                  <button
                    type="button"
                    class="flex-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-650 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 transition flex items-center justify-center gap-1 shadow-2xs"
                    @click="handleSelectAsset('logo')"
                  >
                    <feather-icon name="upload" class="w-3 h-3 text-gray-500" />
                    <span>{{ form.logo ? t`Change Logo` : t`Upload Logo` }}</span>
                  </button>
                  <button
                    v-if="form.logo"
                    type="button"
                    class="px-2.5 py-1.5 text-xs font-medium rounded-md border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100/50 transition flex items-center justify-center gap-1"
                    :title="t`Remove Logo`"
                    @click="removeAsset('logo')"
                  >
                    <feather-icon name="trash-2" class="w-3 h-3" />
                    <span>{{ t`Remove` }}</span>
                  </button>
                </div>
              </div>

              <!-- b) Authorized Signature -->
              <div class="rounded-xl border border-gray-200 dark:border-gray-750 bg-gray-50/60 dark:bg-gray-800/40 p-4 flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-semibold text-gray-900 dark:text-gray-100">
                      {{ t`Authorized Signature` }}
                    </span>
                    <span class="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                      {{ t`অনুমোদিত স্বাক্ষর` }}
                    </span>
                  </div>
                  <div class="h-28 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 p-2 flex items-center justify-center overflow-hidden mb-2.5 shadow-2xs">
                    <img
                      v-if="form.authorizedSignature"
                      :src="form.authorizedSignature"
                      alt="Authorized Signature"
                      class="max-h-full max-w-full object-contain"
                    />
                    <div v-else class="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 gap-1">
                      <feather-icon name="edit-3" class="w-6 h-6 stroke-1" />
                      <span class="text-[11px]">{{ t`No signature uploaded` }}</span>
                    </div>
                  </div>
                  <p class="text-[11px] text-gray-500 dark:text-gray-400 leading-tight mb-3">
                    {{ t`Appears on bottom signature block of invoices, statements, and reports.` }}
                  </p>
                </div>
                <div class="flex items-center gap-2 pt-2 border-t border-gray-200/60 dark:border-gray-750">
                  <button
                    type="button"
                    class="flex-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-650 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 transition flex items-center justify-center gap-1 shadow-2xs"
                    @click="handleSelectAsset('authorizedSignature')"
                  >
                    <feather-icon name="upload" class="w-3 h-3 text-gray-500" />
                    <span>{{ form.authorizedSignature ? t`Change Signature` : t`Upload Signature` }}</span>
                  </button>
                  <button
                    v-if="form.authorizedSignature"
                    type="button"
                    class="px-2.5 py-1.5 text-xs font-medium rounded-md border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100/50 transition flex items-center justify-center gap-1"
                    :title="t`Remove Signature`"
                    @click="removeAsset('authorizedSignature')"
                  >
                    <feather-icon name="trash-2" class="w-3 h-3" />
                    <span>{{ t`Remove` }}</span>
                  </button>
                </div>
              </div>

              <!-- c) Payment QR / Barcode -->
              <div class="rounded-xl border border-gray-200 dark:border-gray-750 bg-gray-50/60 dark:bg-gray-800/40 p-4 flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-semibold text-gray-900 dark:text-gray-100">
                      {{ t`Payment QR / Barcode` }}
                    </span>
                    <span class="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                      {{ t`পেমেন্ট কিউআর বা বারকোড` }}
                    </span>
                  </div>
                  <div class="h-28 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 p-2 flex items-center justify-center overflow-hidden mb-2.5 shadow-2xs">
                    <img
                      v-if="form.paymentQR"
                      :src="form.paymentQR"
                      alt="Payment QR"
                      class="max-h-full max-w-full object-contain"
                    />
                    <div v-else class="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 gap-1">
                      <feather-icon name="maximize" class="w-6 h-6 stroke-1" />
                      <span class="text-[11px]">{{ t`No QR code uploaded` }}</span>
                    </div>
                  </div>
                  <p class="text-[11px] text-gray-500 dark:text-gray-400 leading-tight mb-3">
                    {{ t`Appears on invoices and statements for instant mobile payment scanning.` }}
                  </p>
                </div>
                <div class="flex items-center gap-2 pt-2 border-t border-gray-200/60 dark:border-gray-750">
                  <button
                    type="button"
                    class="flex-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-650 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 transition flex items-center justify-center gap-1 shadow-2xs"
                    @click="handleSelectAsset('paymentQR')"
                  >
                    <feather-icon name="upload" class="w-3 h-3 text-gray-500" />
                    <span>{{ form.paymentQR ? t`Change QR Code` : t`Upload QR Code` }}</span>
                  </button>
                  <button
                    v-if="form.paymentQR"
                    type="button"
                    class="px-2.5 py-1.5 text-xs font-medium rounded-md border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100/50 transition flex items-center justify-center gap-1"
                    :title="t`Remove QR Code`"
                    @click="removeAsset('paymentQR')"
                  >
                    <feather-icon name="trash-2" class="w-3 h-3" />
                    <span>{{ t`Remove` }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 2: Quick Actions (Database Backup + Dark Mode Toggle) -->
      <section class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <!-- Database Backup Card -->
        <div class="bg-white dark:bg-gray-850 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm flex flex-col justify-between">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <feather-icon name="database" class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {{ t`Database Backup` }}
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                {{ t`Create a complete and safe backup of your company database with one click.` }}
              </p>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span class="text-xs text-gray-400">
              {{ isBackingUp ? t`Backing up...` : t`Ready to backup` }}
            </span>
            <button
              type="button"
              class="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              :disabled="isBackingUp"
              @click="handleCreateBackup"
            >
              <feather-icon
                :name="isBackingUp ? 'refresh-cw' : 'download-cloud'"
                class="w-3.5 h-3.5"
                :class="{ 'animate-spin': isBackingUp }"
              />
              <span>{{ isBackingUp ? t`Creating Backup...` : t`Backup Database` }}</span>
            </button>
          </div>
        </div>

        <!-- Dark Mode Toggle Card -->
        <div class="bg-white dark:bg-gray-850 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm flex flex-col justify-between">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
              <feather-icon :name="form.darkMode ? 'moon' : 'sun'" class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {{ t`App Theme` }}
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                {{ t`Toggle instantly between Dark and Light mode for comfortable viewing.` }}
              </p>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span class="text-xs font-medium" :class="form.darkMode ? 'text-purple-400' : 'text-amber-600'">
              {{ form.darkMode ? t`Dark Mode Active` : t`Light Mode Active` }}
            </span>
            <button
              type="button"
              class="px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition flex items-center gap-1.5 shadow-sm"
              :class="form.darkMode
                ? 'bg-purple-900/30 border-purple-700 text-purple-300 hover:bg-purple-900/50'
                : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'"
              @click="toggleDarkMode"
            >
              <feather-icon :name="form.darkMode ? 'sun' : 'moon'" class="w-3.5 h-3.5" />
              <span>{{ form.darkMode ? t`Switch to Light` : t`Switch to Dark` }}</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject } from 'vue';
import { fyo } from 'src/initFyo';
import { ModelNameEnum } from 'models/types';
import { setDarkMode } from 'src/utils/theme';
import { showDialog, showToast } from 'src/utils/interactive';
import { getDataURL } from 'src/utils/misc';
import { shortcutsKey } from 'src/utils/injectionKeys';

const COMPONENT_NAME = 'Settings';

export default defineComponent({
  name: 'Settings',
  setup() {
    return {
      shortcuts: inject(shortcutsKey),
    };
  },
  data() {
    return {
      isSaving: false,
      isBackingUp: false,
      form: {
        companyName: '',
        fullname: '',
        phone: '',
        email: '',
        address: '',
        currency: 'BDT',
        fiscalYearStart: '',
        fiscalYearEnd: '',
        logo: '',
        authorizedSignature: '',
        paymentQR: '',
        darkMode: true,
      },
    };
  },
  mounted() {
    this.loadSettings();
  },
  activated() {
    this.loadSettings();
    this.shortcuts?.pmod.set(COMPONENT_NAME, ['KeyS'], async () => {
      await this.saveAllSettings();
    });
  },
  deactivated() {
    this.shortcuts?.delete(COMPONENT_NAME);
  },
  methods: {
    loadSettings() {
      const acc = fyo.singles[ModelNameEnum.AccountingSettings];
      const print = fyo.singles[ModelNameEnum.PrintSettings];
      const sys = fyo.singles[ModelNameEnum.SystemSettings];

      const savedDarkMode = sys?.darkMode !== undefined
        ? !!sys.darkMode
        : (typeof localStorage !== 'undefined' && localStorage.getItem('nivo_dark_mode') !== 'false');

      this.form = {
        companyName: (acc?.companyName as string) || (print?.companyName as string) || '',
        fullname: (acc?.fullname as string) || '',
        phone: (print?.phone as string) || '',
        email: (print?.email as string) || (acc?.email as string) || '',
        address: (print?.address as string) || '',
        currency: (sys?.currency as string) || 'BDT',
        fiscalYearStart: (acc?.fiscalYearStart as string) || '',
        fiscalYearEnd: (acc?.fiscalYearEnd as string) || '',
        logo: ((print?.logo as unknown as string) || ''),
        authorizedSignature: ((print?.authorizedSignature as unknown as string) || ''),
        paymentQR: ((print?.paymentQR as unknown as string) || ''),
        darkMode: savedDarkMode,
      };
    },

    async saveAllSettings() {
      this.isSaving = true;
      try {
        const acc = fyo.singles[ModelNameEnum.AccountingSettings];
        const print = fyo.singles[ModelNameEnum.PrintSettings];
        const sys = fyo.singles[ModelNameEnum.SystemSettings];

        if (acc) {
          if (this.form.companyName !== undefined) await acc.set('companyName', this.form.companyName);
          if (this.form.fullname !== undefined) await acc.set('fullname', this.form.fullname);
          if (this.form.email !== undefined) await acc.set('email', this.form.email);
          if (this.form.fiscalYearStart) await acc.set('fiscalYearStart', this.form.fiscalYearStart);
          if (this.form.fiscalYearEnd) await acc.set('fiscalYearEnd', this.form.fiscalYearEnd);
          await acc.sync();
        }

        if (print) {
          await print.set('companyName', this.form.companyName || '');
          await print.set('phone', this.form.phone || '');
          await print.set('email', this.form.email || '');
          await print.set('address', this.form.address || '');
          await print.set('logo', this.form.logo || '');
          await print.set('displayLogo', !!this.form.logo);
          await print.set('authorizedSignature', this.form.authorizedSignature || '');
          await print.set('paymentQR', this.form.paymentQR || '');
          await print.sync();
        }

        if (sys) {
          if (this.form.currency) await sys.set('currency', this.form.currency);
          await sys.set('darkMode', this.form.darkMode);
          await sys.sync();
        }

        setDarkMode(this.form.darkMode);

        showToast({
          message: this.t`Settings saved successfully!`,
          type: 'success',
        });
      } catch (err) {
        showToast({
          message: this.t`Save failed: ${(err as Error).message}`,
          type: 'error',
        });
      } finally {
        this.isSaving = false;
      }
    },

    async toggleDarkMode() {
      this.form.darkMode = !this.form.darkMode;
      setDarkMode(this.form.darkMode);

      const sys = fyo.singles[ModelNameEnum.SystemSettings];
      if (sys) {
        try {
          await sys.set('darkMode', this.form.darkMode);
          await sys.sync();
        } catch (e) {
          // silently handle
        }
      }

      showToast({
        message: this.form.darkMode
          ? this.t`Dark mode enabled`
          : this.t`Light mode enabled`,
        type: 'success',
      });
    },

    async handleSelectAsset(key: 'logo' | 'authorizedSignature' | 'paymentQR') {
      const mime_types: Record<string, string> = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        svg: 'image/svg+xml',
        webp: 'image/webp',
      };

      const titles: Record<'logo' | 'authorizedSignature' | 'paymentQR', string> = {
        logo: this.t`Select Company Logo`,
        authorizedSignature: this.t`Select Authorized Signature`,
        paymentQR: this.t`Select Payment QR / Barcode`,
      };

      const options = {
        title: titles[key] || this.t`Select Image`,
        filters: [{ name: 'Image', extensions: Object.keys(mime_types) }],
      };

      const fileSelector =
        (typeof window !== 'undefined' && window.ipc?.selectFile) ||
        (typeof ipc !== 'undefined' && ipc.selectFile);

      if (fileSelector) {
        const { name, success, data } = await fileSelector(options);
        if (!success || !data) return;

        const extension = name.split('.').at(-1)?.toLowerCase() || '';
        const type = mime_types[extension] || 'image/png';
        const dataURL = await getDataURL(type, data);
        this.form[key] = dataURL;
      }
    },

    removeAsset(key: 'logo' | 'authorizedSignature' | 'paymentQR') {
      this.form[key] = '';
    },

    handleSelectLogo() {
      return this.handleSelectAsset('logo');
    },

    async handleCreateBackup() {
      const dataToolsCreateBackup =
        (typeof window !== 'undefined' && window.ipc?.dataToolsCreateBackup) ||
        (typeof ipc !== 'undefined' && ipc.dataToolsCreateBackup);
      if (!dataToolsCreateBackup) {
        return;
      }

      this.isBackingUp = true;
      try {
        const res = await dataToolsCreateBackup(false);
        if (res && !res.canceled && res.name) {
          await showDialog({
            title: this.t`Backup Created`,
            detail: this.t`Database backup created successfully: ${res.name}`,
            type: 'info',
            buttons: [{ label: this.t`OK`, isPrimary: true, action: () => null }],
          });
        }
      } catch (error) {
        await showDialog({
          title: this.t`Backup Failed`,
          detail: (error as Error).message || String(error),
          type: 'error',
          buttons: [{ label: this.t`OK`, isPrimary: true, action: () => null }],
        });
      } finally {
        this.isBackingUp = false;
      }
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
