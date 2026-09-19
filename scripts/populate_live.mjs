#!/usr/bin/env node
/**
 * Civic Deliberation Allocator - Live Studionet Docket Population Script
 * Contract: 0x04768A352f0ac52dCEa8c9F9AEBc57020d5248B2
 * Chain: GenLayer Studionet (61999)
 *
 * Usage:
 *   node scripts/populate_live.mjs <PRIVATE_KEY>
 * or
 *   GENLAYER_PRIVATE_KEY=<PRIVATE_KEY> node scripts/populate_live.mjs
 */

import { createClient, createAccount, generatePrivateKey, chains } from 'genlayer-js';

const CONTRACT_ADDRESS = '0x04768A352f0ac52dCEa8c9F9AEBc57020d5248B2';
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
        'https://raw.githubusercontent.com/9ja-maxx/civic-deliberation-allocator/main/frontend/public/fixtures/transit-charter-2026.txt',
        '25e937cb2139d5f128cd7a323948a0b5c93054ea9c01f23eb43c70ee9e6dd7dc',
        'b7d648bdd4e686363e672b05764b8ec5008d66e92515b266f6f53e417cc2791f',
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
        url: 'https://raw.githubusercontent.com/9ja-maxx/civic-deliberation-allocator/main/frontend/public/fixtures/t1-commuter-union.txt',
        digest: 'b5485afe74ffcb941b79ea1a4a3b59a6e24ba1274957ec83ce6b21c9864b5ffe',
      },
      {
        id: 't-active-mobility',
        url: 'https://raw.githubusercontent.com/9ja-maxx/civic-deliberation-allocator/main/frontend/public/fixtures/t2-active-mobility.txt',
        digest: '186e0cd86faf4224f81ac771bacb08dec5197378a28b58edb82a1006da296a75',
      },
      {
        id: 't-suburban-transit',
        url: 'https://raw.githubusercontent.com/9ja-maxx/civic-deliberation-allocator/main/frontend/public/fixtures/t3-suburban-transit.txt',
        digest: '89581e1abc9bd02fa477aca4f221ffdf6bec6e773d2c2414d0002229651957fa',
      },
      {
        id: 't-green-corridor',
        url: 'https://raw.githubusercontent.com/9ja-maxx/civic-deliberation-allocator/main/frontend/public/fixtures/t4-green-corridor.txt',
        digest: 'a2a66059e12b52c8160e43585e160324d0d307d73c6c84979120a2238eb0a2e6',
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
