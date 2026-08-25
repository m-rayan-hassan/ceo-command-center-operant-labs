import { db } from '../db/db.js';
import { approvals } from '../db/schema.js';
import { eq, desc, gte } from 'drizzle-orm';

// Add a new approval (receives all fields)
export const addApproval = async (req, res) => {
  try {
    const { from, subject, body, threadId, messageId } = req.body;
    
    if (!from || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields: from, subject, body' });
    }

    const [newApproval] = await db.insert(approvals).values({
      from,
      subject,
      body,
      threadId,
      messageId,
      status: 'pending' // default
    }).returning();

    res.status(201).json(newApproval);
  } catch (error) {
    console.error('Error adding approval:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get today's approvals
export const getTodayApprovals = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysApprovals = await db
      .select()
      .from(approvals)
      .where(gte(approvals.createdAt, today))
      .orderBy(desc(approvals.createdAt));

    res.status(200).json(todaysApprovals);
  } catch (error) {
    console.error('Error fetching approvals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all approvals (full history)
export const getAllApprovals = async (req, res) => {
  try {
    const allApprovals = await db
      .select()
      .from(approvals)
      .orderBy(desc(approvals.createdAt));

    res.status(200).json(allApprovals);
  } catch (error) {
    console.error('Error fetching all approvals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

// Update approval status — saves to DB, then notifies n8n
export const updateApprovalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const [updatedApproval] = await db
      .update(approvals)
      .set({ status })
      .where(eq(approvals.id, id))
      .returning();

    if (!updatedApproval) {
      return res.status(404).json({ error: 'Approval not found' });
    }

    // Notify n8n workflow with the decision details
    try {
      const webhookRes = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: updatedApproval.status,
          threadId: updatedApproval.threadId,
          messageId: updatedApproval.messageId,
        }),
      });

      if (!webhookRes.ok) {
        console.error(`n8n webhook responded with ${webhookRes.status}:`, await webhookRes.text());
      }
    } catch (webhookErr) {
      // Don't fail the request if the webhook is unreachable
      console.error('Failed to reach n8n webhook:', webhookErr.message);
    }

    res.status(200).json(updatedApproval);
  } catch (error) {
    console.error('Error updating approval status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
