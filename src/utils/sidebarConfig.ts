import { t } from 'fyo';
import { SidebarConfig } from './types';

export function getSidebarConfig(): SidebarConfig {
  const sideBar = getCompleteSidebar();
  return getFilteredSidebar(sideBar);
}

function getFilteredSidebar(sideBar: SidebarConfig): SidebarConfig {
  return sideBar.filter((root) => {
    root.items = root.items?.filter((item) => {
      if (item.hidden !== undefined) {
        return !item.hidden();
      }

      return true;
    });

    if (root.hidden !== undefined) {
      return !root.hidden();
    }

    return true;
  });
}

function getReportSidebar() {
  return {
    label: t`Reports`,
    name: 'reports',
    icon: 'reports',
    route: '/reports/sales',
    items: [
      {
        label: t`Sales Report`,
        name: 'sales-report',
        route: '/reports/sales',
      },
      {
        label: t`Purchase Report`,
        name: 'purchase-report',
        route: '/reports/purchase',
      },
    ],
  };
}

function getCompleteSidebar(): SidebarConfig {
  return [
    {
      label: t`Dashboard`,
      name: 'dashboard',
      route: '/',
      icon: 'dashboard',
    },
    {
      label: t`Parties`,
      name: 'parties',
      route: '/parties',
      icon: 'parties',
    },
    getReportSidebar(),
    {
      label: t`Settings`,
      name: 'settings',
      route: '/settings',
      icon: 'settings',
    },
  ];
}
