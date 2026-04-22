import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'ksystem',
  password: process.env.MYSQL_PASSWORD || 'Ksave2025Admin',
  database: 'ksystem',
  connectionLimit: 10,
  timezone: '+00:00'
})

/**
 * Query ksave database with parameterized statements
 */
export async function queryKsave(sql: string, values?: any[]): Promise<any[]> {
  const conn = await pool.getConnection()
  try {
    const [rows] = await conn.query(sql, values)
    return Array.isArray(rows) ? rows : [rows]
  } finally {
    conn.release()
  }
}

/**
 * Get all devices from ksave.devices table with real-time status from power_records
 * Status logic:
 * - ON: Device has power records within the last 20 minutes
 * - OFF: No records or last record is older than 20 minutes
 */
export async function getAllDevices(): Promise<any[]> {
  try {
    const devices = await queryKsave(
      `SELECT
        d.deviceID,
        d.deviceName,
        d.ksaveID,
        d.location,
        d.ipAddress,
        d.beforeMeterNo,
        d.metricsMeterNo,
        d.phone,
        d.created_at,
        d.updated_at,
        MAX(p.record_time) as lastRecordTime,
        CASE
          WHEN MAX(p.record_time) >= NOW() - INTERVAL 20 MINUTE THEN 'ON'
          ELSE 'OFF'
        END as status
       FROM devices d
       LEFT JOIN power_records p ON d.deviceID = p.device_id
       GROUP BY d.deviceID, d.deviceName, d.ksaveID, d.location, d.ipAddress,
                d.beforeMeterNo, d.metricsMeterNo, d.phone, d.created_at, d.updated_at
       ORDER BY d.deviceID ASC`
    )
    return devices
  } catch (error) {
    console.error('Error fetching devices from ksave:', error)
    return []
  }
}

/**
 * Get device by ID
 */
export async function getDeviceById(deviceID: number): Promise<any | null> {
  try {
    const devices = await queryKsave(
      `SELECT deviceID, deviceName, ksaveID, location, status, ipAddress, 
              beforeMeterNo, metricsMeterNo, created_at, updated_at
       FROM devices 
       WHERE deviceID = ?`,
      [deviceID]
    )
    return devices[0] || null
  } catch (error) {
    console.error('Error fetching device from ksave:', error)
    return null
  }
}

/**
 * Get device by ksaveID
 */
export async function getDeviceByKsaveId(ksaveID: string): Promise<any | null> {
  try {
    const devices = await queryKsave(
      `SELECT deviceID, deviceName, ksaveID, location, status, ipAddress, 
              beforeMeterNo, metricsMeterNo, created_at, updated_at
       FROM devices 
       WHERE ksaveID = ?`,
      [ksaveID]
    )
    return devices[0] || null
  } catch (error) {
    console.error('Error fetching device from ksave:', error)
    return null
  }
}
