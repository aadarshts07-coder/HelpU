import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const notifications = await db.getNotifications();
    const unreadCount = notifications.filter(n => !n.read).length;
    return NextResponse.json({ notifications, unreadCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { action, id } = await req.json();

    if (action === 'mark_all_read') {
      await db.markAllNotificationsRead();
      return NextResponse.json({ success: true });
    }

    if (action === 'mark_read' && id) {
      await db.markNotificationRead(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
