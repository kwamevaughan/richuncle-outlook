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

// Client-side Supabase client
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
  cookies: {
    get(name) {
      if (typeof window === "undefined") {
        console.log(
          `[supabaseClient] Skipping cookie get for ${name} on server`
        );
        return undefined;
      }
      const value = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${name}=`))
        ?.split("=")[1];
      console.log(
        `[supabaseClient] Get cookie ${name}:`,
        value ? "Found" : "Not found"
      );
      return value;
    },
    set(name, value, options) {
      if (typeof window === "undefined") {
        console.log(
          `[supabaseClient] Skipping cookie set for ${name} on server`
        );
        return;
      }
      try {
        const maxAge = options?.maxAge || 3600; // Default to 1 hour
        const cookieString = `${name}=${value}; Path=/; SameSite=Lax; Max-Age=${maxAge}; ${
          process.env.NODE_ENV === "production" ? "Secure;" : ""
        }`;
        document.cookie = cookieString;
        console.log(`[supabaseClient] Set cookie ${name}:`, cookieString);
        const cookieSet = document.cookie.includes(name);
        console.log(
          `[supabaseClient] Cookie ${name} set successfully:`,
          cookieSet
        );
        if (!cookieSet) {
          console.error(`[supabaseClient] Failed to verify cookie ${name} set`);
        }
      } catch (err) {
        console.error(`[supabaseClient] Error setting cookie ${name}:`, err);
      }
    },
    remove(name) {
      if (typeof window === "undefined") {
        console.log(
          `[supabaseClient] Skipping cookie remove for ${name} on server`
        );
        return;
      }
      document.cookie = `${name}=; Path=/; SameSite=Lax; Max-Age=0;`;
      console.log(`[supabaseClient] Removed cookie ${name}`);
    },
  },
});

// Server-side Supabase client
export const supabaseServer = (req, res) => {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        const cookieValue = req?.cookies ? req.cookies[name] : undefined;
        console.log(
          `[supabaseServer] Server-side cookie ${name}:`,
          cookieValue ? "Found" : "Not found"
        );
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

// Default export for backward compatibility
export const supabase = supabaseClient;
