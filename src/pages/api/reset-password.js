import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_KEY
    ) {
      throw new Error(
        "Supabase configuration missing: Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are set"
      );
    }

    let firstName = "User";
    // Query users table
    const { data: userData, error } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, role, avatar_url, is_active, created_at, updated_at")
      .eq("email", email)
      .single();

    if (userData && !error) {
      console.log("API: Found user:", userData);
      firstName = userData.full_name || "User";
      firstName = firstName.split(" ")[0] || "User";
    } else {
      console.log("API: User error:", error?.message);
    }

    console.log("API: Sending reset email with firstName:", firstName);

    const baseUrl =
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_BASE_URL_DEV
        : process.env.NEXT_PUBLIC_BASE_URL_PROD;
    const redirectTo = `${baseUrl}/reset-password?email=${encodeURIComponent(
      email
    )}`;

    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo,
      data: { firstName },
    });

    if (resetError) {
      console.error("API: Password reset error:", resetError);
      throw new Error(resetError.message);
    }

    return res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("API: Password reset error:", error);
    return res.status(500).json({ error: error.message });
  }
}
