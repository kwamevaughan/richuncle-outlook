import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { provider, redirectTo } = req.body;

    if (!provider || !redirectTo) {
      return res.status(400).json({ error: "Provider and redirectTo are required" });
    }

    const { data, error } = await supabaseAdmin.auth.signInWithOAuth({
      provider: provider.toLowerCase(),
      options: {
        redirectTo,
      },
    });

    if (error) {
      console.error("Social login error:", error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ url: data.url });
  } catch (error) {
    console.error("Error in /api/auth/social-login:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 