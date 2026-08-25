import { db } from "../db/db.js";
import { notifications } from "../db/schema.js";
import { desc, eq } from "drizzle-orm";

export async function getNotifications(req, res, next) {
    try {
        const allNotifications = await db
            .select()
            .from(notifications)
            .orderBy(desc(notifications.createdAt));
            
        res.json(allNotifications);
    } catch (err) {
        console.error("Get Notifications Error:", err);
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
}

export async function markAsRead(req, res, next) {
    try {
        const { id } = req.params;
        
        const updatedNotification = await db
            .update(notifications)
            .set({ isRead: true })
            .where(eq(notifications.id, id))
            .returning();
            
        if (updatedNotification.length === 0) {
            return res.status(404).json({ error: "Notification not found" });
        }
        
        res.json(updatedNotification[0]);
    } catch (err) {
        console.error("Mark Notification Read Error:", err);
        res.status(500).json({ error: "Failed to mark notification as read" });
    }
}

export async function markAllAsRead(req, res, next) {
    try {
        await db
            .update(notifications)
            .set({ isRead: true })
            .where(eq(notifications.isRead, false));
            
        res.json({ success: true });
    } catch (err) {
        console.error("Mark All Notifications Read Error:", err);
        res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
}
