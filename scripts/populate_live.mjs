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

import { createClient, createAccount } from 'genlayer-js';

const CONTRACT_ADDRESS = '0x8c0747c835Dc8692878EaCA5Dd652a5216D60AA0';
const STUDIONET_RPC = 'https://studio.genlayer.com/api';

const privateKey = process.argv[2] || process.env.GENLAYER_PRIVATE_KEY;

if (!privateKey) {
  console.error('Error: Please provide a private key as an argument or set GENLAYER_PRIVATE_KEY.');
  console.error('Usage: node scripts/populate_live.mjs 0x...');
  process.exit(1);
}

const studionet = {
  id: 61999,
  name: 'GenLayer Studionet',
  rpcUrls: {
    default: { http: [STUDIONET_RPC] },
    public: { http: [STUDIONET_RPC] }
  }
};

async function main() {
  console.log('--- Initializing GenLayer Client ---');
  const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  const account = createAccount(formattedKey);
  console.log(`Using Account: ${account.address}`);
  console.log(`Target Contract: ${CONTRACT_ADDRESS}`);

  const client = createClient({
    chain: studionet,
    account
  });

  // Check current docket count
  try {
    const docketCount = await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: 'get_docket_count',
      args: []
    });
    console.log(`Current On-Chain Docket Count: ${docketCount}`);

    let targetDocketId = Number(docketCount);

    if (targetDocketId === 0) {
      console.log('\n[1/4] Initializing Docket #1 (Transit Expansion Citizen Assembly)...');
      const now = Math.floor(Date.now() / 1000);
      const initTx = await client.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: 'initialize_docket',
        args: [
          account.address,
          account.address,
          'https://assembly.civic.gov/charters/transit-2026.txt',
          '4a6b25110d939626e259b3df9e63e1986c758bb8efb7a1ffb1548b8b9c8a77a9',
          2, // 2 delegate seats
          now + 86400, // 24h enrollment deadline
          now + 172800 // 48h contestation deadline
        ]
      });
      console.log(`Init Tx Submitted: ${initTx}`);
      console.log('Waiting for receipt...');
      const initReceipt = await client.waitForTransactionReceipt({ hash: initTx });
      console.log(`Docket #1 Initialized! Status: ${initReceipt.status}`);
      targetDocketId = 1;
    } else {
      console.log(`Docket #1 already exists (Current state will be populated/inspected).`);
    }

    // Check existing testimonies
    const existingTestimonies = await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: 'get_all_testimonies',
      args: [targetDocketId]
    });
    console.log(`Existing Testimonies Count: ${existingTestimonies ? existingTestimonies.length : 0}`);

    if (!existingTestimonies || existingTestimonies.length === 0) {
      console.log('\n[2/4] Enrolling authentic citizen testimonies...');
      const authenticTestimonies = [
        {
          id: 't-commuter-union',
          url: 'https://assembly.civic.gov/t/t1.txt',
          digest: '1111111111111111111111111111111111111111111111111111111111111111'
        },
        {
          id: 't-active-mobility',
          url: 'https://assembly.civic.gov/t/t2.txt',
          digest: '2222222222222222222222222222222222222222222222222222222222222222'
        },
        {
          id: 't-suburban-transit',
          url: 'https://assembly.civic.gov/t/t3.txt',
          digest: '3333333333333333333333333333333333333333333333333333333333333333'
        },
        {
          id: 't-green-corridor',
          url: 'https://assembly.civic.gov/t/t4.txt',
          digest: '4444444444444444444444444444444444444444444444444444444444444444'
        }
      ];

      for (const t of authenticTestimonies) {
        console.log(`Enrolling testimony ${t.id}...`);
        const tx = await client.writeContract({
          address: CONTRACT_ADDRESS,
          functionName: 'enroll_testimony',
          args: [targetDocketId, t.id, t.url, t.digest]
        });
        console.log(`  Tx: ${tx}`);
        await client.waitForTransactionReceipt({ hash: tx });
      }
      console.log('All 4 citizen testimonies successfully enrolled on-chain!');
    }

    console.log('\n[3/4] Manifest Verification & Status Summary:');
    const docketSummary = await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: 'get_docket',
      args: [targetDocketId]
    });
    console.log('Docket State:', docketSummary.state);
    console.log('Enrolled Testimonies:', docketSummary.testimony_count);
    console.log('Manifest Hash:', docketSummary.expected_manifest_digest || docketSummary.computed_manifest_digest);

    console.log('\n[SUCCESS] Live transactions populated successfully on GenLayer Studionet!');
    console.log(`View live contract on explorer: https://explorer-studio.genlayer.com/address/${CONTRACT_ADDRESS}`);
  } catch (err) {
    console.error('Execution failed with error:', err);
  }
}

main();
