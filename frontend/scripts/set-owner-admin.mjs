import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const EMAIL = "nidaasghar8750@gmail.com";
const NAME = "nida";
const PHONE = "+923066644221";

function loadEnv(path) {
  const env = {};
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const index = trimmed.indexOf("=");
    if (index <= 0) {
      continue;
    }
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const fileEnv = loadEnv(resolve(process.cwd(), ".env.local"));
const url = fileEnv.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = fileEnv.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const admin = createClient(url, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: listed, error: listError } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 200,
});
if (listError) {
  throw new Error(listError.message);
}

const authUser = listed.users.find(
  (user) => (user.email ?? "").toLowerCase() === EMAIL,
);

if (!authUser) {
  console.log("auth: missing");
  process.exit(2);
}

const { error: confirmError } = await admin.auth.admin.updateUserById(authUser.id, {
  email_confirm: true,
  user_metadata: {
    ...(authUser.user_metadata ?? {}),
    name: NAME,
    phone: PHONE,
  },
});
if (confirmError) {
  throw new Error(confirmError.message);
}

const { data: existing, error: profileReadError } = await admin
  .from("profiles")
  .select("id")
  .eq("id", authUser.id)
  .maybeSingle();
if (profileReadError) {
  throw new Error(profileReadError.message);
}

const now = new Date().toISOString();
const profile = {
  id: authUser.id,
  email: EMAIL,
  name: NAME,
  phone: PHONE,
  role: "ADMIN",
  status: "active",
  updated_at: now,
};

const query = existing
  ? admin.from("profiles").update(profile).eq("id", authUser.id)
  : admin.from("profiles").insert({ ...profile, created_at: now });

const { error: profileWriteError } = await query;
if (profileWriteError) {
  throw new Error(profileWriteError.message);
}

console.log(existing ? "admin: updated" : "admin: created");
console.log("email_confirmed: yes");
console.log("role: ADMIN");
