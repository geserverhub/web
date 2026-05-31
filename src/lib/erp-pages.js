import { ERP_NAV_STRUCTURE } from '@/lib/ge-energy-erp-i18n';
import { labelFor } from '@/lib/ge-energy-erp-i18n';

export const ERP_ADMIN_PAGE_IDS = ['developers', 'erp-page-access', 'erp-user-create'];

/** Flat list of every ERP page for ACL */
export function getAllErpPages(lang = 'th') {
  const code = lang === 'en' || lang === 'ko' ? lang : 'th';
  const list = [];
  for (const dept of ERP_NAV_STRUCTURE) {
    for (const pageId of dept.pages) {
      if (ERP_ADMIN_PAGE_IDS.includes(pageId)) {
        continue;
      }
      list.push({
        pageId,
        deptId: dept.id,
        deptLabel: labelFor(code, dept.id),
        pageLabel: labelFor(code, pageId),
      });
    }
  }
  return list;
}

export function defaultPageAccessMap(lang = 'th') {
  const pages = getAllErpPages(lang);
  return Object.fromEntries(pages.map((p) => [p.pageId, true]));
}
