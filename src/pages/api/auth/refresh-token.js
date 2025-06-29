// pages/api/auth/refresh-token.js
import { SignJWT, jwtVerify } from "jose";
import supabaseAdmin from "lib/supabaseAdmin";

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

if (!JWT_SECRET || !REFRESH_SECRET) {
  throw new Error("JWT_SECRET and REFRESH_SECRET must be set in env");
}

const getKey = (secret) => new TextEncoder().encode(secret);

export default async function handler(req, res) {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    return res.status(401).json({ error: "No refresh token provided" });
  }

  try {
    const { payload } = await jwtVerify(refreshToken, getKey(REFRESH_SECRET));

    // Optional: check user still exists and is active
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id, email, role, full_name, agency_id")
      .eq("id", payload.user_id)
      .single();

    if (error || !user || !user.is_active) {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    // Create new access token
    const newAccessToken = await new SignJWT({
      user_id: user.id,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(getKey(JWT_SECRET));

    res.status(200).json({ token: newAccessToken });
  } catch (err) {
    console.error("Refresh token error:", err);
    res.status(401).json({ error: "Invalid refresh token" });
  }
}
