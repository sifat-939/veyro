import { Fyo, t } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { Invoice } from 'models/baseModels/Invoice/Invoice';
import { ModelNameEnum } from 'models/types';
import { FieldTypeEnum, Schema, TargetField } from 'schemas/types';
import { showToast } from './interactive';
import { PrintValues } from './types';
import { getSavePath, showExportInFolder } from './ui';
import { Money } from 'pesa';
import { migrateStandardPrint } from 'utils/migrateStandardPrint';
import {
  addStandardDocumentValues,
  getStatementValues,
} from 'utils/standardPrintValues';
import { wordsWithCurrency } from 'utils/printFormat';

export type PrintTemplateHint = {
  [key: string]: string | PrintTemplateHint | PrintTemplateHint[];
};
type PrintTemplateData = Record<string, unknown>;
const excludedPrintHintFields = new Set([
  'discountAfterTax',
  'enableTaxTemplates',
  'gstin',
  'gstType',
  'hsnCode',
  'itemTaxedTotal',
  'tax',
  'taxId',
  'taxes',
  'taxesAdded',
]);

const printSettingsFields = [
  'logo',
  'authorizedSignature',
  'paymentQR',
  'displayLogo',
  'color',
  'font',
  'email',
  'phone',
  'address',
  'companyName',
  'amountInWords',
  'displaytermsandconditions',
  'termsAndConditions',
];

export async function getPrintTemplatePropValues(
  doc: Doc,
  statementRange: { from?: string; to?: string } = {}
): Promise<PrintValues> {
  const printSettings = await doc.fyo.doc.getDoc(ModelNameEnum.PrintSettings);
  const print = await getPrintSettingsValues(doc.fyo);
  if (doc.schemaName === 'Party') {
    const values = await getStatementValues(
      doc,
      statementRange.from,
      statementRange.to
    );
    return {
      doc: {
        ...values,
        totalInWords: wordsWithCurrency(
          values.closingAmount,
          undefined,
          doc.fyo.singles.SystemSettings?.currency
        ),
      },
      print,
    } as PrintValues;
  }
  const values = await getPrintTemplateDocValues(doc);
  if (doc instanceof Invoice)
    values.totalDiscount = formattedTotalDiscount(doc);
  await addStandardDocumentValues(doc, values);
  const total = (doc.grandTotal ??
    doc.netPay ??
    doc.amountPaid ??
    doc.amount) as Money | undefined;
  if (
    total &&
    !['Shipment', 'PurchaseReceipt', 'StockMovement', 'JournalEntry'].includes(
      doc.schemaName
    )
  )
    values.totalInWords = wordsWithCurrency(
      Math.abs(total.float),
      typeof doc.currency === 'string' ? doc.currency : undefined,
      doc.fyo.singles.SystemSettings?.currency
    );
  if (printSettings.displayTime && doc.date)
    values.time = getTime(String(doc.date));
  return { doc: values, print };
}

export async function getPrintSettingsValues(fyo: Fyo) {
  const settings = await fyo.doc.getDoc(ModelNameEnum.PrintSettings);
  return getPrintTemplateDocValues(settings, printSettingsFields);
}

function getTime(dateString: string): string {
  const date = new Date(dateString);

  return date.toTimeString().split(' ')[0];
}

export function getPrintTemplatePropHints(schemaName: string, fyo: Fyo) {
  const hints: PrintTemplateHint = {};
  const schema = fyo.schemaMap[schemaName]!;
  hints.doc = getPrintTemplateDocHints(schema, fyo);

  const printSettingsHints = getPrintTemplateDocHints(
    fyo.schemaMap[ModelNameEnum.PrintSettings]!,
    fyo,
    printSettingsFields
  );
  hints.print = {
    ...printSettingsHints,
  };

  if (schemaName?.endsWith('Invoice')) {
    (hints.doc as PrintTemplateData).totalDiscount = fyo.t`Total Discount`;
  }

  return hints;
}


function formattedTotalDiscount(doc: Doc): string {
  if (!(doc instanceof Invoice)) {
    return '';
  }

  const totalDiscount = doc.getTotalDiscount();
  if (!totalDiscount?.float) {
    return '';
  }

  return doc.fyo.format(totalDiscount, ModelNameEnum.Currency);
}

function getPrintTemplateDocHints(
  schema: Schema,
  fyo: Fyo,
  fieldnames?: string[],
  linkLevel?: number
): PrintTemplateHint {
  linkLevel ??= 0;
  const hints: PrintTemplateHint = {};
  const links: PrintTemplateHint = {};

  let fields = schema.fields;
  if (fieldnames) {
    fields = fields.filter((f) => fieldnames.includes(f.fieldname));
  }

  for (const field of fields) {
    const { fieldname, fieldtype, label, meta } = field;
    if (
      fieldtype === FieldTypeEnum.Attachment ||
      meta ||
      excludedPrintHintFields.has(fieldname)
    ) {
      continue;
    }

    hints[fieldname] = label ?? fieldname;
    const { target } = field as TargetField;
    const targetSchema = fyo.schemaMap[target];
    if (fieldtype === FieldTypeEnum.Link && targetSchema && linkLevel < 2) {
      links[fieldname] = getPrintTemplateDocHints(
        targetSchema,
        fyo,
        undefined,
        linkLevel + 1
      );
    }

    if (fieldtype === FieldTypeEnum.Table && targetSchema) {
      hints[fieldname] = [getPrintTemplateDocHints(targetSchema, fyo)];
    }
  }

  hints.submitted = fyo.t`Submitted`;
  hints.entryType = fyo.t`Entry Type`;
  hints.entryLabel = fyo.t`Entry Label`;

  if (Object.keys(links).length) {
    hints.links = links;
  }
  return hints;
}

async function getPrintTemplateDocValues(doc: Doc, fieldnames?: string[]) {
  const values: PrintTemplateData = {};
  if (!(doc instanceof Doc)) {
    return values;
  }

  let fields = doc.schema.fields;
  if (fieldnames) {
    fields = fields.filter((f) => fieldnames.includes(f.fieldname));
  }

  // Set Formatted Doc Data
  for (const field of fields) {
    const { fieldname, fieldtype, meta } = field;
    if (fieldtype === FieldTypeEnum.Attachment || meta) {
      continue;
    }

    const value = doc.get(fieldname);

    if (!value) {
      values[fieldname] = '';
      continue;
    }

    if (!Array.isArray(value)) {
      values[fieldname] = doc.fyo.format(value, field, doc);
      continue;
    }

    const table: PrintTemplateData[] = [];
    for (const row of value) {
      const rowProps = await getPrintTemplateDocValues(row);
      table.push(rowProps);
    }

    values[fieldname] = table;
  }

  values.submitted = doc.submitted;
  values.entryType = doc.schema.name;
  values.entryLabel = doc.schema.label;

  // Set Formatted Doc Link Data
  await doc.loadLinks();
  const links: PrintTemplateData = {};
  for (const [linkName, linkDoc] of Object.entries(doc.links ?? {})) {
    if (fieldnames && !fieldnames.includes(linkName)) {
      continue;
    }

    links[linkName] = await getPrintTemplateDocValues(linkDoc);
  }

  if (Object.keys(links).length) {
    values.links = links;
  }
  return values;
}

export async function getPathAndMakePDF(
  name: string,
  innerHTML: string,
  width: number,
  height: number,
  shouldPrint?: boolean
) {
  if (!shouldPrint) {
    const { filePath: savePath } = await getSavePath(name, 'pdf');
    if (!savePath) {
      return;
    }

    const html = constructPrintDocument(innerHTML);
    const success = await ipc.makePDF(html, savePath, width, height);
    if (success) {
      showExportInFolder(t`Save as PDF Successful`, savePath);
    } else {
      showToast({ message: t`Export Failed`, type: 'error' });
    }
  } else {
    const html = constructPrintDocument(innerHTML);
    const success = await ipc.printDocument(html, width, height);
    if (success) {
      showToast({ message: t`Print Successful`, type: 'success' });
    } else {
      showToast({ message: t`Print Failed`, type: 'error' });
    }
  }
}

function constructPrintDocument(innerHTML: string) {
  const html = document.createElement('html');
  const head = document.createElement('head');
  const body = document.createElement('body');
  const style = getAllCSSAsStyleElem();

  const printCSS = document.createElement('style');
  printCSS.innerHTML = `
    @media print {
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: white;
      }

      @page {
        margin: 8mm;
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
    }
  `;

  head.innerHTML = [
    '<meta charset="UTF-8">',
    '<title>Print Window</title>',
  ].join('\n');

  head.append(style, printCSS);

  body.innerHTML = innerHTML;
  html.append(head, body);
  return html.outerHTML;
}

function getAllCSSAsStyleElem() {
  const cssTexts: string[] = [];
  for (const sheet of document.styleSheets) {
    for (const rule of sheet.cssRules) {
      cssTexts.push(rule.cssText);
    }

    if (sheet.ownerRule) {
      cssTexts.push(sheet.ownerRule.cssText);
    }
  }

  const styleElem = document.createElement('style');
  styleElem.innerHTML = cssTexts.join('\n');
  return styleElem;
}

export async function updatePrintTemplates(fyo: Fyo) {
  const files = await ipc.getTemplates();
  const standard = files.find(
    (file) => file.file === 'Nivo Standard.All.template.html'
  );
  if (!standard) throw new Error('Nivo Standard print template is missing.');
  await migrateStandardPrint(fyo, standard.template);
}

export const baseTemplate = `<main class="h-full w-full bg-white">

  <!-- Edit This Code -->
  <header class="p-4 flex justify-between border-b">
    <h2 
      class="font-semibold text-2xl" 
      :style="{ color: print.color }"
    >
      {{ print.companyName }}
    </h2>
    <h2 class="font-semibold text-2xl" >
      {{ doc.name }}
    </h2>
  </header>

  <div class="p-4 text-gray-600">
    Edit the code in the Template Editor on the right
    to create your own personalized custom template.
  </div>

</main>
`;
