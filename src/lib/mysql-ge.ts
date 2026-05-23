import {
  GESERVERHUB_DATABASE,
  getGeserverhubConnectionConfig,
  queryGeserverhub,
} from './geserverhub-db';

export { GESERVERHUB_DATABASE, getGeserverhubConnectionConfig };

/** @deprecated Prefer queryGeserverhub */
export const queryGe = queryGeserverhub;

/** @deprecated Use queryGeserverhub — same geserverhub pool */
export const queryUser = queryGeserverhub;

export async function getAllDevices(): Promise<unknown[]> {
  try {
    return await queryGeserverhub(
      `SELECT
        d.deviceID,
        d.deviceName,
        d.geID,
        d.location,
        d.ipAddress,
        d.beforeMeterNo,
        d.metricsMeterNo,
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
       GROUP BY d.deviceID, d.deviceName, d.geID, d.location, d.ipAddress,
                d.beforeMeterNo, d.metricsMeterNo, d.phone, d.created_at, d.updated_at
       ORDER BY d.deviceID ASC`
    );
  } catch (error) {
    console.error('[mysql-ge] getAllDevices:', error);
    return [];
  }
}

export async function getDeviceById(deviceID: number): Promise<unknown | null> {
  try {
    const rows = await queryGeserverhub(
      `SELECT deviceID, deviceName, geID, location, status, ipAddress,
              beforeMeterNo, metricsMeterNo, created_at, updated_at
       FROM devices
       WHERE deviceID = ?`,
      [deviceID]
    );
    return (rows as unknown[])[0] || null;
  } catch (error) {
    console.error('[mysql-ge] getDeviceById:', error);
    return null;
  }
}

export async function getDeviceByGeId(geID: string): Promise<unknown | null> {
  try {
    const rows = await queryGeserverhub(
      `SELECT deviceID, deviceName, geID, location, status, ipAddress,
              beforeMeterNo, metricsMeterNo, created_at, updated_at
       FROM devices
       WHERE geID = ?`,
      [geID]
    );
    return (rows as unknown[])[0] || null;
  } catch (error) {
    console.error('[mysql-ge] getDeviceByGeId:', error);
    return null;
  }
}
