import { useWriteContract, useReadContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther, type Address } from 'viem';
import { useEffect } from 'react';

// Type definition for the ABI (you'll need to import or define your actual ABI)
type ProofOfVoiceABI = readonly unknown[];

// Import ABI - adjust path as needed
// If the JSON file doesn't exist, you'll need to create it or define the ABI inline
let ProofOfVoiceABI: ProofOfVoiceABI = [];
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ProofOfVoiceABI = require('../app/abis/ProofOfVoice.json') as ProofOfVoiceABI;
} catch {
  // ABI not found - define empty array or provide default ABI
  console.warn('ProofOfVoice ABI not found. Please create abis/ProofOfVoice.json');
}

const CONTRACT_ADDRESS = (process.env.CONTRACT_ADDRESS || '0x...') as Address;

export interface VoiceData {
  audioBytes: `0x${string}`;
  word: string;
  category: string;
  emotion: string;
  humanityScore: number;
  waveform: number[];
}

export function useProofOfVoice() {
  const { address } = useAccount();
  
  const { writeContract: mintVoice, data: mintData, isPending: isMinting, error: writeError } = useWriteContract();

  const { isLoading: isWaiting, isSuccess: mintSuccess, error: receiptError } = useWaitForTransactionReceipt({
    hash: mintData,
  });
  
  // Log transaction hash when available
  useEffect(() => {
    if (mintData) {
      console.log('📝 Transaction hash received:', mintData);
    }
  }, [mintData]);
  
  // Log errors
  useEffect(() => {
    if (writeError) {
      console.error('❌ Write contract error:', writeError);
    }
    if (receiptError) {
      console.error('❌ Transaction receipt error:', receiptError);
    }
  }, [writeError, receiptError]);

  const { data: hasMintedData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ProofOfVoiceABI,
    functionName: 'hasMinted',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
  
  const hasMinted = hasMintedData as boolean | undefined;

  const { data: totalSupply } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ProofOfVoiceABI,
    functionName: 'totalSupply',
  });

  const mint = async (voiceData: VoiceData) => {
    console.log('📋 Contract mint function called');
    console.log(`  Contract address: ${CONTRACT_ADDRESS}`);
    console.log(`  Wallet address: ${address || 'Not connected'}`);
    
    const {
      audioBytes,
      word,
      category,
      emotion,
      humanityScore,
      waveform
    } = voiceData;
    
    console.log('  Preparing transaction with args:');
    console.log(`    audioBytes length: ${audioBytes.length} chars`);
    console.log(`    word: ${word}`);
    console.log(`    category: ${category}`);
    console.log(`    emotion: ${emotion}`);
    console.log(`    humanityScore: ${humanityScore}`);
    console.log(`    waveform length: ${waveform.length}`);
    console.log(`    value: 0.001 ETH`);
    
    // writeContract doesn't return a value - it triggers the transaction
    // The transaction hash will be available in mintData from useWriteContract
    mintVoice({
      address: CONTRACT_ADDRESS,
      abi: ProofOfVoiceABI,
      functionName: 'mintVoice',
      args: [audioBytes, word, category, emotion, humanityScore, waveform],
      value: parseEther('0.001'), // Contract requires 0.001 ether
    } as any);
    
    console.log('  ✅ Transaction request sent to wallet');
    console.log('  ⏳ Waiting for user approval in wallet...');
    // Note: writeContract is fire-and-forget, transaction hash comes via mintData
  };

  return {
    mint,
    isMinting: isMinting || isWaiting,
    mintSuccess,
    hasMinted: hasMinted ?? false,
    totalSupply
  };
}
