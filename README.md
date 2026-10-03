# BuilderProofVerifier 🔍

AI-powered builder proof verification system built on GenLayer Bradbury Testnet.

## What is this?

BuilderProofVerifier is an Intelligent Contract dApp that uses GenLayer's AI validators to verify builder proofs on-chain. Multiple independent AI validators analyze GitHub repositories and project summaries to reach consensus on whether work is genuine.

## How it works

1. **Submit Proof** — Builder submits their GitHub URL, demo URL, and project summary
2. **Judge Proof** — AI validators independently fetch GitHub content and analyze the work
3. **Consensus** — GenLayer's Equivalence Principle ensures validators agree on a verdict
4. **Verdict** — SHIPPED / WEAK / FAKE / NEEDS_MORE_EVIDENCE stored on-chain

## Tech Stack

- **Intelligent Contract** — Python on GenLayer Bradbury Testnet
- **Frontend** — Next.js 16, Tailwind CSS
- **SDK** — genlayer-js
- **Deployment** — Netlify

## Contract

- **Address:** `0x955E63b344A23Ca1bAA763Cf1eAf2a5aC69Cd334`
- **Network:** GenLayer Bradbury Testnet

## Local Setup

```bash
git clone https://github.com/huzaifa765/builder-proof-verifier
cd builder-proof-verifier
npm install
npm run dev
```

## Features

- Submit builder proofs with GitHub + demo evidence
- AI-powered judgment via GenLayer validators
- On-chain verdict storage
- Real-time consensus tracking
- MetaMask wallet integration

## Builder

Built by [@huzaifa765](https://github.com/huzaifa765) for GenLayer Builder Program