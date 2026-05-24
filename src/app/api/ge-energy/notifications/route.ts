import { NextRequest, NextResponse } from 'next/server'
import { queryGeserverhub as queryGe } from '@/lib/geserverhub-db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Notification {
  id: number
  type: 'alert' | 'warning' | 'info' | 'success'
  category: string
  title: string
  message: string
  device_id: number | null
  site: string | null
  metadata: any
  is_read: boolean
  created_at: string
  read_at: string | null
}

// GET - Fetch notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const site = searchParams.get('site')
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unread_only') === 'true'

    let query = `
      SELECT
        n.id,
        n.type,
        n.category,
        n.title,
        n.message,
        n.device_id,
        n.site,
        n.metadata,
        n.is_read,
        n.created_at,
        n.read_at,
        d.deviceName,
        d.geID
      FROM notifications n
      LEFT JOIN devices d ON n.device_id = d.deviceID
      WHERE 1=1
    `
    const params: any[] = []

    if (site) {
      query += ` AND (n.site = ? OR n.site IS NULL)`
      params.push(site)
    }

    if (unreadOnly) {
      query += ` AND n.is_read = FALSE`
    }

    query += ` ORDER BY n.created_at DESC LIMIT ?`
    params.push(limit)

    const notifications = await queryGe(query, params)

    // Format notifications with relative time
    const formattedNotifications = notifications.map((notif: any) => {
      const createdAt = new Date(notif.created_at)
      const now = new Date()
      const diffMs = now.getTime() - createdAt.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      let timeAgo = ''
      if (diffMins < 1) timeAgo = 'Just now'
      else if (diffMins < 60) timeAgo = `${diffMins} min ago`
      else if (diffHours < 24) timeAgo = `${diffHours} hr ago`
      else timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

      return {
        id: notif.id,
        type: notif.type,
        category: notif.category,
        title: notif.title,
        message: notif.message,
        deviceId: notif.device_id,
        deviceName: notif.deviceName,
        geID: notif.geID,
        site: notif.site,
        metadata: notif.metadata ? JSON.parse(notif.metadata) : null,
        read: notif.is_read === 1,
        time: timeAgo,
        createdAt: notif.created_at,
        readAt: notif.read_at
      }
    })

    const unreadCount = formattedNotifications.filter((n: any) => !n.read).length

    return NextResponse.json({
      success: true,
      data: {
        notifications: formattedNotifications,
        unreadCount,
        total: formattedNotifications.length
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Notifications fetch error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch notifications'
    }, { status: 500 })
  }
}

// PUT - Mark notification(s) as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationId, markAll } = body

    if (markAll) {
      // Mark all as read
      await queryGe(
        `UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE is_read = FALSE`
      )
      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read'
      })
    } else if (notificationId) {
      // Mark single notification as read
      await queryGe(
        `UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ?`,
        [notificationId]
      )
      return NextResponse.json({
        success: true,
        message: 'Notification marked as read'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Missing notificationId or markAll parameter'
      }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Notification update error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update notification'
    }, { status: 500 })
  }
}

// DELETE - Delete notification
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')

    if (!notificationId) {
      return NextResponse.json({
        success: false,
        error: 'Notification ID is required'
      }, { status: 400 })
    }

    await queryGe(`DELETE FROM notifications WHERE id = ?`, [notificationId])

    return NextResponse.json({
      success: true,
      message: 'Notification deleted'
    })
  } catch (error: any) {
    console.error('Notification delete error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete notification'
    }, { status: 500 })
  }
}
