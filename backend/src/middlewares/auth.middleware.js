import { verifyAccessToken } from "../auth/token.js";

export function protect(req, res, next) {
    // Check for Service API Key (used by n8n or automated services)
    const apiKey = req.headers["x-api-key"];
    if (apiKey && apiKey === process.env.SERVICE_API_KEY) {
        req.user = { sub: "service-account", role: "admin" };
        return next();
    }

    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer "))
        return res.status(401).json({ error: "Missing access token or API key" });

    try {
        req.user = verifyAccessToken(header.slice(7));
        next();
    } catch {
        res.status(401).json({ error: "Invalid or expired access token" }); // client should call /auth/refresh and retry
    }
}
