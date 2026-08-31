import { z } from "zod";
import argon2 from "argon2";
import { eq, and, desc, gt } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/db.js";
import { users, refreshTokens } from "../db/schema.js";
import {
    signAccessToken,
    generateRefreshToken,
    hashToken,
    REFRESH_COOKIE_NAME,
    REFRESH_COOKIE_OPTIONS,
} from "../auth/token.js";

const credentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

const registerSchema = credentialsSchema;

async function issueTokenPair(userId, meta = {}) {
    const accessToken = signAccessToken({ sub: userId });
    const { raw, hash, expiresAt } = generateRefreshToken();
    const familyId = randomUUID();

    await db.insert(refreshTokens).values({
        userId,
        tokenHash: hash,
        familyId,
        expiresAt,
        ip: meta.ip,
        userAgent: meta.userAgent,
    });

    return { accessToken, refreshToken: raw };
}

export async function register(req, res, next) {
    try {
        const { email, password } = registerSchema.parse(req.body);

        const existing = await db.query.users.findFirst({
            where: eq(users.email, email),
        });
        if (existing)
            return res.status(409).json({ error: "Email already registered" });

        const passwordHash = await argon2.hash(password, {
            type: argon2.argon2id,
        });
        const [user] = await db
            .insert(users)
            .values({ email, passwordHash })
            .returning();

        const { accessToken, refreshToken } = await issueTokenPair(
            user.id,
        );
        res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
        res.status(201).json({ 
            accessToken,
            user: { id: user.id, email: user.email }
        });
    } catch (err) {
        next(err);
    }
}

export async function login(req, res, next) {
    try {
        const { email, password } = credentialsSchema.parse(req.body);
        const user = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        // Compare against a dummy hash even when the user doesn't exist — keeps timing
        // identical for "wrong email" vs "wrong password" so login can't be used to enumerate accounts.
        const hashToCheck =
            user?.passwordHash ??
            "$argon2id$v=19$m=65536,t=3,p=4$c2FsdHNhbHQ$dGVzdA";
        const valid = await argon2
            .verify(hashToCheck, password)
            .catch(() => false);
        if (!user || !valid)
            return res.status(401).json({ error: "Invalid email or password" });

        const { accessToken, refreshToken } = await issueTokenPair(
            user.id,
            {
                ip: req.ip,
                userAgent: req.get("user-agent"),
            },
        );
        res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
        res.json({ 
            accessToken,
            user: { id: user.id, email: user.email }
        });
    } catch (err) {
        next(err);
    }
}

export async function refresh(req, res, next) {
    try {
        const raw = req.cookies?.[REFRESH_COOKIE_NAME];
        if (!raw) return res.status(401).json({ error: "No refresh token" });

        const tokenHash = hashToken(raw);
        let existing = await db.query.refreshTokens.findFirst({
            where: eq(refreshTokens.tokenHash, tokenHash),
        });

        if (!existing)
            return res.status(401).json({ error: "Invalid refresh token" });
        if (existing.expiresAt < new Date())
            return res.status(401).json({ error: "Refresh token expired" });

        // Rotation means two requests can legitimately present the same refresh
        // token in quick succession: multiple open tabs share one cookie, and the
        // frontend may fire several API calls around the moment the access token
        // expires. The second one finds this token already `revoked`. Treat that
        // as normal concurrency and adopt the family's current live token so the
        // session keeps working — never log a user out just for this.
        if (existing.revoked) {
            const successor = await db.query.refreshTokens.findFirst({
                where: and(
                    eq(refreshTokens.familyId, existing.familyId),
                    eq(refreshTokens.revoked, false),
                    gt(refreshTokens.expiresAt, new Date()),
                ),
                orderBy: desc(refreshTokens.createdAt),
            });

            if (!successor) {
                await db
                    .update(refreshTokens)
                    .set({ revoked: true })
                    .where(eq(refreshTokens.familyId, existing.familyId));
                return res
                    .status(401)
                    .json({
                        error: "Refresh token reuse detected — session revoked, please log in again",
                    });
            }

            existing = successor;
        }

        const user = await db.query.users.findFirst({
            where: eq(users.id, existing.userId),
        });
        if (!user)
            return res.status(401).json({ error: "User no longer exists" });

        const accessToken = signAccessToken({ sub: user.id });
        const { raw: newRaw, hash, expiresAt } = generateRefreshToken();

        const [newToken] = await db
            .insert(refreshTokens)
            .values({
                userId: user.id,
                tokenHash: hash,
                familyId: existing.familyId,
                expiresAt,
                ip: req.ip,
                userAgent: req.get("user-agent"),
            })
            .returning();

        await db
            .update(refreshTokens)
            .set({ revoked: true, replacedBy: newToken.id })
            .where(eq(refreshTokens.id, existing.id));

        res.cookie(REFRESH_COOKIE_NAME, newRaw, REFRESH_COOKIE_OPTIONS);
        res.json({ accessToken });
    } catch (err) {
        next(err);
    }
}

export async function logout(req, res, next) {
    try {
        const raw = req.cookies?.[REFRESH_COOKIE_NAME];
        if (raw) {
            const tokenHash = hashToken(raw);
            await db
                .update(refreshTokens)
                .set({ revoked: true })
                .where(eq(refreshTokens.tokenHash, tokenHash));
        }
        res.clearCookie(REFRESH_COOKIE_NAME, {
            httpOnly: REFRESH_COOKIE_OPTIONS.httpOnly,
            secure: REFRESH_COOKIE_OPTIONS.secure,
            sameSite: REFRESH_COOKIE_OPTIONS.sameSite,
            path: REFRESH_COOKIE_OPTIONS.path,
        });
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

export async function getMe(req, res, next) {
    try {
        const user = await db.query.users.findFirst({
            where: eq(users.id, req.user.sub),
            columns: { id: true, email: true, createdAt: true },
        });

        if (!user) return res.status(404).json({ error: "User not found" });

        res.json(user);
    } catch (err) {
        next(err);
    }
}
