import * as XLSX from 'xlsx';

interface ExcelRow {
  [key: string]: string | number | null;
}

export function exportToExcel(
  data: ExcelRow[],
  filename: string,
  sheetName: string = 'Data'
) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function generateCurrentMonitorExcel(
  chartData: Record<string, string | number>[],
  deviceName: string,
  customerName?: string
) {
  const rows = chartData.map((row) => ({
    'Time': row.time || '',
    'L1 Current (A)': row.l1 !== undefined ? Number(row.l1).toFixed(2) : '',
    'L2 Current (A)': row.l2 !== undefined ? Number(row.l2).toFixed(2) : '',
    'L3 Current (A)': row.l3 !== undefined ? Number(row.l3).toFixed(2) : '',
    'Average Current (A)': row.avg !== undefined ? Number(row.avg).toFixed(2) : '',
  }));

  const timestamp = new Date().toLocaleString();
  const title = customerName
    ? `${customerName} - ${deviceName}`
    : deviceName;

  exportToExcel(
    rows,
    `current-monitor-${deviceName.replace(/\s+/g, '_')}`,
    'Current Data'
  );
}

export function generateMonthlyEnergyExcel(
  monthlyData: Record<string, string | number>[],
  siteName?: string
) {
  const rows = monthlyData.map((row) => ({
    'Date': row.date || row.month || '',
    'Energy (kWh)': row.energy !== undefined ? Number(row.energy).toFixed(2) : '',
    'Cost': row.cost || '',
    'Peak Load (kW)': row.peakLoad !== undefined ? Number(row.peakLoad).toFixed(2) : '',
    'Average Load (kW)': row.avgLoad !== undefined ? Number(row.avgLoad).toFixed(2) : '',
  }));

  exportToExcel(
    rows,
    `monthly-energy${siteName ? `-${siteName.replace(/\s+/g, '_')}` : ''}`,
    'Monthly Energy'
  );
}
