import jwt from "jsonwebtoken";
import { db } from "../db/db.js";
import { briefings, notifications } from "../db/schema.js";
import { desc, and, gte, lt } from "drizzle-orm";

const BILLING_PLATFORM_URL = process.env.BILLING_PLATFORM_URL;
const BILLING_JWT_SECRET = process.env.BILLING_JWT_SECRET;

export async function getDashboardStats(req, res, next) {
    try {
        // Create a temporary token that the billing platform will accept
        const proxyToken = jwt.sign(
            { sub: "ceo-proxy", role: "CEO" },
            BILLING_JWT_SECRET,
            { expiresIn: "1m" }
        );

        const response = await fetch(`${BILLING_PLATFORM_URL}/api/dashboard/stats`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${proxyToken}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Billing platform returned ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error("Dashboard Proxy Error:", err);
        res.status(502).json({ error: "Failed to fetch stats from billing platform" });
    }
}

export async function getLatestBriefing(req, res, next) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const latestBriefing = await db
            .select()
            .from(briefings)
            .where(
                and(
                    gte(briefings.createdAt, today),
                    lt(briefings.createdAt, tomorrow)
                )
            )
            .orderBy(desc(briefings.createdAt))
            .limit(1);

        if (latestBriefing.length === 0) {
            return res.json(null);
        }

        res.json(latestBriefing[0]);
    } catch (err) {
        console.error("Get Latest Briefing Error:", err);
        res.status(500).json({ error: "Failed to fetch latest briefing" });
    }
}

export async function addBriefing(req, res, next) {
    try {
        const { briefing, notifications: notificationsArr } = req.body;
        if (!briefing) {
            return res.status(400).json({ error: "Briefing text is required" });
        }

        const newBriefing = await db
            .insert(briefings)
            .values({ briefing })
            .returning();

        if (notificationsArr && Array.isArray(notificationsArr) && notificationsArr.length > 0) {
            const notificationValues = notificationsArr.map(msg => ({ message: msg }));
            await db.insert(notifications).values(notificationValues);
        }

        res.status(201).json(newBriefing[0]);
    } catch (err) {
        console.error("Add Briefing Error:", err);
        res.status(500).json({ error: "Failed to add briefing" });
    }
}
