import { t } from 'fyo';
import {
  AccountRootType,
  AccountRootTypeEnum,
} from 'models/baseModels/Account/types';
import {
  AccountReport,
  convertAccountRootNodesToAccountList,
} from 'reports/AccountReport';
import {
  AccountListNode,
  AccountTreeNode,
  ReportData,
  ReportRow,
  ValueMap,
} from 'reports/types';

export class ProfitAndLoss extends AccountReport {
  static title = t`Profit And Loss`;
  static reportName = 'profit-and-loss';
  loading = false;

  get rootTypes(): AccountRootType[] {
    return [AccountRootTypeEnum.Income, AccountRootTypeEnum.Expense];
  }

  async setReportData(filter?: string, force?: boolean) {
    this.loading = true;
    if (force || filter !== 'hideGroupAmounts') {
      await this._setRawData();
    }

    const map = this._getGroupedMap(true, 'account');
    const rangeGroupedMap = await this._getGroupedByDateRanges(map);
    const accountTree = await this._getAccountTree(rangeGroupedMap);

    for (const name of Object.keys(accountTree)) {
      const { rootType } = accountTree[name];
      if (this.rootTypes.includes(rootType)) {
        continue;
      }

      delete accountTree[name];
    }

    /**
     * Income Rows
     */
    const incomeRoots = this.getRootNodes(
      AccountRootTypeEnum.Income,
      accountTree
    )!;
    const incomeList = convertAccountRootNodesToAccountList(incomeRoots);
    const incomeRows = this.getReportRowsFromAccountList(incomeList);

    /**
     * Expense Rows
     */
    const expenseRoots = this.getRootNodes(
      AccountRootTypeEnum.Expense,
      accountTree
    )!;
    const expenseList = convertAccountRootNodesToAccountList(expenseRoots);
    const expenseRows = this.getReportRowsFromAccountList(expenseList);

    this.reportData = this.getReportDataFromRows(
      incomeRows,
      expenseRows,
      incomeRoots,
      expenseRoots
    );
    this.loading = false;
  }

  getReportDataFromRows(
    incomeRows: ReportData,
    expenseRows: ReportData,
    incomeRoots: AccountTreeNode[] | undefined,
    expenseRoots: AccountTreeNode[] | undefined
  ): ReportData {
    if (
      incomeRoots &&
      incomeRoots.length &&
      (!expenseRoots || !expenseRoots.length)
    ) {
      return this.getIncomeOrExpenseRows(
        incomeRoots,
        incomeRows,
        t`Total Income (Credit)`
      );
    }

    if (
      expenseRoots &&
      expenseRoots.length &&
      (!incomeRoots || !incomeRoots.length)
    ) {
      return this.getIncomeOrExpenseRows(
        expenseRoots,
        expenseRows,
        t`Total Expense (Debit)`
      );
    }

    if (
      !incomeRoots ||
      !incomeRoots.length ||
      !expenseRoots ||
      !expenseRoots.length
    ) {
      const cashRows =
        typeof this.getRealizedCashRows === 'function'
          ? this.getRealizedCashRows()
          : [];
      if (cashRows.length) {
        return cashRows.filter((r, idx) => !(idx === 0 && r.isEmpty));
      }
      return [];
    }

    return this.getIncomeAndExpenseRows(
      incomeRows,
      expenseRows,
      incomeRoots,
      expenseRoots
    );
  }

  getIncomeOrExpenseRows(
    roots: AccountTreeNode[],
    rows: ReportData,
    totalRowName: string
  ): ReportData {
    const total = this.getTotalNode(roots, totalRowName);
    const totalRow = this.getRowFromAccountListNode(total);
    const cashRows =
      typeof this.getRealizedCashRows === 'function'
        ? this.getRealizedCashRows()
        : [];

    return [rows, totalRow, ...cashRows].flat();
  }

  getIncomeAndExpenseRows(
    incomeRows: ReportData,
    expenseRows: ReportData,
    incomeRoots: AccountTreeNode[],
    expenseRoots: AccountTreeNode[]
  ) {
    const totalIncome = this.getTotalNode(
      incomeRoots,
      t`Total Income (Credit)`
    );
    const totalIncomeRow = this.getRowFromAccountListNode(totalIncome);

    const totalExpense = this.getTotalNode(
      expenseRoots,
      t`Total Expense (Debit)`
    );
    const totalExpenseRow = this.getRowFromAccountListNode(totalExpense);

    const totalValueMap: ValueMap = new Map();
    for (const key of totalIncome.valueMap!.keys()) {
      const income = totalIncome.valueMap!.get(key)?.balance ?? 0;
      const expense = totalExpense.valueMap!.get(key)?.balance ?? 0;
      totalValueMap.set(key, { balance: income - expense });
    }

    const totalProfit = {
      name: t`Total Profit`,
      valueMap: totalValueMap,
      level: 0,
    } as AccountListNode;

    const totalProfitRow = this.getRowFromAccountListNode(totalProfit);
    totalProfitRow.cells.forEach((c) => {
      c.bold = true;
      if (typeof c.rawValue !== 'number') {
        return;
      }

      if (c.rawValue > 0) {
        c.color = 'green';
      } else if (c.rawValue < 0) {
        c.color = 'red';
      }
    });

    const emptyRow = this.getEmptyRow();
    const cashRows =
      typeof this.getRealizedCashRows === 'function'
        ? this.getRealizedCashRows()
        : [];

    return [
      incomeRows,
      totalIncomeRow,
      emptyRow,
      expenseRows,
      totalExpenseRow,
      emptyRow,
      totalProfitRow,
      ...cashRows,
    ].flat() as ReportData;
  }

  getRealizedCashRows(): ReportRow[] {
    if (!this._dateRanges || !this._rawData || !this.accountMap) {
      return [];
    }

    const cashBankAccounts = new Set<string>();
    for (const [name, acc] of Object.entries(this.accountMap)) {
      if (acc.accountType === 'Cash' || acc.accountType === 'Bank') {
        cashBankAccounts.add(name);
      }
    }

    if (cashBankAccounts.size === 0) {
      return [];
    }

    const cashInMap: ValueMap = new Map();
    const cashOutMap: ValueMap = new Map();
    const cashProfitMap: ValueMap = new Map();

    for (const range of this._dateRanges) {
      cashInMap.set(range, { balance: 0 });
      cashOutMap.set(range, { balance: 0 });
      cashProfitMap.set(range, { balance: 0 });
    }

    for (const entry of this._rawData) {
      if (!cashBankAccounts.has(entry.account)) {
        continue;
      }
      const range = this._getRangeMapKey(entry);
      if (!range) {
        continue;
      }

      const currentIn = cashInMap.get(range)?.balance ?? 0;
      const currentOut = cashOutMap.get(range)?.balance ?? 0;

      cashInMap.set(range, { balance: currentIn + (entry.debit ?? 0) });
      cashOutMap.set(range, { balance: currentOut + (entry.credit ?? 0) });
    }

    for (const range of this._dateRanges) {
      const inVal = cashInMap.get(range)?.balance ?? 0;
      const outVal = cashOutMap.get(range)?.balance ?? 0;
      cashProfitMap.set(range, { balance: inVal - outVal });
    }

    const cashInNode = {
      name: t`Realized Cash In (Collections)`,
      valueMap: cashInMap,
      level: 0,
    } as AccountListNode;
    const cashOutNode = {
      name: t`Realized Cash Out (Disbursements)`,
      valueMap: cashOutMap,
      level: 0,
    } as AccountListNode;
    const cashProfitNode = {
      name: t`Realized Cash Profit / Cashflow`,
      valueMap: cashProfitMap,
      level: 0,
    } as AccountListNode;

    const cashInRow = this.getRowFromAccountListNode(cashInNode);
    const cashOutRow = this.getRowFromAccountListNode(cashOutNode);
    const cashProfitRow = this.getRowFromAccountListNode(cashProfitNode);

    cashProfitRow.cells.forEach((c) => {
      c.bold = true;
      if (typeof c.rawValue !== 'number') {
        return;
      }

      if (c.rawValue > 0) {
        c.color = 'green';
      } else if (c.rawValue < 0) {
        c.color = 'red';
      }
    });

    return [this.getEmptyRow(), cashInRow, cashOutRow, cashProfitRow];
  }
}
