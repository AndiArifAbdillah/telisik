// Monad testnet clients, contract artifacts and the current deployment.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { monadTestnet } from "viem/chains";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(ROOT, ".env"), quiet: true });

export const EXPLORER = "https://testnet.monadvision.com";
export const chain = monadTestnet;
const transport = http(process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz");

export const publicClient = createPublicClient({ chain, transport });

function key(name) {
  const value = process.env[name]?.trim().split(/\s+/)[0];
  if (!value?.startsWith("0x")) throw new Error(`${name} is missing in .env`);
  return value;
}

export function wallet(name) {
  const account = privateKeyToAccount(key(`${name}_PRIVATE_KEY`));
  return createWalletClient({ account, chain, transport });
}

export const roles = {
  gp: () => wallet("DEPLOYER"),
  verifier: () => wallet("VERIFIER"),
  startup: () => wallet("STARTUP"),
};

export function artifacts() {
  const file = path.join(ROOT, "build", "contracts.json");
  if (!fs.existsSync(file)) throw new Error("Run `npm run compile` first.");
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

// A local test run points these elsewhere so it never touches the testnet deployment or web/runs.
export const DEPLOYMENT_FILE = process.env.TELISIK_DEPLOYMENT_FILE || path.join(ROOT, "deployments", "monad-testnet.json");
export const RUNS_DIR = process.env.TELISIK_RUNS_DIR || path.join(ROOT, "web", "runs");

export function deployment() {
  if (!fs.existsSync(DEPLOYMENT_FILE)) throw new Error("Run `npm run deploy` first.");
  return JSON.parse(fs.readFileSync(DEPLOYMENT_FILE, "utf8"));
}

/** Send a contract write and wait for it; returns the receipt with an explorer link. */
export async function send(client, { address, abi, functionName, args = [] }) {
  const hash = await client.writeContract({ address, abi, functionName, args });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error(`${functionName} reverted: ${hash}`);
  console.log(`  ✓ ${functionName.padEnd(16)} ${EXPLORER}/tx/${hash}`);
  return receipt;
}
