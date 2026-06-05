/** Remove legacy " Demo" suffix from seeded customer names (e.g. Thailand Demo → Thailand). */
export function stripDemoSuffix(name: string | null | undefined): string {
  const value = String(name || '').trim();
  if (!value) return '';
  return value.replace(/\s+Demo$/i, '').trim() || value;
}

export function normalizeCustomerDisplayName(
  name: string | null | undefined,
  fallback?: string | null,
): string {
  const normalized = stripDemoSuffix(name);
  if (normalized) return normalized;
  const fb = String(fallback || '').trim();
  return fb || '—';
}

let legacyDemoNamesStripped = false;

/** One-time DB cleanup: Thailand Demo → Thailand, etc. */
export async function stripLegacyDemoCustomerNames(
  query: (sql: string, params?: unknown[]) => Promise<unknown[]>,
): Promise<void> {
  if (legacyDemoNamesStripped) return;
  legacyDemoNamesStripped = true;

  try {
    await query(
      `UPDATE devices
       SET customerName = TRIM(REGEXP_REPLACE(customerName, ' Demo$', ''))
       WHERE customerName REGEXP ' Demo$'`,
    );
  } catch {
    try {
      await query(
        `UPDATE devices
         SET customerName = TRIM(REPLACE(customerName, ' Demo', ''))
         WHERE customerName LIKE '% Demo'`,
      );
    } catch {
      /* column may not exist */
    }
  }

  try {
    await query(
      `UPDATE eq_customers
       SET customer_name = TRIM(REGEXP_REPLACE(customer_name, ' Demo$', '')),
           contact_person = TRIM(REGEXP_REPLACE(contact_person, ' Demo$', ''))
       WHERE customer_name REGEXP ' Demo$'
          OR contact_person REGEXP ' Demo$'`,
    );
  } catch {
    /* eq_customers may not exist */
  }
}
