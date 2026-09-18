#!/usr/bin/env node
/**
 * Civic Deliberation Allocator - Live Studionet Docket Population Script
 * Contract: 0x8c0747c835Dc8692878EaCA5Dd652a5216D60AA0
 * Chain: GenLayer Studionet (61999)
 *
 * Usage:
 *   node scripts/populate_live.mjs <PRIVATE_KEY>
 * or
 *   GENLAYER_PRIVATE_KEY=<PRIVATE_KEY> node scripts/populate_live.mjs
 */

import { createClient, createAccount, generatePrivateKey, chains } from 'genlayer-js';

const CONTRACT_ADDRESS = '0x8c0747c835Dc8692878EaCA5Dd652a5216D60AA0';
const privateKey = process.argv[2] || process.env.GENLAYER_PRIVATE_KEY;

if (!privateKey) {
  console.error('Error: Please provide a private key as an argument or set GENLAYER_PRIVATE_KEY.');
  console.error('Usage: node scripts/populate_live.mjs 0x...');
  process.exit(1);
}

async function main() {
  console.log('====================================================');
  console.log('   CIVIC DELIBERATION ALLOCATOR - LIVE POPULATION   ');
  console.log('====================================================\n');

  const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  const masterAccount = createAccount(formattedKey);
  console.log(`[Master Account] ${masterAccount.address}`);
  console.log(`[Target Contract] ${CONTRACT_ADDRESS}`);

  const masterClient = createClient({
    chain: chains.studionet,
    account: masterAccount,
  });

  const bal = await masterClient.getBalance({ address: masterAccount.address });
  console.log(`[Balance] ${(Number(bal) / 1e18).toFixed(4)} GEN\n`);

  // Check if docket 1 exists
  let docketExists = false;
  try {
    const d = await masterClient.readContract({
      address: CONTRACT_ADDRESS,
      functionName: 'get_docket',
      args: [1],
    });
    if (d) {
      docketExists = true;
      console.log('Civic Docket #1 already exists on-chain:');
      console.log(`  State: ${JSON.parse(d).state}`);
      console.log(`  Testimonies: ${JSON.parse(d).testimony_count}`);
    }
  } catch {
    docketExists = false;
  }

  if (!docketExists) {
    console.log('\n[1/3] Initializing Civic Deliberation Docket #1...');
    const now = Math.floor(Date.now() / 1000);
    const initTx = await masterClient.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: 'initialize_docket',
      args: [
        'https://assembly.civic.gov/charters/transit-2026.txt',
        '4a6b25110d939626e259b3df9e63e1986c758bb8efb7a1ffb1548b8b9c8a77a9',
        'f5e09a0e5533875bb352f6bd4be8d8ae3da11ce7b4ffe4007c17b55d6691989b',
        2, // 2 delegate seats
        now + 86400,
        now + 172800,
      ],
      value: 0n,
    });
    console.log(`Init Tx: ${initTx}`);
    const receipt = await masterClient.waitForTransactionReceipt({ hash: initTx });
    console.log(`Civic Docket #1 Initialized! Status: ${receipt.result_name}`);
  }

  // Check enrolled testimonies
  const subs = await masterClient.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_all_testimonies',
    args: [1],
  });
  const currentTestimonies = subs ? JSON.parse(subs) : [];
  console.log(`\nCurrent Enrolled Testimonies: ${currentTestimonies.length}`);

  if (currentTestimonies.length < 4) {
    console.log('\n[2/3] Enrolling citizen testimonies...');
    const candidates = [
      {
        id: 't-commuter-union',
        url: 'https://assembly.civic.gov/t/t1.txt',
        digest: '1111111111111111111111111111111111111111111111111111111111111111',
      },
      {
        id: 't-active-mobility',
        url: 'https://assembly.civic.gov/t/t2.txt',
        digest: '2222222222222222222222222222222222222222222222222222222222222222',
      },
      {
        id: 't-suburban-transit',
        url: 'https://assembly.civic.gov/t/t3.txt',
        digest: '3333333333333333333333333333333333333333333333333333333333333333',
      },
      {
        id: 't-green-corridor',
        url: 'https://assembly.civic.gov/t/t4.txt',
        digest: '4444444444444444444444444444444444444444444444444444444444444444',
      },
    ];

    const existingIds = new Set(currentTestimonies.map((t) => t.testimony_id));

    for (const c of candidates) {
      if (!existingIds.has(c.id)) {
        console.log(`Enrolling ${c.id}...`);
        const tx = await masterClient.writeContract({
          address: CONTRACT_ADDRESS,
          functionName: 'enroll_testimony',
          args: [1, c.id, c.url, c.digest],
          value: 0n,
        });
        console.log(`  Tx: ${tx}`);
        await masterClient.waitForTransactionReceipt({ hash: tx });
      }
    }
  }

  console.log('\n[3/3] Verification:');
  const summary = await masterClient.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_docket',
    args: [1],
  });
  console.log('Live Docket Record:', JSON.parse(summary));
  console.log(`\nView on GenLayer Explorer: https://explorer-studio.genlayer.com/address/${CONTRACT_ADDRESS}`);
}

main().catch(console.error);
