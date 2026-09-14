import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const projectRoot = process.cwd();
const standaloneRoot = join(projectRoot, ".next", "standalone");

if (!existsSync(standaloneRoot)) {
  throw new Error("Standalone build neexistuje. Nejprve spusťte next build.");
}

const staticTarget = join(standaloneRoot, ".next", "static");
mkdirSync(join(standaloneRoot, ".next"), { recursive: true });
cpSync(join(projectRoot, ".next", "static"), staticTarget, { recursive: true });

const publicSource = join(projectRoot, "public");
if (existsSync(publicSource)) {
  cpSync(publicSource, join(standaloneRoot, "public"), { recursive: true });
}
