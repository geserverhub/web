import {
  GESERVERHUB_DATABASE,
  getGeserverhubConnectionConfig,
  queryGeserverhub,
} from './geserverhub-db';
import {
  getDevicesColumnSet,
  meterIdGroupBySql,
  meterIdSelectSql,
  meterIdWhereSql,
} from '@/lib/ge-energy/devices-schema';

export { GESERVERHUB_DATABASE, getGeserverhubConnectionConfig };

/** @deprecated Prefer queryGeserverhub */
export const queryGe = queryGeserverhub;

/** @deprecated Use queryGeserverhub — same goeunserverhub pool */
export const queryUser = queryGeserverhub;

export async function getAllDevices(): Promise<unknown[]> {
  try {
    const columns = await getDevicesColumnSet();
    const meterSelect = meterIdSelectSql(columns);
    const meterGroup = meterIdGroupBySql(columns);
    const hasBeforeMeterNo = columns.has('beforeMeterNo');
    const hasMetricsMeterNo = columns.has('metricsMeterNo');
    const beforeSelect = hasBeforeMeterNo ? 'd.beforeMeterNo,' : '';
    const metricsSelect = hasMetricsMeterNo ? 'd.metricsMeterNo,' : '';
    const beforeGroup = hasBeforeMeterNo ? 'd.beforeMeterNo,' : '';
    const metricsGroup = hasMetricsMeterNo ? 'd.metricsMeterNo,' : '';

    return await queryGeserverhub(
      `SELECT
        d.deviceID,
        d.deviceName,
        ${meterSelect},
        d.location,
        d.ipAddress,
        ${beforeSelect}
        ${metricsSelect}
        d.phone,
        d.created_at,
        d.updated_at,
        MAX(p.record_time) AS lastRecordTime,
        CASE
          WHEN MAX(p.record_time) >= NOW() - INTERVAL 20 MINUTE THEN 'ON'
          ELSE 'OFF'
        END AS status
       FROM devices d
       LEFT JOIN power_records p ON d.deviceID = p.device_id
       GROUP BY d.deviceID, d.deviceName, ${meterGroup}, d.location, d.ipAddress,
                ${beforeGroup} ${metricsGroup} d.phone, d.created_at, d.updated_at
       ORDER BY d.deviceID ASC`,
    );
  } catch (error) {
    console.error('[mysql-ge] getAllDevices:', error);
    throw error;
  }
}

export async function getDeviceById(deviceID: number): Promise<unknown | null> {
  try {
    const columns = await getDevicesColumnSet();
    const meterSelect = meterIdSelectSql(columns, '');
    const hasBeforeMeterNo = columns.has('beforeMeterNo');
    const hasMetricsMeterNo = columns.has('metricsMeterNo');
    const rows = await queryGeserverhub(
      `SELECT deviceID, deviceName, ${meterSelect}, location, status, ipAddress,
              ${hasBeforeMeterNo ? 'beforeMeterNo,' : ''}
              ${hasMetricsMeterNo ? 'metricsMeterNo,' : ''}
              created_at, updated_at
       FROM devices
       WHERE deviceID = ?`,
      [deviceID],
    );
    return (rows as unknown[])[0] || null;
  } catch (error) {
    console.error('[mysql-ge] getDeviceById:', error);
    return null;
  }
}

export async function getDeviceByGEsaveId(GEsaveID: string): Promise<unknown | null> {
  try {
    const columns = await getDevicesColumnSet();
    const meterCol = meterIdWhereSql(columns, '');
    if (meterCol === 'NULL') return null;
    const meterSelect = meterIdSelectSql(columns, '');
    const hasBeforeMeterNo = columns.has('beforeMeterNo');
    const hasMetricsMeterNo = columns.has('metricsMeterNo');
    const rows = await queryGeserverhub(
      `SELECT deviceID, deviceName, ${meterSelect}, location, status, ipAddress,
              ${hasBeforeMeterNo ? 'beforeMeterNo,' : ''}
              ${hasMetricsMeterNo ? 'metricsMeterNo,' : ''}
              created_at, updated_at
       FROM devices
       WHERE ${meterCol} = ?`,
      [GEsaveID],
    );
    return (rows as unknown[])[0] || null;
  } catch (error) {
    console.error('[mysql-ge] getDeviceByGEsaveId:', error);
    return null;
  }
}

/** @deprecated Use getDeviceByGEsaveId */
export const getDeviceByGeId = getDeviceByGEsaveId;
