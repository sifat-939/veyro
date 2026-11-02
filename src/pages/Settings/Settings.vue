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

          <!-- Logo Upload & Preview -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {{ t`Company Logo` }}
            </label>
            <div class="flex items-center gap-4">
              <div
                v-if="form.logo"
                class="w-14 h-14 rounded-lg border border-gray-200 dark:border-gray-700 bg-white p-1 flex items-center justify-center overflow-hidden"
              >
                <img :src="form.logo" alt="Logo" class="max-w-full max-h-full object-contain" />
              </div>
              <div
                v-else
                class="w-14 h-14 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-400"
              >
                <feather-icon name="image" class="w-6 h-6" />
              </div>

              <div class="flex flex-col gap-1.5">
                <button
                  type="button"
                  class="px-3 py-1 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 transition flex items-center gap-1 shadow-xs"
                  @click="handleSelectLogo"
                >
                  <feather-icon name="upload" class="w-3 h-3 text-gray-500" />
                  <span>{{ form.logo ? t`Change Logo` : t`Upload Logo` }}</span>
                </button>
                <button
                  v-if="form.logo"
                  type="button"
                  class="text-xs text-red-500 hover:text-red-700 text-left transition"
                  @click="form.logo = ''"
                >
                  {{ t`Remove Logo` }}
                </button>
              </div>
            </div>
          </div>

          <!-- Fiscal Year Start & End -->
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
          if (this.form.companyName) await acc.set('companyName', this.form.companyName);
          if (this.form.fullname) await acc.set('fullname', this.form.fullname);
          if (this.form.email) await acc.set('email', this.form.email);
          if (this.form.fiscalYearStart) await acc.set('fiscalYearStart', this.form.fiscalYearStart);
          if (this.form.fiscalYearEnd) await acc.set('fiscalYearEnd', this.form.fiscalYearEnd);
          await acc.sync();
        }

        if (print) {
          if (this.form.companyName) await print.set('companyName', this.form.companyName);
          await print.set('phone', this.form.phone || '');
          await print.set('email', this.form.email || '');
          await print.set('address', this.form.address || '');
          await print.set('logo', this.form.logo || '');
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

    async handleSelectLogo() {
      const mime_types: Record<string, string> = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        svg: 'image/svg+xml',
        webp: 'image/webp',
      };

      const options = {
        title: this.t`Select Logo Image`,
        filters: [{ name: 'Image', extensions: Object.keys(mime_types) }],
      };

      if (typeof ipc !== 'undefined' && typeof ipc.selectFile === 'function') {
        const { name, success, data } = await ipc.selectFile(options);
        if (!success || !data) return;

        const extension = name.split('.').at(-1)?.toLowerCase() || '';
        const type = mime_types[extension] || 'image/png';
        const dataURL = await getDataURL(type, data);
        this.form.logo = dataURL;
      }
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
