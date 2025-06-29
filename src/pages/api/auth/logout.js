// pages/api/auth/logout.js

export default async function handler(req, res) {
  // Clear refresh token cookie
  res.setHeader("Set-Cookie", [
    `refresh_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
  ]);

  res.status(200).json({ message: "Logged out" });
}
