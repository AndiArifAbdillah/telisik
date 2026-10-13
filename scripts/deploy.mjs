// Deploys AttestationRegistry, TelisikEscrow and DemoUSDC to Monad testnet, and tops up the
// verifier and startup wallets with a little MON for gas.
import fs from "node:fs";
import path from "node:path";
import { formatEther, parseEther } from "viem";
import { DEPLOYMENT_FILE, EXPLORER, artifacts, chain, publicClient, roles } from "../shared/chain.mjs";

const gp = roles.gp();
const verifier = roles.verifier();
const startup = roles.startup();
const a = artifacts();

const balance = await publicClient.getBalance({ address: gp.account.address });
console.log(`Deployer ${gp.account.address}: ${formatEther(balance)} MON`);
if (balance === 0n) {
  console.error("No MON yet. Fund the deployer at https://faucet.monad.xyz and run again.");
  process.exit(1);
}

async function deployContract(name, args = []) {
  const hash = await gp.deployContract({ abi: a[name].abi, bytecode: a[name].bytecode, args });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success" || !receipt.contractAddress) throw new Error(`${name} deploy failed: ${hash}`);
  console.log(`  ✓ ${name.padEnd(20)} ${receipt.contractAddress}  ${EXPLORER}/tx/${hash}`);
  return receipt;
}

// Gas for the other two roles: 5% of the deployer's balance each, at most 0.5 MON.
const share = balance / 20n < parseEther("0.5") ? balance / 20n : parseEther("0.5");
for (const [label, client] of [["verifier", verifier], ["startup", startup]]) {
  const have = await publicClient.getBalance({ address: client.account.address });
  if (have < share / 2n) {
    const hash = await gp.sendTransaction({ to: client.account.address, value: share });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`  ✓ fund ${label.padEnd(15)} ${formatEther(share)} MON  ${EXPLORER}/tx/${hash}`);
  }
}

console.log("Deploying to Monad testnet...");
const registry = await deployContract("AttestationRegistry", [verifier.account.address]);
const escrow = await deployContract("TelisikEscrow", [registry.contractAddress]);
const token = await deployContract("DemoUSDC");

const out = {
  network: "monad-testnet",
  chainId: chain.id,
  explorer: EXPLORER,
  deployedAt: new Date().toISOString(),
  startBlock: Number(registry.blockNumber),
  contracts: {
    AttestationRegistry: registry.contractAddress,
    TelisikEscrow: escrow.contractAddress,
    DemoUSDC: token.contractAddress,
  },
  roles: {
    gp: gp.account.address,
    verifier: verifier.account.address,
    startup: startup.account.address,
  },
};
fs.mkdirSync(path.dirname(DEPLOYMENT_FILE), { recursive: true });
fs.writeFileSync(DEPLOYMENT_FILE, JSON.stringify(out, null, 2));
console.log(`Saved ${path.relative(process.cwd(), DEPLOYMENT_FILE)}`);
