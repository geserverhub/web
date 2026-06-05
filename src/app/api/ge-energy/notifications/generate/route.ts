import { NextRequest, NextResponse } from 'next/server'
import { queryGe } from '@/lib/mysql-ge'
import { getDevicesColumnSet, meterIdGroupBySql, meterIdSelectSql } from '@/lib/ge-energy/devices-schema'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function ensureNotificationsSchema() {
  await queryGe(`
    CREATE TABLE IF NOT EXISTS \`notifications\` (
      \`id\`         INT(11)      NOT NULL AUTO_INCREMENT,
      \`type\`       ENUM('alert','warning','info','success') NOT NULL DEFAULT 'info',
      \`category\`   VARCHAR(100) NOT NULL DEFAULT 'System',
      \`title\`      VARCHAR(255) NOT NULL,
      \`message\`    TEXT         NOT NULL,
      \`device_id\`  INT(11)      DEFAULT NULL,
      \`site\`       VARCHAR(50)  DEFAULT NULL,
      \`metadata\`   TEXT         DEFAULT NULL,
      \`is_read\`    TINYINT(1)   NOT NULL DEFAULT 0,
      \`created_at\` DATETIME     DEFAULT CURRENT_TIMESTAMP,
      \`read_at\`    DATETIME     DEFAULT NULL,
      PRIMARY KEY (\`id\`),
      KEY \`idx_notifications_device\` (\`device_id\`),
      KEY \`idx_notifications_site\` (\`site\`),
      KEY \`idx_notifications_is_read\` (\`is_read\`),
      KEY \`idx_notifications_created\` (\`created_at\`),
      CONSTRAINT \`fk_notifications_device\`
        FOREIGN KEY (\`device_id\`) REFERENCES \`devices\` (\`deviceID\`)
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
}

/**
 * Background service to automatically generate notifications
 * This should be called periodically (e.g., every 5 minutes via cron)
 */
export async function POST(request: NextRequest) {
  try {
    await ensureNotificationsSchema()
    const generatedNotifications: string[] = []

    const deviceColumns = await getDevicesColumnSet()
    const meterSelect = meterIdSelectSql(deviceColumns)
    const meterGroup = meterIdGroupBySql(deviceColumns)

    // 1. Check for offline devices
    const offlineDevices = await queryGe(`
      SELECT
        d.deviceID,
        d.deviceName,
        ${meterSelect},
        d.location,
        d.site,
        MAX(p.record_time) as last_record
      FROM devices d
      LEFT JOIN power_records p ON d.deviceID = p.device_id
      GROUP BY d.deviceID, d.deviceName, ${meterGroup}, d.location, d.site
      HAVING last_record < NOW() - INTERVAL 20 MINUTE
         OR last_record IS NULL
    `)

    for (const device of offlineDevices) {
      // Check if notification already exists for this device in last hour
      const existing = await queryGe(
        `SELECT id FROM notifications
         WHERE category = 'device_status'
           AND device_id = ?
           AND created_at > NOW() - INTERVAL 1 HOUR
         LIMIT 1`,
        [device.deviceID]
      )

      if (existing.length === 0) {
        await queryGe(
          `INSERT INTO notifications (type, category, title, message, device_id, site, metadata, is_read)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'alert',
            'device_status',
            `Device Offline: ${device.deviceName}`,
            `${device.deviceName} (${device.GEsaveID}) at ${device.location || 'Unknown location'} has gone offline`,
            device.deviceID,
            device.site,
            JSON.stringify({
              device_name: device.deviceName,
              gesave_id: device.GEsaveID,
              location: device.location,
              last_seen: device.last_record
            }),
            false
          ]
        )
        generatedNotifications.push(`Device offline: ${device.deviceName}`)
      }
    }

    // 2. Check for high THD
    const highThdDevices = await queryGe(`
      SELECT
        d.deviceID,
        d.deviceName,
        d.site,
        p.metrics_THD,
        p.record_time
      FROM devices d
      JOIN power_records p ON d.deviceID = p.device_id
      WHERE p.metrics_THD > 5.0
        AND (d.deviceID, p.record_time) IN (
          SELECT device_id, MAX(record_time)
          FROM power_records
          GROUP BY device_id
        )
    `)

    for (const device of highThdDevices) {
      const existing = await queryGe(
        `SELECT id FROM notifications
         WHERE category = 'power_quality'
           AND device_id = ?
           AND created_at > NOW() - INTERVAL 6 HOUR
         LIMIT 1`,
        [device.deviceID]
      )

      if (existing.length === 0) {
        await queryGe(
          `INSERT INTO notifications (type, category, title, message, device_id, site, metadata, is_read)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'warning',
            'power_quality',
            'High THD Detected',
            `Device ${device.deviceName} THD level at ${device.metrics_THD.toFixed(1)}% exceeds safe threshold (5%)`,
            device.deviceID,
            device.site,
            JSON.stringify({
              thd_value: device.metrics_THD,
              threshold: 5.0,
              recorded_at: device.record_time
            }),
            false
          ]
        )
        generatedNotifications.push(`High THD: ${device.deviceName} (${device.metrics_THD}%)`)
      }
    }

    // 3. Check for low power factor
    const lowPfDevices = await queryGe(`
      SELECT
        d.deviceID,
        d.deviceName,
        d.site,
        p.metrics_PF,
        p.record_time
      FROM devices d
      JOIN power_records p ON d.deviceID = p.device_id
      WHERE p.metrics_PF < 0.85
        AND (d.deviceID, p.record_time) IN (
          SELECT device_id, MAX(record_time)
          FROM power_records
          GROUP BY device_id
        )
    `)

    for (const device of lowPfDevices) {
      const existing = await queryGe(
        `SELECT id FROM notifications
         WHERE category = 'power_quality'
           AND device_id = ?
           AND title LIKE '%Power Factor%'
           AND created_at > NOW() - INTERVAL 6 HOUR
         LIMIT 1`,
        [device.deviceID]
      )

      if (existing.length === 0) {
        await queryGe(
          `INSERT INTO notifications (type, category, title, message, device_id, site, metadata, is_read)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'warning',
            'power_quality',
            'Low Power Factor',
            `Device ${device.deviceName} power factor at ${device.metrics_PF.toFixed(2)} is below optimal (0.85)`,
            device.deviceID,
            device.site,
            JSON.stringify({
              pf_value: device.metrics_PF,
              threshold: 0.85,
              recorded_at: device.record_time
            }),
            false
          ]
        )
        generatedNotifications.push(`Low PF: ${device.deviceName} (${device.metrics_PF})`)
      }
    }

    // 4. Check for high energy consumption (compared to average)
    const highConsumptionCheck = await queryGe(`
      SELECT
        d.deviceID,
        d.deviceName,
        d.site,
        p.metrics_kWh,
        AVG(p2.metrics_kWh) as avg_consumption,
        p.record_time
      FROM devices d
      JOIN power_records p ON d.deviceID = p.device_id
      JOIN power_records p2 ON d.deviceID = p2.device_id
        AND p2.record_time >= NOW() - INTERVAL 7 DAY
      WHERE (d.deviceID, p.record_time) IN (
        SELECT device_id, MAX(record_time)
        FROM power_records
        GROUP BY device_id
      )
      GROUP BY d.deviceID, d.deviceName, d.site, p.metrics_kWh, p.record_time
      HAVING p.metrics_kWh > AVG(p2.metrics_kWh) * 1.2
    `)

    for (const device of highConsumptionCheck) {
      const existing = await queryGe(
        `SELECT id FROM notifications
         WHERE category = 'energy_consumption'
           AND device_id = ?
           AND created_at > NOW() - INTERVAL 12 HOUR
         LIMIT 1`,
        [device.deviceID]
      )

      if (existing.length === 0) {
        const increase = ((device.metrics_kWh - device.avg_consumption) / device.avg_consumption * 100).toFixed(1)
        await queryGe(
          `INSERT INTO notifications (type, category, title, message, device_id, site, metadata, is_read)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'warning',
            'energy_consumption',
            'High Energy Consumption',
            `Device ${device.deviceName} energy usage increased by ${increase}% above weekly average`,
            device.deviceID,
            device.site,
            JSON.stringify({
              current_consumption: device.metrics_kWh,
              avg_consumption: device.avg_consumption,
              increase_percent: parseFloat(increase),
              recorded_at: device.record_time
            }),
            false
          ]
        )
        generatedNotifications.push(`High consumption: ${device.deviceName} (+${increase}%)`)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        generated: generatedNotifications.length,
        notifications: generatedNotifications
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Notification generation error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate notifications'
    }, { status: 500 })
  }
}

/**
 * GET endpoint to manually trigger notification generation (for testing)
 */
export async function GET(request: NextRequest) {
  return POST(request)
}
