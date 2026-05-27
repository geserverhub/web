'use client';

import { useMemo } from 'react';
import { ERP_NAV_STRUCTURE } from '@/lib/ge-energy-erp-i18n';
import { labelFor } from '@/lib/ge-energy-erp-i18n';
import { ERP_ADMIN_PAGE_IDS } from '@/lib/erp-pages';

export default function ErpPageAclMatrix({
  lang,
  pages,
  onChange,
  includeAdminPages = false,
  disabled = false,
}) {
  const groups = useMemo(() => {
    const code = lang === 'en' || lang === 'ko' ? lang : 'th';
    return ERP_NAV_STRUCTURE.map((dept) => ({
      deptId: dept.id,
      deptLabel: labelFor(code, dept.id),
      pages: dept.pages
        .filter((id) => includeAdminPages || !ERP_ADMIN_PAGE_IDS.includes(id))
        .map((pageId) => ({
          pageId,
          label: labelFor(code, pageId),
          allowed: pages[pageId] !== false,
        })),
    })).filter((g) => g.pages.length > 0);
  }, [lang, pages, includeAdminPages]);

  function toggle(pageId, value) {
    onChange({ ...pages, [pageId]: value });
  }

  function setDeptAll(deptId, value) {
    const dept = ERP_NAV_STRUCTURE.find((d) => d.id === deptId);
    if (!dept) return;
    const next = { ...pages };
    for (const pageId of dept.pages) {
      if (!includeAdminPages && ERP_ADMIN_PAGE_IDS.includes(pageId)) continue;
      next[pageId] = value;
    }
    onChange(next);
  }

  return (
    <div className="geerp-acl">
      {groups.map((group) => (
        <section key={group.deptId} className="geerp-acl-group">
          <div className="geerp-acl-group-head">
            <h3>{group.deptLabel}</h3>
            <div className="geerp-acl-group-actions">
              <button
                type="button"
                disabled={disabled}
                onClick={() => setDeptAll(group.deptId, true)}
              >
                ✓
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => setDeptAll(group.deptId, false)}
              >
                ✕
              </button>
            </div>
          </div>
          <ul className="geerp-acl-list">
            {group.pages.map((p) => (
              <li key={p.pageId}>
                <label className="geerp-acl-check">
                  <input
                    type="checkbox"
                    checked={p.allowed}
                    disabled={disabled}
                    onChange={(e) => toggle(p.pageId, e.target.checked)}
                  />
                  <span>{p.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
