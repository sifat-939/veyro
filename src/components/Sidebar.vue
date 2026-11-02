<template>
  <div
    class="
      py-2
      h-full
      flex
      justify-between
      flex-col
      bg-gray-25
      dark:bg-gray-900
      relative
    "
    :class="{
      'window-drag': platform !== 'Windows',
    }"
  >
    <div>
      <!-- Company name -->
      <div
        class="px-4 flex flex-row items-center justify-between mb-4"
        :class="
          platform === 'Mac' && languageDirection === 'ltr' ? 'mt-10' : 'mt-2'
        "
      >
        <img
          src="../assets/brand/veyro-mark.png"
          class="w-8 h-8 flex-shrink-0 me-2 object-contain"
          alt="VEYRO"
          aria-hidden="true"
        />
        <div class="min-w-0 flex-1">
          <p class="nivo-wordmark text-xl font-bold tracking-wider text-gray-900 dark:text-gray-100">
            VEYRO
          </p>
          <h6
            data-testid="company-name"
            class="
              font-semibold
              dark:text-gray-200
              whitespace-nowrap
              overflow-auto
              no-scrollbar
              select-none
            "
          >
            {{ companyName }}
          </h6>
        </div>
      </div>

      <!-- Sidebar Items -->
      <div v-for="group in groups" :key="group.label">
        <div
          class="
            nivo-nav-item
            px-4
            flex
            items-center
            cursor-pointer
            hover:bg-gray-100
            dark:hover:bg-gray-875
            h-10
          "
          :class="
            isGroupActive(group) && !group.items
              ? 'bg-blue-100 dark:bg-blue-900 border-s-4 border-blue-700 dark:border-blue-400'
              : ''
          "
          @click="routeToSidebarItem(group)"
        >
          <Icon
            class="flex-shrink-0 text-gray-600 dark:text-gray-400"
            :name="group.icon"
            :size="group.iconSize || '18'"
            :height="group.iconHeight ?? 0"
            :active="!!isGroupActive(group)"
            :darkMode="darkMode"
            :class="isGroupActive(group) && !group.items ? '-ms-1' : ''"
          />
          <div
            class="ms-2 text-lg text-gray-700"
            :class="
              isGroupActive(group) && !group.items
                ? 'text-gray-900 dark:text-gray-25'
                : 'dark:text-gray-300'
            "
          >
            {{ group.label }}
          </div>
          <feather-icon
            v-if="group.items"
            :name="isGroupActive(group) ? 'chevron-down' : 'chevron-right'"
            class="ms-auto w-4 h-4 text-gray-400"
          />
        </div>

        <!-- Expanded Group -->
        <div v-if="group.items && isGroupActive(group)">
          <div
            v-for="item in group.items"
            :key="item.label"
            class="
              nivo-nav-item
              text-base
              h-10
              ps-10
              cursor-pointer
              flex
              items-center
              hover:bg-gray-100
              dark:hover:bg-gray-875
            "
            :class="
              isItemActive(item)
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-s-4 border-blue-700 dark:border-blue-400'
                : 'text-gray-700 dark:text-gray-400'
            "
            @click="routeToSidebarItem(item)"
          >
            <p :style="isItemActive(item) ? 'margin-left: -4px' : ''">
              {{ item.label }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Shortcuts and DB Switcher -->
    <div class="window-no-drag flex flex-col gap-2 py-2 px-4">
      <button
        data-testid="app-update"
        class="
          flex
          text-sm
          gap-1
          items-center
          transition-colors
        "
        :class="updateButtonClass"
        :disabled="isUpdateDisabled"
        :title="updateTooltip"
        @click="onUpdateClick"
      >
        <feather-icon
          :name="updateIcon"
          class="h-4 w-4 flex-shrink-0"
          :class="{ 'animate-spin': updateState.status === 'checking' }"
        />
        <p class="truncate">{{ updateLabel }}</p>
      </button>

      <button
        class="
          flex
          text-sm text-gray-600
          dark:text-gray-500
          hover:text-gray-800
          dark:hover:text-gray-400
          gap-1
          items-center
        "
        @click="viewShortcuts = true"
      >
        <feather-icon name="command" class="h-4 w-4 flex-shrink-0" />
        <p>{{ t`Shortcuts` }}</p>
      </button>

      <button
        data-testid="change-db"
        class="
          flex
          text-sm text-gray-600
          dark:text-gray-500
          hover:text-gray-800
          dark:hover:text-gray-400
          gap-1
          items-center
        "
        @click="$emit('change-db-file')"
      >
        <feather-icon name="database" class="h-4 w-4 flex-shrink-0" />
        <p>{{ t`Change DB` }}</p>
      </button>

      <p
        v-if="showDevMode"
        class="text-xs text-gray-500 select-none cursor-pointer"
        @click="showDevMode = false"
        title="Open dev tools with Ctrl+Shift+I"
      >
        dev mode
      </p>
    </div>

    <!-- Hide Sidebar Button -->
    <button
      class="
        absolute
        bottom-0
        end-0
        text-gray-600
        dark:text-gray-500
        hover:bg-gray-100
        dark:hover:bg-gray-875
        rounded
        p-1
        m-4
        rtl-rotate-180
      "
      @click="() => toggleSidebar()"
    >
      <feather-icon name="chevrons-left" class="w-4 h-4" />
    </button>

    <Modal :open-modal="viewShortcuts" @closemodal="viewShortcuts = false">
      <ShortcutsHelper class="w-form" />
    </Modal>
  </div>
</template>
<script lang="ts">
import { fyo } from 'src/initFyo';
import { languageDirectionKey, shortcutsKey } from 'src/utils/injectionKeys';
import { getSidebarConfig } from 'src/utils/sidebarConfig';
import { SidebarConfig, SidebarItem, SidebarRoot } from 'src/utils/types';
import { routeTo, toggleSidebar } from 'src/utils/ui';
import { UpdateState } from 'utils/ipc/types';
import { defineComponent, inject } from 'vue';
import router from '../router';
import Icon from './Icon.vue';
import Modal from './Modal.vue';
import ShortcutsHelper from './ShortcutsHelper.vue';

const COMPONENT_NAME = 'Sidebar';

export default defineComponent({
  components: {
    Icon,
    Modal,
    ShortcutsHelper,
  },
  props: {
    darkMode: { type: Boolean, default: false },
  },
  emits: ['change-db-file', 'toggle-darkmode'],
  setup() {
    return {
      languageDirection: inject(languageDirectionKey),
      shortcuts: inject(shortcutsKey),
    };
  },
  data() {
    return {
      companyName: '',
      groups: [],
      viewShortcuts: false,
      activeGroup: null,
      showDevMode: false,
      unsubscribeUpdate: null as null | (() => void),
      updateState: {
        status: 'idle',
        currentVersion: '',
      } as UpdateState,
    } as {
      companyName: string;
      groups: SidebarConfig;
      viewShortcuts: boolean;
      activeGroup: null | SidebarRoot;
      showDevMode: boolean;
      unsubscribeUpdate: null | (() => void);
      updateState: UpdateState;
    };
  },
  computed: {
    appVersion(): string {
      return fyo.store.appVersion;
    },
    updateIcon(): string {
      switch (this.updateState.status) {
        case 'checking':
          return 'refresh-cw';
        case 'available':
          return 'download';
        case 'downloading':
          return 'download';
        case 'downloaded':
          return 'check-circle';
        case 'not-available':
          return 'check-circle';
        case 'error':
          return 'alert-circle';
        default:
          return 'refresh-cw';
      }
    },
    updateLabel(): string {
      const version =
        this.appVersion || this.updateState.currentVersion || '0.40.5';
      switch (this.updateState.status) {
        case 'checking':
          return this.t`Checking...`;
        case 'available':
          return this.updateState.availableVersion
            ? this.t`Update to v${this.updateState.availableVersion}`
            : this.t`Update available`;
        case 'downloading':
          return typeof this.updateState.progress === 'number'
            ? this.t`Downloading ${this.updateState.progress}%`
            : this.t`Downloading...`;
        case 'downloaded':
          return this.t`Restart to install`;
        case 'not-available':
          return this.t`Up to date (v${version})`;
        case 'error':
          return this.t`Update check failed`;
        default:
          return this.t`Check for updates`;
      }
    },
    updateTooltip(): string {
      const version =
        this.appVersion || this.updateState.currentVersion || '0.40.5';
      switch (this.updateState.status) {
        case 'checking':
          return this.t`Checking for updates...`;
        case 'available':
          return this.updateState.availableVersion
            ? this.t`Version ${this.updateState.availableVersion} is available. Click to download.`
            : this.t`Update is available. Click to download.`;
        case 'downloading':
          return this.t`Downloading update (${this.updateState.progress ?? 0}%)...`;
        case 'downloaded':
          return this.t`Update downloaded. Click to restart VEYRO and apply update.`;
        case 'not-available':
          return this.t`VEYRO v${version} is up to date. Click to check again.`;
        case 'error':
          return this.updateState.error
            ? this.t`${this.updateState.error}. Click to retry.`
            : this.t`Update check failed. Click to retry.`;
        default:
          return this.t`VEYRO v${version}. Click to check for updates.`;
      }
    },
    updateButtonClass(): string {
      switch (this.updateState.status) {
        case 'available':
          return 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium';
        case 'downloading':
          return 'text-blue-600 dark:text-blue-400 cursor-wait';
        case 'downloaded':
          return 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium';
        case 'checking':
          return 'text-gray-500 dark:text-gray-400 cursor-wait';
        case 'not-available':
          return 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300';
        case 'error':
          return 'text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium';
        default:
          return 'text-gray-600 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-400';
      }
    },
    isUpdateDisabled(): boolean {
      return (
        this.updateState.status === 'checking' ||
        this.updateState.status === 'downloading'
      );
    },
  },
  async mounted() {
    const { companyName } = await fyo.doc.getDoc('AccountingSettings');
    this.companyName = companyName as string;
    this.groups = await getSidebarConfig();

    this.setActiveGroup();
    router.afterEach(() => {
      this.setActiveGroup();
    });

    this.shortcuts?.shift.set(COMPONENT_NAME, ['KeyH'], () => {
      if (document.body === document.activeElement) {
        this.toggleSidebar();
      }
    });

    this.showDevMode = this.fyo.store.isDevelopment;

    if (typeof ipc !== 'undefined') {
      try {
        const state = await ipc.getUpdateStatus?.();
        if (state) {
          this.updateState = state;
        }
      } catch {
        // ignore
      }
      this.unsubscribeUpdate =
        ipc.registerUpdateStatusListener?.(this.handleUpdateStatusChanged) ??
        null;
    }
  },
  unmounted() {
    this.shortcuts?.delete(COMPONENT_NAME);
    if (this.unsubscribeUpdate) {
      this.unsubscribeUpdate();
      this.unsubscribeUpdate = null;
    } else if (typeof ipc !== 'undefined') {
      ipc.unregisterUpdateStatusListener?.(this.handleUpdateStatusChanged);
    }
  },
  methods: {
    routeTo,
    toggleSidebar,
    setActiveGroup() {
      const { fullPath } = this.$router.currentRoute.value;
      const fallBackGroup = this.activeGroup;
      this.activeGroup =
        this.groups.find((g) => {
          if (
            g.name === 'parties' &&
            (fullPath.startsWith('/parties') ||
              fullPath.startsWith('/edit/Party') ||
              fullPath.startsWith('/print/Party'))
          ) {
            return true;
          }

          if (
            g.name === 'reports' &&
            (fullPath.startsWith('/report') ||
              fullPath.startsWith('/report-print'))
          ) {
            return true;
          }

          if (fullPath.startsWith(g.route) && g.route !== '/') {
            return true;
          }

          if (g.route === fullPath) {
            return true;
          }

          if (g.items) {
            let activeItem = g.items.filter(
              ({ route }) => route === fullPath || fullPath.startsWith(route)
            );

            if (activeItem.length) {
              return true;
            }
          }
        }) ??
        fallBackGroup ??
        this.groups[0];
    },
    isItemActive(item: SidebarItem) {
      const { path: currentRoute, params } = this.$route;
      const routeMatch = currentRoute === item.route;

      const schemaNameMatch =
        item.schemaName && params.schemaName === item.schemaName;

      const isMatch = routeMatch || schemaNameMatch;
      if (params.name && item.schemaName && !isMatch) {
        return currentRoute.includes(`${item.schemaName}/${params.name}`);
      }

      return isMatch;
    },
    isGroupActive(group: SidebarRoot) {
      return this.activeGroup && group.label === this.activeGroup.label;
    },
    routeToSidebarItem(item: SidebarItem | SidebarRoot) {
      routeTo(this.getPath(item));
    },
    getPath(item: SidebarItem | SidebarRoot) {
      const { route: path, filters } = item;
      if (!filters) {
        return path;
      }

      return { path, query: { filters: JSON.stringify(filters) } };
    },
    handleUpdateStatusChanged(_event: unknown, state: UpdateState) {
      if (state) {
        this.updateState = state;
      }
    },
    async onUpdateClick() {
      if (typeof ipc === 'undefined' || this.isUpdateDisabled) {
        return;
      }

      try {
        if (this.updateState.status === 'available') {
          const state = await ipc.downloadUpdate?.();
          if (state) {
            this.updateState = state;
          }
          return;
        }

        if (this.updateState.status === 'downloaded') {
          await ipc.quitAndInstallUpdate?.();
          return;
        }

        const state = await ipc.checkForUpdates?.(true);
        if (state) {
          this.updateState = state;
        }
      } catch (err) {
        console.error('Error handling update action:', err);
      }
    },
  },
});
</script>

<style scoped>
.nivo-nav-item {
  margin: 2px 8px;
  border-radius: 10px;
}

.nivo-wordmark {
  letter-spacing: -0.04em;
  line-height: 1.25;
}
</style>
