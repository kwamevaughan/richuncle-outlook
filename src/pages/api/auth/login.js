const bcrypt = require("bcrypt");
import supabaseAdmin from "../../../lib/supabaseAdmin";
const cookie = require('cookie');

// Function to verify reCAPTCHA token
async function verifyRecaptcha(token) {
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
    });

    const data = await response.json();
    
    if (!data.success) {
      console.error('reCAPTCHA verification failed:', data['error-codes']);
    }
    
    return data.success;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password, recaptchaToken } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  if (!recaptchaToken) {
    return res.status(400).json({ error: "reCAPTCHA verification is required" });
  }

  try {
    console.log("Login API: Starting login process for email:", email);
    
    // Verify reCAPTCHA token
    const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
    if (!isRecaptchaValid) {
      console.error("Login API: reCAPTCHA verification failed");
      return res.status(400).json({ error: "reCAPTCHA verification failed. Please try again." });
    }

    console.log("Login API: reCAPTCHA verified successfully");
    
    // Find user by email
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, role, avatar_url, avatar_file_id, is_active, created_at, updated_at, password, last_login, store_id")
      .eq("email", email)
      .single();

    if (userError || !userData) {
      console.error("API: User not found:", userError);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("Login API: User found, current last_login:", userData.last_login);

    // Check if user is active
    if (!userData.is_active) {
      return res.status(401).json({ error: "Account is deactivated" });
    }

    // Verify password
    if (!userData.password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, userData.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("Login API: Password verified, updating last_login");

    // Update last login
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ last_login: new Date().toISOString(), last_ip: clientIp })
      .eq("id", userData.id);

    if (updateError) {
      console.error("Login API: Error updating last_login:", updateError);
    } else {
      console.log("Login API: last_login updated successfully");
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = userData;

    // Set user cookie with role for middleware
    res.setHeader('Set-Cookie', cookie.serialize('user', encodeURIComponent(JSON.stringify({ role: userData.role })), {
      path: '/',
      httpOnly: false, // set to true if you don't need JS access
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    }));

    return res.status(200).json({
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("API: Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
