import { spawnSync } from "node:child_process";

const pnpmCli = process.env.npm_execpath;
if (!pnpmCli) throw new Error("Nelze určit cestu k pnpm CLI.");
const envWithoutDatabase = { ...process.env };
delete envWithoutDatabase.DATABASE_URL;

function run(args) {
  return spawnSync(process.execPath, [pnpmCli, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: envWithoutDatabase,
    shell: false,
  });
}

function outputOf(result) {
  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
}

const generate = run(["db:generate"]);
if (generate.status !== 0) {
  console.error(outputOf(generate));
  throw new Error("Regrese: Prisma Client nelze generovat bez DATABASE_URL.");
}

for (const script of ["db:deploy", "start"]) {
  const result = run([script]);
  const output = outputOf(result);
  if (result.status === 0 || !output.includes("DATABASE_URL je povinná")) {
    console.error(output);
    throw new Error(`Regrese: pnpm ${script} bez DATABASE_URL neselhal bezpečně.`);
  }
}

console.log("Regresní kontrola konfigurace nasazení prošla.");
