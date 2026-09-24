import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.env.TSX_TSCONFIG_PATH = path.join(root, "tsconfig.test.json");

const suite = process.argv[2] ?? "unit";
const files =
  suite === "api"
    ? ["tests/api.test.ts"]
    : ["tests/unit.test.ts", "tests/settlement.test.ts", "tests/supabase.test.ts"];

const result = spawnSync(process.execPath, ["--import", "tsx", "--test", ...files], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
