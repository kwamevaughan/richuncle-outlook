import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase configuration missing: Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local"
  );
}

// Server-side Supabase client
export const supabaseServer = (req, res) => {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        const cookieValue = req?.cookies ? req.cookies[name] : undefined;
        return cookieValue;
      },
      set(name, value, options) {
        if (!res) {
          console.warn("[supabaseServer] No response object to set cookies");
          return;
        }
        const maxAge = options?.maxAge || 3600;
        const cookieString = `${name}=${value}; Path=/; SameSite=Lax; Max-Age=${maxAge}; ${
          process.env.NODE_ENV === "production" ? "Secure;" : ""
        }`;
        res.setHeader("Set-Cookie", cookieString);
        console.log(
          `[supabaseServer] Set server-side cookie ${name}:`,
          cookieString
        );
      },
      remove(name) {
        if (!res) {
          console.warn("[supabaseServer] No response object to remove cookies");
          return;
        }
        res.setHeader(
          "Set-Cookie",
          `${name}=; Path=/; SameSite=Lax; Max-Age=0;`
        );
        console.log(`[supabaseServer] Removed server-side cookie ${name}`);
      },
    },
  });
};

// Client-side Supabase client for real-time functionality
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Default export for backward compatibility
export default supabase;
