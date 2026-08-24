import { db } from '../db/db.js';
import { meetings } from '../db/schema.js';
import { gte, lt, and } from 'drizzle-orm';

export const addMeeting = async (req, res) => {
    try {
        const { meetingDateAndTime, meetingDescription } = req.body;
        if (!meetingDateAndTime || !meetingDescription) {
            return res.status(400).json({ status: "error", message: "Missing required fields" });
        }
        
        const date = new Date(meetingDateAndTime);
        if (isNaN(date.getTime())) {
            return res.status(400).json({ status: "error", message: "Invalid date format" });
        }

        const [newMeeting] = await db.insert(meetings).values({
            meetingDateAndTime: date,
            meetingDescription
        }).returning();

        res.status(201).json({ status: "success", data: newMeeting });
    } catch (error) {
        console.error("Error adding meeting:", error);
        res.status(500).json({ status: "error", message: "Failed to add meeting" });
    }
};

export const getTodaysMeetings = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todaysMeetings = await db.select().from(meetings).where(
            and(
                gte(meetings.meetingDateAndTime, today),
                lt(meetings.meetingDateAndTime, tomorrow)
            )
        ).orderBy(meetings.meetingDateAndTime);

        res.status(200).json(todaysMeetings);
    } catch (error) {
        console.error("Error fetching meetings:", error);
        res.status(500).json({ status: "error", message: "Failed to fetch meetings" });
    }
};
