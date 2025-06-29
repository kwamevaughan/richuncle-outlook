// pages/api/signout.js
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { redirectTo, authUserId } = req.body;
  console.log("API: /api/signout called with:", { redirectTo, authUserId });

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  try {
    if (authUserId) {
      console.log("API: Attempting to delete auth.users entry:", authUserId);
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
        authUserId
      );
      if (deleteError) {
        console.error("API: Delete user error:", deleteError);
        throw deleteError;
      }
      console.log("API: Successfully deleted auth.users entry:", authUserId);
    }

    const { error } = await supabaseAdmin.auth.signOut();
    if (error) {
      console.error("API: Sign-out error:", error);
      throw error;
    }

    // Clear cookies
    res.setHeader("Set-Cookie", [
      `sb-kswioogssarubigcpzez-auth-token=; Path=/; SameSite=Strict; Max-Age=0`,
      `sb-kswioogssarubigcpzez-auth-token-code-verifier=; Path=/; SameSite=Strict; Max-Age=0`,
      `refresh_token=; Path=/; SameSite=Strict; Max-Age=0`,
    ]);

    return res
      .status(200)
      .json({ redirectTo: redirectTo || "#" });
  } catch (error) {
    console.error("API: Sign-out error:", error);
    return res.status(500).json({ error: error.message });
  }
}
