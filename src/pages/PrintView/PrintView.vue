<template>
  <div class="flex flex-col flex-1 bg-gray-25 dark:bg-gray-875">
    <PageHeader :border="true" :title="t`Print View`">
      <AutoComplete
        v-if="templateList.length > 1"
        :df="{
          fieldtype: 'AutoComplete',
          fieldname: 'templateName',
          label: t`Template Name`,
          options: templateList.map((n) => ({ label: n, value: n })),
        }"
        input-class="text-base py-0 h-8"
        class="w-40"
        :border="true"
        :value="templateName ?? ''"
        @change="onTemplateNameChange"
      />
      <DropdownWithActions :actions="actions" :title="t`More`" />
      <Button class="text-xs" type="primary" @click="savePDF()">
        {{ t`Save as PDF` }}
      </Button>
      <Button class="text-xs" type="primary" @click="savePDF(true)">
        {{ t`Print` }}
      </Button>
    </PageHeader>

    <div
      v-if="schemaName === 'Party'"
      class="flex flex-wrap items-center justify-between gap-3 p-3 border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-850"
    >
      <div class="flex flex-wrap items-center gap-2">
        <div class="p-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-1 text-xs shadow-sm">
          <button
            v-for="preset in partyDatePresets"
            :key="preset.value"
            type="button"
            class="px-2.5 py-1 rounded-md transition duration-150 font-medium whitespace-nowrap text-xs"
            :class="
              selectedPreset === preset.value
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            "
            @click="applyPartyPreset(preset.value)"
          >
            {{ preset.label }}
          </button>
        </div>

        <!-- Custom Date Range Controls -->
        <div v-if="selectedPreset === 'custom'" class="flex items-center gap-2 text-xs bg-white dark:bg-gray-800 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <span class="text-xs text-gray-500 font-medium ps-1">{{ t`Range:` }}</span>
          <input
            v-model="fromDate"
            type="date"
            class="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
            @change="refreshStatement"
          />
          <span class="text-gray-400">→</span>
          <input
            v-model="toDate"
            type="date"
            class="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
            @change="refreshStatement"
          />
        </div>
      </div>
    </div>
    <!-- Template Display Area -->
    <div class="overflow-auto custom-scroll custom-scroll-thumb1 p-4">
      <!-- Display Hints -->
      <div
        v-if="helperMessage"
        class="text-sm text-gray-700 dark:text-gray-300"
      >
        {{ helperMessage }}
      </div>

      <!-- Template Container -->
      <PrintContainer
        v-if="printProps"
        ref="printContainer"
        :print-schema-name="schemaName"
        :template="printProps.template"
        :values="printProps.values"
        :scale="scale"
        :width="templateDoc?.width"
        :height="templateDoc?.height"
      />
    </div>
  </div>
</template>
<script lang="ts">
import { printTemplateFilter, dateKey } from 'utils/standardPrint';
import { Doc } from 'fyo/model/doc';
import { Action } from 'fyo/model/types';
import { PrintTemplate } from 'models/baseModels/PrintTemplate';
import { ModelNameEnum } from 'models/types';
import Button from 'src/components/Button.vue';
import AutoComplete from 'src/components/Controls/AutoComplete.vue';
import DropdownWithActions from 'src/components/DropdownWithActions.vue';
import PageHeader from 'src/components/PageHeader.vue';
import FormControl from 'src/components/Controls/FormControl.vue';
import { handleErrorWithDialog } from 'src/errorHandling';
import { fyo } from 'src/initFyo';
import { getPrintTemplatePropValues } from 'src/utils/printTemplates';
import { showSidebar } from 'src/utils/refs';
import { PrintValues } from 'src/utils/types';
import { getFormRoute, openSettings, routeTo } from 'src/utils/ui';
import { defineComponent } from 'vue';
import PrintContainer from '../TemplateBuilder/PrintContainer.vue';

export default defineComponent({
  name: 'PrintView',
  components: {
    PageHeader,
    FormControl,
    Button,
    AutoComplete,
    PrintContainer,
    DropdownWithActions,
  },
  props: {
    schemaName: { type: String, required: true },
    name: { type: String, required: true },
  },
  data() {
    return {
      fromDate: '',
      toDate: dateKey(new Date()),
      selectedPreset: 'all',
      doc: null,
      scale: 1,
      values: null,
      templateDoc: null,
      templateName: null,
      templateList: [],
    } as {
      fromDate: string;
      toDate: string;
      selectedPreset: 'all' | 'today' | 'yesterday' | 'this_month' | 'this_year' | 'custom';
      doc: null | Doc;
      scale: number;
      values: null | PrintValues;
      templateDoc: null | PrintTemplate;
      templateName: null | string;
      templateList: string[];
    };
  },
  computed: {
    partyDatePresets(): Array<{ label: string; value: 'all' | 'today' | 'yesterday' | 'this_month' | 'this_year' | 'custom' }> {
      return [
        { label: this.t`All Time`, value: 'all' },
        { label: this.t`Today`, value: 'today' },
        { label: this.t`Yesterday`, value: 'yesterday' },
        { label: this.t`This Month`, value: 'this_month' },
        { label: this.t`This Year`, value: 'this_year' },
        { label: this.t`Custom`, value: 'custom' },
      ];
    },
    resolvedSchemaName(): string {
      if (this.fyo.schemaMap[this.schemaName]) {
        return this.schemaName;
      }
      const cleaned = this.schemaName.replace(/[\s\-_]+/g, '').toLowerCase();
      for (const key of Object.keys(this.fyo.schemaMap)) {
        if (key.toLowerCase() === cleaned) {
          return key;
        }
      }
      return this.schemaName;
    },
    helperMessage() {
      if (!this.templateList.length) {
        const label =
          this.fyo.schemaMap[this.resolvedSchemaName]?.label ?? this.resolvedSchemaName;

        return this.t`No Print Templates not found for entry type ${label}`;
      }

      if (!this.templateDoc) {
        return this.t`Please select a Print Template`;
      }

      return '';
    },
    printProps(): null | { template: string; values: PrintValues } {
      const values = this.values;
      if (!values) {
        return null;
      }

      const template = this.templateDoc?.template;
      if (!template) {
        return null;
      }

      return { values, template };
    },
    actions(): Action[] {
      const actions = [
        {
          label: this.t`Print Settings`,
          group: this.t`View`,
          async action() {
            await openSettings(ModelNameEnum.PrintSettings);
          },
        },
      ];

      const templateDocName = this.templateDoc?.name;
      if (templateDocName) {
        actions.push({
          label: templateDocName,
          group: this.t`View`,
          action: async () => {
            const route = getFormRoute(
              ModelNameEnum.PrintTemplate,
              templateDocName
            );
            await routeTo(route);
          },
        });
      }

      return actions;
    },
  },
  async mounted() {
    await this.initialize();
    if (fyo.store.isDevelopment) {
      // @ts-ignore
      window.pv = this;
    }
  },
  async activated() {
    await this.initialize();
  },
  unmounted() {
    this.reset();
  },
  deactivated() {
    this.reset();
  },
  methods: {
    async applyPartyPreset(preset: 'all' | 'today' | 'yesterday' | 'this_month' | 'this_year' | 'custom') {
      this.selectedPreset = preset;
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();

      if (preset === 'all') {
        this.fromDate = '';
        this.toDate = '';
      } else if (preset === 'today') {
        const todayStr = dateKey(now);
        this.fromDate = todayStr;
        this.toDate = todayStr;
      } else if (preset === 'yesterday') {
        const yest = new Date();
        yest.setDate(yest.getDate() - 1);
        const yestStr = dateKey(yest);
        this.fromDate = yestStr;
        this.toDate = yestStr;
      } else if (preset === 'this_month') {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        this.fromDate = dateKey(firstDay);
        this.toDate = dateKey(lastDay);
      } else if (preset === 'this_year') {
        const firstDay = new Date(year, 0, 1);
        const lastDay = new Date(year, 11, 31);
        this.fromDate = dateKey(firstDay);
        this.toDate = dateKey(lastDay);
      } else if (preset === 'custom') {
        if (!this.fromDate && !this.toDate) {
          const firstDay = new Date(year, month, 1);
          const lastDay = new Date(year, month + 1, 0);
          this.fromDate = dateKey(firstDay);
          this.toDate = dateKey(lastDay);
        }
      }
      await this.refreshStatement();
    },
    async setStatementFrom(value: unknown) {
      this.selectedPreset = 'custom';
      this.fromDate =
        value instanceof Date && !Number.isNaN(value.valueOf())
          ? dateKey(value)
          : typeof value === 'string'
          ? value
          : '';
      await this.refreshStatement();
    },
    async setStatementTo(value: unknown) {
      this.selectedPreset = 'custom';
      this.toDate =
        value instanceof Date && !Number.isNaN(value.valueOf())
          ? dateKey(value)
          : typeof value === 'string' && value
          ? value
          : dateKey(new Date());
      await this.refreshStatement();
    },
    async refreshStatement() {
      if (!this.doc) return;
      try {
        this.values = await getPrintTemplatePropValues(this.doc as Doc, {
          from: this.fromDate,
          to: this.toDate,
        });
      } catch (error) {
        this.values = null;
        await handleErrorWithDialog(error);
      }
    },
    async initialize() {
      if (this.$route.query.preset && typeof this.$route.query.preset === 'string') {
        const p = this.$route.query.preset as 'all' | 'today' | 'yesterday' | 'this_month' | 'this_year' | 'custom';
        if (['all', 'today', 'yesterday', 'this_month', 'this_year', 'custom'].includes(p)) {
          this.selectedPreset = p;
        }
      } else if (this.$route.query.from || this.$route.query.to) {
        this.selectedPreset = 'custom';
      }
      if (this.$route.query.from && typeof this.$route.query.from === 'string') {
        this.fromDate = this.$route.query.from;
      }
      if (this.$route.query.to && typeof this.$route.query.to === 'string') {
        this.toDate = this.$route.query.to;
      }
      this.doc = await fyo.doc.getDoc(this.resolvedSchemaName, this.name);
      await this.setTemplateList();
      await this.setTemplateFromDefault();
      if (!this.templateDoc && this.templateList.length) {
        await this.onTemplateNameChange(this.templateList[0]);
      }

      if (this.doc) {
        this.values = await getPrintTemplatePropValues(this.doc as Doc, {
          from: this.fromDate,
          to: this.toDate,
        });
      }
    },
    setScale() {
      this.scale = 1;
      const width = (this.templateDoc?.width ?? 21) * 37.8;
      let containerWidth = window.innerWidth - 32;
      if (showSidebar.value) {
        containerWidth -= 12 * 16;
      }

      this.scale = Math.min(containerWidth / width, 1);
    },
    reset() {
      this.doc = null;
      this.values = null;
      this.templateList = [];
      this.templateDoc = null;
      this.scale = 1;
      this.fromDate = '';
      this.toDate = dateKey(new Date());
    },
    async onTemplateNameChange(value: string | null): Promise<void> {
      if (!value) {
        this.templateDoc = null;
        return;
      }

      this.templateName = value;
      try {
        this.templateDoc = (await this.fyo.doc.getDoc(
          ModelNameEnum.PrintTemplate,
          this.templateName
        )) as PrintTemplate;
      } catch (error) {
        await handleErrorWithDialog(error);
      }
      this.setScale();
    },
    async setTemplateList(): Promise<void> {
      const list = (await this.fyo.db.getAllRaw(ModelNameEnum.PrintTemplate, {
        filters: printTemplateFilter(this.schemaName),
      })) as { name: string }[];

      this.templateList = list.map(({ name }) => name);
    },
    async savePDF(shouldPrint?: boolean) {
      const printContainer = this.$refs.printContainer as {
        savePDF: (name?: string, shouldPrint?: boolean) => Promise<void>;
      };

      if (!printContainer?.savePDF) {
        return;
      }

      await printContainer.savePDF(this.doc?.name, shouldPrint);
    },
    async setTemplateFromDefault() {
      const defaultName =
        this.schemaName[0].toLowerCase() +
        this.schemaName.slice(1) +
        ModelNameEnum.PrintTemplate;

      let templateName;

      if (
        this.schemaName == ModelNameEnum.SalesInvoice &&
        (this.doc as Doc).isPOS
      ) {
        templateName = this.fyo.singles.Defaults?.posPrintTemplate;

        const posProfileName = this.fyo.singles.POSSettings
          ?.posProfile as string;

        if (posProfileName) {
          const posProfile = await this.fyo.doc.getDoc(
            ModelNameEnum.POSProfile,
            posProfileName
          );

          if (posProfile.posPrintTemplate) {
            templateName = posProfile.posPrintTemplate;
          }
        }
      } else {
        templateName = this.fyo.singles.Defaults?.get(defaultName);
      }

      if (typeof templateName !== 'string') {
        return;
      }

      if (this.templateList.includes(templateName))
        await this.onTemplateNameChange(templateName);
    },
  },
});
</script>
