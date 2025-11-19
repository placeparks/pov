"use client";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { sdk } from "@farcaster/miniapp-sdk";
import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Upload, Volume2, Users, Heart, Shield, History, Sparkles, AlertCircle, CheckCircle, LucideIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';

// Type definitions for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletAdvancedWalletActions,
  WalletAdvancedAddressDetails,
  WalletAdvancedTransactionActions,
  WalletAdvancedTokenHoldings,
} from '@coinbase/onchainkit/wallet';
import { useAccount, usePublicClient } from 'wagmi';
import { useProofOfVoice } from '../hooks/useContract';
import { useAllVoices } from '../hooks/useAllVoices';
import { audioToHex, hexToAudio } from '../utils/audioCompression';
import { analyzeVoice } from '../utils/voiceAnalysis';
  
  // Type definitions
  type Category = 'cypherpunk' | 'freedom' | 'empathy' | 'heroes' | 'history' | 'life';
  type Step = 'intro' | 'record' | 'success';
  
  interface Emotion {
    name: string;
    desc: string;
  }
  
  interface AnalysisResults {
    duration: number;
    hasBackgroundNoise: boolean;
    hasBreathSounds: boolean;
    speechVariability: number;
    energyDistribution: number;
    silenceRatio: number;
    averageEnergy: number;
    confidenceScore: number;
    waveform?: number[];
  }
  
  interface Voice {
    id: number;
    category: Category | null;
    word: string;
    emotion: string;
    audioData: string | ArrayBuffer | null;
    size: string;
    confidenceScore: number;
    timestamp: string;
    address: string;
  }
  
  // Single power words by category
  const WORD_CATEGORIES: Record<Category, string[]> = {
    cypherpunk: ["Satoshi", "Privacy", "Cryptography", "Sovereign", "Trustless", "Decentralized", "Code", "Cipher"],
    freedom: ["Liberty", "Autonomy", "Choice", "Independent", "Unbound", "Revolution", "Rights", "Free"],
    empathy: ["Compassion", "Kindness", "Together", "Understanding", "Connection", "Humanity", "Love", "Care"],
    heroes: ["Ada", "Turing", "Swartz", "Finney", "Nakamoto", "Lovelace", "Hero", "Pioneer"],
    history: ["Remember", "Forever", "Legacy", "Witness", "Archive", "Monument", "Time", "Echo"],
    life: ["Hope", "Dreams", "Wonder", "Joy", "Resilience", "Spirit", "Breathe", "Alive"]
  };
  
  const EMOTIONS: Emotion[] = [
    { name: "excited", desc: "like you just won the lottery" },
    { name: "whispered", desc: "like telling a secret" },
    { name: "powerful", desc: "like commanding an army" },
    { name: "joyful", desc: "like reuniting with a loved one" },
    { name: "defiant", desc: "like standing up to injustice" },
    { name: "reverent", desc: "like speaking something sacred" }
  ];
  
  const CATEGORY_ICONS: Record<Category, LucideIcon> = {
    cypherpunk: Shield,
    freedom: Sparkles,
    empathy: Heart,
    heroes: Users,
    history: History,
    life: Volume2
  };
  
  interface ProofOfVoiceProps {
    fid?: number;
    walletAddress?: string;
  }

  // Helper function to get responsive font size based on word length
  const getWordFontSize = (word: string, baseSize: string = 'text-5xl'): string => {
    const length = word.length;
    if (length <= 6) return baseSize; // text-5xl
    if (length <= 8) return 'text-4xl';
    if (length <= 10) return 'text-3xl';
    if (length <= 12) return 'text-2xl';
    if (length <= 15) return 'text-xl';
    return 'text-lg'; // For very long words
  };

  // Helper for smaller word displays (like in voice gallery)
  const getSmallWordFontSize = (word: string, baseSize: string = 'text-xl'): string => {
    const length = word.length;
    if (length <= 8) return baseSize; // text-xl
    if (length <= 10) return 'text-lg';
    if (length <= 12) return 'text-base';
    if (length <= 15) return 'text-sm';
    return 'text-xs';
  };

  const ProofOfVoice = ({ fid: _fid, walletAddress }: ProofOfVoiceProps = {}) => {
    const [step, setStep] = useState<Step>('intro');
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [assignedWord, setAssignedWord] = useState('');
    const [assignedEmotion, setAssignedEmotion] = useState<Emotion | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [voices, setVoices] = useState<Voice[]>([]);
    const [isMinting, setIsMinting] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
    const [mintedId, setMintedId] = useState<number | null>(null);
    const [mintError, setMintError] = useState<string | null>(null);
    const [showAllVoices, setShowAllVoices] = useState(false);
    const [playingTokenId, setPlayingTokenId] = useState<number | null>(null);
    const [loadingAudio, setLoadingAudio] = useState<number | null>(null);
    const [recognizedWord, setRecognizedWord] = useState<string | null>(null);
    const [showManifesto, setShowManifesto] = useState(false);
    
    // Contract hook
    const { mint, isMinting: isContractMinting, mintSuccess, hasMinted } = useProofOfVoice();
    const publicClient = usePublicClient();
    
    // Update isMinting state based on contract state
    useEffect(() => {
      setIsMinting(isContractMinting);
    }, [isContractMinting]);
    
    // Log mint success state changes
    useEffect(() => {
      if (mintSuccess) {
        console.log('🎉 Mint transaction confirmed! Processing success...');
      }
    }, [mintSuccess]);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const processedMintRef = useRef<boolean>(false);
  
    // Fetch on-chain voices instead of localStorage
    const { voices: onChainVoices, isLoading: isLoadingVoices } = useAllVoices();
  
    // Convert on-chain voices to local Voice format for display
    useEffect(() => {
      if (!isLoadingVoices) {
        if (onChainVoices && onChainVoices.length > 0) {
          try {
            const convertedVoices: Voice[] = onChainVoices.map((voice) => {
              // Safely convert timestamp
              let timestamp: string;
              try {
                if (voice.timestamp && Number(voice.timestamp) > 0) {
                  const date = new Date(Number(voice.timestamp) * 1000);
                  // Validate date is valid
                  if (isNaN(date.getTime())) {
                    timestamp = new Date().toISOString();
                  } else {
                    timestamp = date.toISOString();
                  }
                } else {
                  timestamp = new Date().toISOString();
                }
              } catch {
                console.warn(`Invalid timestamp for voice ${voice.tokenId}:`, voice.timestamp);
                timestamp = new Date().toISOString();
              }

              return {
                id: voice.tokenId,
                category: (voice.category as Category) || null,
                word: voice.word || 'Unknown',
                emotion: voice.emotion || 'unknown',
                audioData: null, // Audio stored on-chain, not in memory
                size: '0', // Size not available from contract
                confidenceScore: voice.humanityScore || 0,
                timestamp,
                address: voice.owner || '0x...',
              };
            });
            setVoices(convertedVoices);
          } catch (error) {
            console.error('Error converting voices:', error);
            setVoices([]);
          }
        } else {
          setVoices([]);
        }
      }
    }, [onChainVoices, isLoadingVoices]);
  
    const selectCategory = (category: Category) => {
      const words = WORD_CATEGORIES[category];
      const randomWord = words[Math.floor(Math.random() * words.length)];
      const randomEmotion = EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)];
      setSelectedCategory(category);
      setAssignedWord(randomWord);
      setAssignedEmotion(randomEmotion);
      setStep('record');
    };
  
    const analyzeAudio = async (blob: Blob) => {
      setIsAnalyzing(true);
      
      try {
        // Use the voiceAnalysis utility
        const analysis = await analyzeVoice(blob);
        
        // Convert to AnalysisResults format (matching existing interface)
        const results: AnalysisResults = {
          duration: analysis.duration,
          hasBackgroundNoise: analysis.hasBackgroundNoise,
          hasBreathSounds: analysis.hasBreathSounds,
          speechVariability: analysis.speechVariability,
          energyDistribution: analysis.energyDistribution,
          silenceRatio: analysis.silenceRatio,
          averageEnergy: analysis.averageEnergy,
          confidenceScore: analysis.confidenceScore,
          waveform: analysis.waveform
        };
        
        setAnalysisResults(results);
        setIsAnalyzing(false);
        
        return results;
      } catch (err) {
        console.error('Analysis error:', err);
        setIsAnalyzing(false);
        return null;
      }
    };
  
    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          }
        });
        
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus',
          audioBitsPerSecond: 24000
        });
        
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];
        setRecognizedWord(null); // Reset recognized word

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };
  
        mediaRecorder.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          setAudioBlob(blob);
          setAudioUrl(URL.createObjectURL(blob));
          stream.getTracks().forEach(track => track.stop());
          
          // Analyze the audio
          await analyzeAudio(blob);
        };

        // Start speech recognition to verify the word
        const SpeechRecognition = (window as unknown as WindowWithSpeechRecognition).SpeechRecognition || 
                                  (window as unknown as WindowWithSpeechRecognition).webkitSpeechRecognition;
        if (SpeechRecognition && assignedWord) {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = 'en-US';
          
          recognition.onresult = (event: SpeechRecognitionEvent) => {
            const transcript = event.results[0][0].transcript.trim().toLowerCase();
            setRecognizedWord(transcript);
            console.log('Recognized word:', transcript, 'Expected:', assignedWord.toLowerCase());
          };
          
          recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.warn('Speech recognition error:', event.error);
            // Don't block if recognition fails - it's optional
          };
          
          recognition.onend = () => {
            // Recognition ended
          };
          
          try {
            recognition.start();
            // Auto-stop recognition after 3.5 seconds
            setTimeout(() => {
              try {
                recognition.stop();
              } catch {
                // Ignore if already stopped
              }
            }, 3500);
          } catch (err) {
            console.warn('Speech recognition not available:', err);
          }
        }
  
        mediaRecorder.start();
        setIsRecording(true);
  
        // Auto-stop after 3 seconds
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            stopRecording();
          }
        }, 3000);
      } catch {
        alert('Microphone access denied. Please allow microphone access.');
      }
    };
  
    const stopRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    };
  
    const mintVoice = async () => {
      if (!audioBlob || !analysisResults || !selectedCategory || !assignedEmotion) return;
      
      // Prevent multiple mint calls
      if (isMinting || processedMintRef.current) {
        console.warn('⚠️ Mint already in progress or completed');
        return;
      }
      
      // Check if already minted
      if (hasMinted) {
        setMintError('You have already minted a voice. One voice per address.');
        return;
      }
      
      // Check for silence - reject if too much silence (user didn't speak)
      if (analysisResults.silenceRatio > 0.7) {
        setMintError('Recording is too silent. Please speak the word clearly.');
        return;
      }
      
      // Check for minimum energy - reject if audio is too quiet
      if (analysisResults.averageEnergy < 0.005) {
        setMintError('Recording is too quiet. Please speak louder and closer to the microphone.');
        return;
      }
      
      // Check for minimum duration of actual speech (accounting for silence)
      const speechDuration = analysisResults.duration * (1 - analysisResults.silenceRatio);
      if (speechDuration < 0.3) {
        setMintError('Recording is too short. Please speak the word clearly for at least 0.5 seconds.');
        return;
      }
      
      // Check if the recognized word matches the assigned word (if speech recognition is available)
      if (recognizedWord && assignedWord) {
        const recognizedLower = recognizedWord.toLowerCase().trim();
        const assignedLower = assignedWord.toLowerCase().trim();
        
        // Extract individual words from the recognized text (handles cases like "the word is Privacy")
        const recognizedWords = recognizedLower.split(/\s+/);
        
        // Check for exact match
        let wordsMatch = recognizedLower === assignedLower;
        
        // Check if any word in the recognized text matches the assigned word
        if (!wordsMatch) {
          wordsMatch = recognizedWords.some(word => {
            // Exact match
            if (word === assignedLower) return true;
            // Check if word contains the assigned word (handles partial matches)
            if (word.includes(assignedLower) && assignedLower.length >= 3) return true;
            // Check if assigned word contains the recognized word (handles abbreviations)
            if (assignedLower.includes(word) && word.length >= 3) return true;
            // Handle common variations (e.g., "code" vs "codes", "free" vs "freedom")
            // Check if words are similar (Levenshtein-like check for short words)
            if (Math.abs(word.length - assignedLower.length) <= 2) {
              // Simple similarity check: if one word starts with the other
              if (word.startsWith(assignedLower.substring(0, Math.min(4, assignedLower.length))) ||
                  assignedLower.startsWith(word.substring(0, Math.min(4, word.length)))) {
                return true;
              }
            }
            return false;
          });
        }
        
        if (!wordsMatch) {
          setMintError(`Word verification failed. You said "${recognizedWord}" but should have said "${assignedWord}". Please try again.`);
          return;
        }
      }
      
      // Check humanity score
      if (analysisResults.confidenceScore < 60) {
        setMintError('Humanity score too low. Minimum score is 60%. Please speak naturally with emotion.');
        return;
      }
      
      setIsMinting(true);
      setMintError(null);
      processedMintRef.current = false; // Reset flag for new mint attempt
      
      try {
        // Log original audio size
        const originalSizeKB = (audioBlob.size / 1024).toFixed(2);
        console.log('📊 Audio Size Analysis:');
        console.log(`  Original webm size: ${originalSizeKB} KB (${audioBlob.size} bytes)`);
        console.log(`  Audio type: ${audioBlob.type}`);
        console.log(`  Size limit: 20 KB (20480 bytes)`);
        
        // Use original webm blob directly (it's already compressed with Opus)
        // Converting to PCM would make it much larger
        const audioArrayBuffer = await audioBlob.arrayBuffer();
        const audioBytes = new Uint8Array(audioArrayBuffer);
        const audioSizeKB = (audioBytes.length / 1024).toFixed(2);
        
        console.log(`  Final audio bytes: ${audioSizeKB} KB (${audioBytes.length} bytes)`);
        console.log(`  Status: ${audioBytes.length <= 20480 ? '✅ Within limit' : '❌ Exceeds limit'}`);
        
        // Check size (contract limit: 20KB)
        if (audioBytes.length > 20480) {
          setMintError(`Audio file too large. Size: ${audioSizeKB} KB. Maximum size is 20KB.`);
          setIsMinting(false);
          return;
        }
        
        console.log('✅ Audio size check passed, proceeding with mint...');
        
        // Convert to hex format
        console.log('🔄 Converting audio to hex format...');
        const audioHex = audioToHex(audioBytes) as `0x${string}`;
        console.log(`  Hex length: ${audioHex.length} characters (${(audioHex.length / 2).toFixed(0)} bytes)`);
        
        // Get waveform from analysis (convert to uint16[])
        console.log('🔄 Preparing waveform data...');
        const waveform = analysisResults.waveform?.map(w => Math.min(65535, Math.max(0, w))) || [];
        const waveformUint16 = waveform.map(w => w as number);
        console.log(`  Waveform points: ${waveformUint16.length}`);
        
        // Prepare mint data
        const mintData = {
          audioBytes: audioHex,
          word: assignedWord,
          category: selectedCategory,
          emotion: assignedEmotion.name,
          humanityScore: Math.round(analysisResults.confidenceScore) as number,
          waveform: waveformUint16,
        };
        
        console.log('📝 Mint data prepared:');
        console.log(`  Word: ${mintData.word}`);
        console.log(`  Category: ${mintData.category}`);
        console.log(`  Emotion: ${mintData.emotion}`);
        console.log(`  Humanity Score: ${mintData.humanityScore}%`);
        console.log(`  Waveform length: ${mintData.waveform.length}`);
        
        // Call contract
        console.log('🚀 Calling contract mint function...');
        console.log('  Waiting for wallet transaction approval...');
        
        // Note: mint() doesn't return a value - it triggers the transaction
        // The transaction hash will be available via mintData in the hook
        mint(mintData);
        
        console.log('✅ Transaction request sent to wallet');
        console.log('  ⏳ Please approve the transaction in your wallet...');
        console.log('  📝 Transaction hash will appear once approved');
        
        // Wait for transaction success (handled by useEffect below)
        // The mintData will be updated when the transaction is submitted
      } catch (error: unknown) {
        console.error('Mint error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to mint voice. Please try again.';
        setMintError(errorMessage);
        setIsMinting(false);
      }
    };
    
    // Handle mint success - only process once per mint
    useEffect(() => {
      // Guard: only process if mintSuccess is true and we haven't processed this mint yet
      if (!mintSuccess || processedMintRef.current || !audioBlob || !analysisResults) {
        return;
      }
      
      // Mark as processed immediately to prevent re-processing
      processedMintRef.current = true;
      
      console.log('🎉 Mint transaction confirmed! Processing success...');
      
      // Voice will appear automatically when useAllVoices refetches
      // No need to save to localStorage - all data is on-chain
      setMintedId(Date.now());
        setIsMinting(false);
        setStep('success');
    }, [mintSuccess, audioBlob, analysisResults, assignedEmotion, selectedCategory, assignedWord, walletAddress]);
    
    // Reset processed flag when mintSuccess becomes false (new mint cycle)
    useEffect(() => {
      if (!mintSuccess) {
        processedMintRef.current = false;
      }
    }, [mintSuccess]);
  
    const reset = () => {
      setStep('intro');
      setSelectedCategory(null);
      setAssignedWord('');
      setAssignedEmotion(null);
      setAudioBlob(null);
      setAudioUrl(null);
      setAnalysisResults(null);
      setMintedId(null);
      setMintError(null);
      setRecognizedWord(null);
      processedMintRef.current = false; // Reset processed flag for new cycle
    };
  
    const playVoice = async (voice: Voice) => {
      // If audio is already in memory (base64), play it directly
      if (voice.audioData && typeof voice.audioData === 'string') {
        const audio = new Audio(voice.audioData);
      audio.play();
        return;
      }

      // Otherwise, fetch from contract
      if (!voice.id || !publicClient) {
        console.error('Cannot play: missing voice ID or public client');
        return;
      }
      
      setLoadingAudio(voice.id);
      try {
        // Import ABI
        let ProofOfVoiceABI: readonly unknown[] = [];
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          ProofOfVoiceABI = require('./abis/ProofOfVoice.json') as readonly unknown[];
        } catch {
          console.error('ABI not found');
          setLoadingAudio(null);
          return;
        }

        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
        if (!contractAddress || contractAddress === '0x...' || contractAddress === '0x0000000000000000000000000000000000000000') {
          console.error('Contract address not set');
          setLoadingAudio(null);
          return;
        }

        // Fetch audio from contract
        console.log(`Fetching audio for token ${voice.id}...`);
        const audioBytesHex = await publicClient.readContract({
          address: contractAddress,
          abi: ProofOfVoiceABI,
          functionName: 'getVoiceAudio',
          args: [BigInt(voice.id)],
        }) as `0x${string}`;

        if (!audioBytesHex || audioBytesHex === '0x') {
          console.error('No audio data returned from contract');
          setLoadingAudio(null);
          return;
        }

        // Convert hex to Uint8Array
        const audioBytes = hexToAudio(audioBytesHex);
        console.log(`Audio bytes length: ${audioBytes.length}`);
        
        // Create blob from audio bytes (assuming it's webm/opus format)
        // Create a new Uint8Array to ensure proper type compatibility
        const audioArray = new Uint8Array(audioBytes);
        const blob = new Blob([audioArray], { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(blob);
        
        const audio = new Audio(audioUrl);
        setPlayingTokenId(voice.id);
        
        audio.onended = () => {
          setPlayingTokenId(null);
          URL.revokeObjectURL(audioUrl);
        };
        
        audio.onerror = (e) => {
          console.error('Error playing audio:', e);
          setPlayingTokenId(null);
          URL.revokeObjectURL(audioUrl);
          setLoadingAudio(null);
        };
        
        await audio.play();
        setLoadingAudio(null);
        console.log('Audio playing...');
      } catch (error) {
        console.error('Error fetching/playing audio:', error);
        setLoadingAudio(null);
      }
    };
  
    if (step === 'intro') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white p-6">
          <div className="max-w-4xl mx-auto">
            {/* Navigation */}
            <div className="flex justify-between items-center mb-4 gap-4">
              <Link
                href="/echo-chamber"
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-sm font-medium"
              >
                <Users className="w-4 h-4" />
                <span>The Echo Chamber</span>
              </Link>
              <div className="backdrop-blur-sm bg-black/20 rounded-lg p-1 border border-white/10">
                <Wallet>
                  <ConnectWallet />
                  <WalletDropdown>
                    <WalletAdvancedWalletActions />
                    <WalletAdvancedAddressDetails />
                    <WalletAdvancedTransactionActions />
                    <WalletAdvancedTokenHoldings />
                  </WalletDropdown>
                </Wallet>
              </div>
            </div>
            
            <div className="text-center mb-12 mt-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600 rounded-full mb-4">
                <Volume2 className="w-10 h-10" />
              </div>
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Proof of Voice
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-6">
                Speak a single powerful word. Your voice will be analyzed and stored on-chain forever.
              </p>
              
              <div className="flex justify-center mb-4">
                <button
                  onClick={() => setShowManifesto(!showManifesto)}
                  className="px-6 py-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 rounded-lg transition-all text-sm font-medium flex items-center gap-2"
                >
                  <History className="w-4 h-4" />
                  {showManifesto ? 'Hide Manifesto' : 'View Manifesto'}
                </button>
              </div>

              {showManifesto && (
                <>
                  <style dangerouslySetInnerHTML={{__html: `
                    .manifesto::-webkit-scrollbar {
                      width: 8px;
                    }
                    .manifesto::-webkit-scrollbar-track {
                      background: rgba(139, 92, 246, 0.1);
                      border-radius: 4px;
                    }
                    .manifesto::-webkit-scrollbar-thumb {
                      background: rgba(139, 92, 246, 0.5);
                      border-radius: 4px;
                    }
                    .manifesto::-webkit-scrollbar-thumb:hover {
                      background: rgba(139, 92, 246, 0.7);
                    }
                  `}} />
                  <div className="manifesto relative bg-gradient-to-br from-black/60 via-purple-900/20 to-indigo-900/20 backdrop-blur-sm border-2 border-purple-500/40 rounded-2xl p-8 max-w-4xl mx-auto mb-6 max-h-[600px] overflow-y-auto shadow-2xl shadow-purple-900/20">
                  
                  <div className="space-y-6 text-gray-200">
                    {/* Opening Statement */}
                    <div className="space-y-4">
                      <p className="text-lg leading-relaxed text-white font-light">
                        In 2025, everything sounds human.
                      </p>
                      <p className="text-base leading-relaxed text-gray-300">
                        AI whispers. AI shouts. AI imitates emotion better than some people. The internet is drowning in artificial voices—perfect, flawless, soulless.
                      </p>
                    </div>

                    {/* Key Statement */}
                    <div className="relative py-4 px-6 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-l-4 border-purple-400 rounded-r-lg">
                      <p className="text-lg font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
                        Your voice is the last frontier of truth.
                      </p>
                      <p className="text-base leading-relaxed text-gray-300 mt-2">
                        Your breath, your imperfections, your micro-pauses… these are the fingerprints of consciousness.
                      </p>
                    </div>

                    {/* What is Proof of Voice */}
                    <div className="space-y-3">
                      <p className="text-base leading-relaxed">
                        Proof of Voice transforms a single spoken word into a permanent on-chain artifact.
                      </p>
                      <div className="flex flex-col gap-2 ml-4">
                        <p className="text-base leading-relaxed text-gray-400 italic">
                          Not a clip.
                        </p>
                        <p className="text-base leading-relaxed text-gray-400 italic">
                          Not a file.
                        </p>
                        <p className="text-base leading-relaxed text-purple-300 font-medium">
                          A human signature encoded in the Base blockchain forever.
                        </p>
                      </div>
                    </div>

                    {/* Emphasis Section */}
                    <div className="py-4 px-6 bg-black/30 border border-purple-500/30 rounded-lg">
                      <p className="text-lg font-bold text-purple-300 mb-2">
                        It&apos;s more than an NFT.
                      </p>
                      <p className="text-lg font-bold text-purple-300">
                        It&apos;s a timestamp of your existence.
                      </p>
                    </div>

                    {/* When you speak */}
                    <div className="space-y-3">
                      <p className="text-base leading-relaxed font-medium text-white">
                        When you speak:
                      </p>
                      <ul className="list-none space-y-2 ml-2">
                        <li className="flex items-start gap-3">
                          <span className="text-purple-400 mt-1">▸</span>
                          <span className="text-base leading-relaxed">Your breath is detected.</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-purple-400 mt-1">▸</span>
                          <span className="text-base leading-relaxed">Your emotional sharpness is analyzed.</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-purple-400 mt-1">▸</span>
                          <span className="text-base leading-relaxed">Your micro-variations are measured.</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-purple-400 mt-1">▸</span>
                          <span className="text-base leading-relaxed">Your humanity is scored.</span>
                        </li>
                      </ul>
                    </div>

                    {/* Anti-bot statement */}
                    <div className="space-y-3 py-4 border-t border-b border-purple-500/20">
                      <p className="text-base leading-relaxed font-medium text-white">
                        No bot can fake these imperfections.
                      </p>
                      <p className="text-base leading-relaxed text-gray-300">
                        No AI can manufacture what your lungs create naturally.
                      </p>
                    </div>

                    {/* Verification process */}
                    <p className="text-base leading-relaxed">
                      Once verified, your voice is compressed, encoded, and written on-chain as a unique NFT, alongside your humanity score, emotional tone, category identity, and waveform fingerprint.
                    </p>

                    {/* One voice per wallet */}
                    <div className="py-4 px-6 bg-gradient-to-r from-red-900/20 to-purple-900/20 border border-red-500/30 rounded-lg">
                      <p className="text-lg font-bold text-red-300 mb-2">
                        There is only one voice per wallet.
                      </p>
                      <p className="text-lg font-bold text-red-300 mb-2">
                        One chance.
                      </p>
                      <p className="text-lg font-bold text-red-300">
                        One real moment in time.
                      </p>
                    </div>

                    {/* Closing statement */}
                    <p className="text-base leading-relaxed italic text-gray-300">
                      Years from now, when synthetic voices dominate the world, these NFTs will stand as proof that we were here — alive, breathing, emotional.
                    </p>

                    {/* Artwork Section */}
                    <div className="mt-8 pt-6 border-t-2 border-purple-500/30">
                      <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-purple-400" />
                        What Makes the Artwork Exclusive?
                      </h3>
                      <p className="text-base leading-relaxed mb-4">
                        Your Proof of Voice NFT generates custom art directly from your voice data.
                      </p>
                      <p className="text-base leading-relaxed mb-6 text-gray-300">
                        No two pieces can ever match because each element is tied to your sound:
                      </p>

                      <div className="grid gap-4">
                        <div className="bg-black/30 border border-blue-500/20 rounded-lg p-4 hover:border-blue-400/40 transition-colors">
                          <p className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                            <span className="text-purple-400">1.</span> Waveform-Fingerprint Design
                          </p>
                          <p className="text-sm text-gray-300 leading-relaxed">The system converts your real audio waveform into a visual fingerprint — peaks, valleys, tremble, breath dips — all mapped into a generative pattern.</p>
                        </div>
                        <div className="bg-black/30 border border-blue-500/20 rounded-lg p-4 hover:border-blue-400/40 transition-colors">
                          <p className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                            <span className="text-purple-400">2.</span> Emotion-Based Color Mapping
                          </p>
                          <p className="text-sm text-gray-300 leading-relaxed">Your emotional tone (powerful, whispered, joyful, defiant, reverent, excited) determines the color palette and energy gradients.</p>
                        </div>
                        <div className="bg-black/30 border border-blue-500/20 rounded-lg p-4 hover:border-blue-400/40 transition-colors">
                          <p className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                            <span className="text-purple-400">3.</span> Category Aura
                          </p>
                          <p className="text-sm text-gray-300 leading-relaxed">Your chosen category (cypherpunk, freedom, empathy, heroes, history, life) generates a thematic lighting layer unique to that domain.</p>
                        </div>
                        <div className="bg-black/30 border border-blue-500/20 rounded-lg p-4 hover:border-blue-400/40 transition-colors">
                          <p className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                            <span className="text-purple-400">4.</span> Humanity Score Integration
                          </p>
                          <p className="text-sm text-gray-300 leading-relaxed">Higher humanity scores produce richer, more detailed patterns — a visual celebration of your authenticity.</p>
                        </div>
                        <div className="bg-black/30 border border-blue-500/20 rounded-lg p-4 hover:border-blue-400/40 transition-colors">
                          <p className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                            <span className="text-purple-400">5.</span> On-Chain SVG Generation
                          </p>
                          <p className="text-sm text-gray-300 leading-relaxed">The artwork is not pre-made. It&apos;s generated entirely on-chain at mint time from your real audio metrics. No template. No repetition. No re-creation possible.</p>
                        </div>
                      </div>

                      <p className="text-base leading-relaxed mt-6 font-medium text-purple-300">
                        Your artwork is literally shaped by your voice, making it impossible for anyone — human or AI — to reproduce.
                      </p>
                    </div>

                    {/* FAQ Section */}
                    <div className="mt-8 pt-6 border-t-2 border-purple-500/30">
                      <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
                        <History className="w-6 h-6 text-purple-400" />
                        FAQ
                      </h3>

                      <div className="space-y-5">
                        <div className="bg-black/20 border border-purple-500/20 rounded-lg p-5 hover:border-purple-400/30 transition-colors">
                          <p className="font-bold text-blue-400 mb-3 text-lg">What am I minting?</p>
                          <p className="text-sm text-gray-300 mb-2">A 100% on-chain voice artifact that includes:</p>
                          <ul className="list-none space-y-1.5 ml-2 mb-3">
                            <li className="flex items-start gap-2">
                              <span className="text-purple-400 mt-1 text-xs">•</span>
                              <span className="text-sm text-gray-300">Your compressed audio bytes</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-purple-400 mt-1 text-xs">•</span>
                              <span className="text-sm text-gray-300">A waveform-fingerprint artwork</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-purple-400 mt-1 text-xs">•</span>
                              <span className="text-sm text-gray-300">Emotion signature</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-purple-400 mt-1 text-xs">•</span>
                              <span className="text-sm text-gray-300">Category identity</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-purple-400 mt-1 text-xs">•</span>
                              <span className="text-sm text-gray-300">Humanity score</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-purple-400 mt-1 text-xs">•</span>
                              <span className="text-sm text-gray-300">Timestamp</span>
                            </li>
                          </ul>
                          <p className="text-sm text-purple-300 font-medium">All stored directly on Base L2.</p>
                        </div>

                        <div className="bg-black/20 border border-purple-500/20 rounded-lg p-5 hover:border-purple-400/30 transition-colors">
                          <p className="font-bold text-blue-400 mb-3 text-lg">How is this anti-bot?</p>
                          <p className="text-sm text-gray-300 mb-2">We detect signals AI struggles to fake:</p>
                          <ul className="list-none space-y-1.5 ml-2 mb-3">
                            <li className="flex items-start gap-2">
                              <span className="text-purple-400 mt-1 text-xs">•</span>
                              <span className="text-sm text-gray-300">Breath patterns</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-purple-400 mt-1 text-xs">•</span>
                              <span className="text-sm text-gray-300">Emotional micro-variations</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-purple-400 mt-1 text-xs">•</span>
                              <span className="text-sm text-gray-300">Real ambient noise</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-purple-400 mt-1 text-xs">•</span>
                              <span className="text-sm text-gray-300">Human dynamic range</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-purple-400 mt-1 text-xs">•</span>
                              <span className="text-sm text-gray-300">Natural silence gaps</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-purple-400 mt-1 text-xs">•</span>
                              <span className="text-sm text-gray-300">Imperfect waveform irregularities</span>
                            </li>
                          </ul>
                          <p className="text-sm text-red-300 font-medium">If any of these markers are missing, minting is blocked.</p>
                        </div>

                        <div className="bg-black/20 border border-purple-500/20 rounded-lg p-5 hover:border-purple-400/30 transition-colors">
                          <p className="font-bold text-blue-400 mb-3 text-lg">Why is the artwork exclusive?</p>
                          <p className="text-sm text-gray-300 leading-relaxed">Because it is generated from your actual sound, not templates. Every peak, breath, silence, emotion, and category transforms into art. It is mathematically impossible for two artworks to match.</p>
                        </div>

                        <div className="bg-black/20 border border-purple-500/20 rounded-lg p-5 hover:border-purple-400/30 transition-colors">
                          <p className="font-bold text-blue-400 mb-3 text-lg">Where can I trade these NFTs?</p>
                          <p className="text-sm text-gray-300 mb-2">Technically anywhere — OpenSea, Rarible, etc. But the native marketplace gives you:</p>
                          <ul className="list-none space-y-1.5 ml-2 mb-3">
                            <li className="flex items-start gap-2">
                              <span className="text-purple-400 mt-1 text-xs">•</span>
                              <span className="text-sm text-gray-300">Near-0 fees</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-purple-400 mt-1 text-xs">•</span>
                              <span className="text-sm text-gray-300">The best waveform viewer</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-purple-400 mt-1 text-xs">•</span>
                              <span className="text-sm text-gray-300">Humanity score display</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-purple-400 mt-1 text-xs">•</span>
                              <span className="text-sm text-gray-300">A curated real-human ecosystem</span>
                            </li>
                          </ul>
                          <p className="text-sm text-purple-300 font-medium">It&apos;s built specifically for voice NFTs.</p>
                        </div>

                        <div className="bg-black/20 border border-purple-500/20 rounded-lg p-5 hover:border-purple-400/30 transition-colors">
                          <p className="font-bold text-blue-400 mb-3 text-lg">Can I mint more than one?</p>
                          <p className="text-sm text-gray-300">No. One voice per wallet. One imprint of your humanity.</p>
                        </div>

                        <div className="bg-black/20 border border-purple-500/20 rounded-lg p-5 hover:border-purple-400/30 transition-colors">
                          <p className="font-bold text-blue-400 mb-3 text-lg">What happens if my humanity score is low?</p>
                          <p className="text-sm text-gray-300">You&apos;ll be prompted to re-record until your natural human traits pass verification.</p>
                        </div>

                        <div className="bg-black/20 border border-purple-500/20 rounded-lg p-5 hover:border-purple-400/30 transition-colors">
                          <p className="font-bold text-blue-400 mb-3 text-lg">Is everything really on-chain?</p>
                          <p className="text-sm text-gray-300">Yes — audio bytes, artwork, metadata, waveform, classification, everything. Your voice becomes immutable code.</p>
                        </div>

                        <div className="bg-black/20 border border-purple-500/20 rounded-lg p-5 hover:border-purple-400/30 transition-colors">
                          <p className="font-bold text-blue-400 mb-3 text-lg">Is there any utility?</p>
                          <p className="text-sm text-gray-300 mb-3">Not yet — and that&apos;s intentional. Proof of Voice starts as a digital relic, not a utility token. But future potential is wide open. Early minters will stand at the foundation of whatever emerges next:</p>
                          <ul className="list-none space-y-1.5 ml-2 mb-3">
                            <li className="flex items-start gap-2">
                              <span className="text-purple-400 mt-1 text-xs">•</span>
                              <span className="text-sm text-gray-300">Human-verified identity badges</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-purple-400 mt-1 text-xs">•</span>
                              <span className="text-sm text-gray-300">Voice-based access layers</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-purple-400 mt-1 text-xs">•</span>
                              <span className="text-sm text-gray-300">On-chain reputation tied to your humanity score</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-purple-400 mt-1 text-xs">•</span>
                              <span className="text-sm text-gray-300">Farcaster voice reactions</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-purple-400 mt-1 text-xs">•</span>
                              <span className="text-sm text-gray-300">Exclusive Proof-of-Voice events, drops, or collaborations</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-purple-400 mt-1 text-xs">•</span>
                              <span className="text-sm text-gray-300">Real-world history archive of early human voice signatures</span>
                            </li>
                          </ul>
                          <p className="text-sm text-purple-300 font-medium italic">Nothing is promised. Everything is possible. Early voices become part of the origin story.</p>
                        </div>

                        <div className="bg-black/20 border border-purple-500/20 rounded-lg p-5 hover:border-purple-400/30 transition-colors">
                          <p className="font-bold text-blue-400 mb-3 text-lg">What is the Echo Chamber?</p>
                          <p className="text-sm text-gray-300">A real-time gallery of all minted human voices — a living on-chain archive of consciousness.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                </>
              )}
              
              <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4 max-w-xl mx-auto">
                <p className="text-sm text-gray-300">
                  <strong className="text-purple-400">The Innovation:</strong> Real-time voice analysis verifies you&apos;re human. 
                  We check for breath sounds, natural variation, and emotional authenticity. Bots can&apos;t fake being alive.
                </p>
              </div>

              {/* Powerful Call to Action */}
              <div className="mt-12 mb-8 max-w-3xl mx-auto">
                <div className="relative">
                  {/* Glowing background effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-red-600/20 to-purple-600/20 blur-3xl rounded-3xl"></div>
                  
                  {/* Main content */}
                  <div className="relative bg-gradient-to-br from-black/80 via-purple-900/40 to-black/80 border-2 border-purple-500/50 rounded-2xl p-8 md:p-12 shadow-2xl">
                    <div className="space-y-5 text-center">
                      <p className="text-2xl md:text-3xl font-bold text-white leading-tight">
                        This isn&apos;t a collectible.
                      </p>
                      
                      <div className="space-y-3">
                        <p className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-400 via-red-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
                          It&apos;s resistance.
                        </p>
                        <p className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                          It&apos;s permanence.
                        </p>
                        <p className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-300 to-white bg-clip-text text-transparent">
                          It&apos;s you.
                        </p>
                      </div>

                      <div className="pt-4">
                        <p className="text-3xl md:text-4xl font-black bg-gradient-to-r from-red-400 via-purple-400 to-red-400 bg-clip-text text-transparent mb-3 tracking-tight">
                          Mint your existence.
                        </p>
                        <p className="text-xl md:text-2xl font-bold text-gray-200 italic">
                          Leave an echo no AI can erase.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
  
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-center">Choose Your Category</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(Object.keys(WORD_CATEGORIES) as Category[]).map((category) => {
                  const Icon = CATEGORY_ICONS[category];
                  return (
                    <button
                      key={category}
                      onClick={() => selectCategory(category)}
                      className="bg-gradient-to-br from-purple-800/50 to-indigo-900/50 border border-purple-500/30 rounded-xl p-6 hover:border-purple-400 transition-all hover:scale-105 group"
                    >
                      <Icon className="w-8 h-8 mb-3 text-purple-400 group-hover:text-purple-300" />
                      <h3 className="text-lg font-bold capitalize mb-2">{category}</h3>
                      <p className="text-sm text-gray-400">
                        {WORD_CATEGORIES[category].length} words
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
  
            {(isLoadingVoices || voices.length > 0) && (
              <div className="bg-black/30 border border-purple-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Users className="w-6 h-6" />
                    Minted Voices ({isLoadingVoices ? '...' : voices.length})
                </h2>
                  <div className="flex items-center gap-2">
                    {voices.length > 50 && (
                      <button
                        onClick={() => setShowAllVoices(!showAllVoices)}
                        className="text-sm px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg transition-colors"
                      >
                        {showAllVoices ? 'Show Less' : `Show All (${voices.length})`}
                      </button>
                    )}
                    <Link
                      href="/echo-chamber"
                      className="text-sm px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg transition-colors"
                    >
                      View Full Gallery
                    </Link>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  ✨ Showing all voices minted on-chain. Audio stored permanently on Base blockchain.
                </p>
                {isLoadingVoices ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-400 mr-2" />
                    <span className="text-gray-400">Loading minted voices from blockchain...</span>
                  </div>
                ) : voices.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No voices minted yet. Be the first!</p>
                  </div>
                ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                    {(showAllVoices ? voices : voices.slice(-50)).slice().reverse().map((voice) => (
                    <div key={voice.id} className="bg-purple-900/20 border border-purple-500/20 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2 gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-purple-400 capitalize">{voice.category}</div>
                          <div className={`font-bold ${getSmallWordFontSize(voice.word)} break-words break-all`}>{voice.word}</div>
                          <div className="text-xs text-gray-400 mt-1 capitalize">
                            Said {voice.emotion} • {voice.size}KB
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className={`text-sm font-bold ${
                              voice.confidenceScore >= 80 ? 'text-green-400' : 
                              voice.confidenceScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {voice.confidenceScore}% Human
                            </div>
                          </div>
                          <button
                            onClick={() => playVoice(voice)}
                            disabled={loadingAudio === voice.id}
                            className="bg-purple-600 hover:bg-purple-500 rounded-full p-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
                            title={loadingAudio === voice.id ? 'Loading audio...' : 'Play voice from blockchain'}
                          >
                            {loadingAudio === voice.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : playingTokenId === voice.id ? (
                              <Square className="w-5 h-5" />
                            ) : (
                            <Volume2 className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }
  
    if (step === 'record') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white p-6 flex items-center justify-center">
          <div className="max-w-2xl w-full">
            {/* Navigation */}
            <div className="flex justify-between items-center mb-6 gap-4">
              <Link
                href="/echo-chamber"
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-sm font-medium"
              >
                <Users className="w-4 h-4" />
                <span>The Echo Chamber</span>
              </Link>
              <div className="backdrop-blur-sm bg-black/20 rounded-lg p-1 border border-white/10">
                <Wallet>
                  <ConnectWallet />
                  <WalletDropdown>
                    <WalletAdvancedWalletActions />
                    <WalletAdvancedAddressDetails />
                    <WalletAdvancedTransactionActions />
                    <WalletAdvancedTokenHoldings />
                  </WalletDropdown>
                </Wallet>
              </div>
            </div>
            <div className="bg-black/40 border-2 border-purple-500/50 rounded-2xl p-8">
              <div className="text-center mb-8">
                <div className="inline-block bg-purple-900/50 px-4 py-2 rounded-full text-sm text-purple-300 mb-4 capitalize">
                  {selectedCategory}
                </div>
                <h2 className="text-3xl font-bold mb-4">Speak This Word</h2>
                <div className={`bg-gradient-to-r from-purple-600 to-blue-600 text-white ${getWordFontSize(assignedWord)} font-bold py-8 px-8 rounded-xl mb-4 break-words break-all`}>
                  {assignedWord}
                </div>
                {assignedEmotion && (
                <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4 mb-6">
                  <p className="text-yellow-200 font-medium">
                    Say it {assignedEmotion.name}: <span className="italic">{assignedEmotion.desc}</span>
                  </p>
                </div>
                )}
                <p className="text-gray-300 mb-2">
                  You have 3 seconds. Let the emotion guide your voice.
                </p>
                <p className="text-sm text-gray-400">
                  We&apos;ll analyze your audio for human characteristics: breath, emotion, natural variation.
                </p>
              </div>
  
              {!audioUrl ? (
                <div className="text-center">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isRecording}
                    className={`${
                      isRecording 
                        ? 'bg-red-600 animate-pulse cursor-not-allowed' 
                        : 'bg-purple-600 hover:bg-purple-500'
                    } text-white rounded-full p-8 transition-all inline-flex items-center justify-center mb-4`}
                  >
                    {isRecording ? (
                      <Square className="w-12 h-12" />
                    ) : (
                      <Mic className="w-12 h-12" />
                    )}
                  </button>
                  <div className="text-lg font-medium">
                    {isRecording ? 'Recording... (Auto-stops in 3s)' : 'Tap to Record'}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {isAnalyzing ? (
                    <div className="bg-purple-900/30 rounded-lg p-6 text-center">
                      <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-gray-300">Analyzing your voice...</p>
                      <p className="text-sm text-gray-400 mt-2">Checking for human characteristics</p>
                    </div>
                  ) : analysisResults ? (
                    <>
                      <div className="bg-purple-900/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-gray-400">Your Recording</span>
                          <span className={`text-sm font-bold ${
                            analysisResults.confidenceScore >= 80 ? 'text-green-400' : 
                            analysisResults.confidenceScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {analysisResults.confidenceScore >= 80 ? '✓ Verified Human' : 
                             analysisResults.confidenceScore >= 60 ? '⚠ Marginal' : '✗ Low Confidence'}
                          </span>
                        </div>
                        <audio src={audioUrl || undefined} controls className="w-full mb-3" />
                        <div className="text-xs text-gray-400 mb-2">
                          Size: {audioBlob ? (audioBlob.size / 1024).toFixed(2) : '0'} KB • Duration: {analysisResults ? analysisResults.duration.toFixed(2) : '0'}s
                        </div>
                        {recognizedWord && (
                          <div className={`text-xs p-2 rounded ${
                            recognizedWord.toLowerCase().includes(assignedWord.toLowerCase()) || 
                            assignedWord.toLowerCase().includes(recognizedWord.toLowerCase())
                              ? 'bg-green-900/30 text-green-300 border border-green-500/30'
                              : 'bg-yellow-900/30 text-yellow-300 border border-yellow-500/30'
                          }`}>
                            <span className="font-medium">Recognized:</span> &quot;{recognizedWord}&quot; 
                            {recognizedWord.toLowerCase().includes(assignedWord.toLowerCase()) || 
                             assignedWord.toLowerCase().includes(recognizedWord.toLowerCase()) 
                              ? ' ✓' : ` (Expected: &quot;${assignedWord}&quot;)`}
                          </div>
                        )}
                      </div>
  
                      <div className="bg-black/40 border border-purple-500/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold">Voice Analysis Results</h3>
                          <div className="text-2xl font-bold">
                            {analysisResults.confidenceScore}%
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Background Noise</span>
                            {analysisResults.hasBackgroundNoise ? 
                              <CheckCircle className="w-4 h-4 text-green-400" /> : 
                              <AlertCircle className="w-4 h-4 text-gray-500" />
                            }
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Breath Sounds</span>
                            {analysisResults.hasBreathSounds ? 
                              <CheckCircle className="w-4 h-4 text-green-400" /> : 
                              <AlertCircle className="w-4 h-4 text-gray-500" />
                            }
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Natural Variation</span>
                            {analysisResults.speechVariability > 2 ? 
                              <CheckCircle className="w-4 h-4 text-green-400" /> : 
                              <AlertCircle className="w-4 h-4 text-gray-500" />
                            }
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Dynamic Range</span>
                            {analysisResults.energyDistribution > 0.3 ? 
                              <CheckCircle className="w-4 h-4 text-green-400" /> : 
                              <AlertCircle className="w-4 h-4 text-gray-500" />
                            }
                          </div>
                        </div>
                      </div>
  
                      {analysisResults.confidenceScore < 70 && (
                        <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4">
                          <p className="text-yellow-200 text-sm">
                            ⚠️ Low confidence score. Try speaking more naturally with emotion, or ensure you&apos;re in a real environment with ambient sound.
                          </p>
                        </div>
                      )}

                      {mintError && (
                        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
                          <p className="text-red-200 text-sm">
                            ⚠️ {mintError}
                          </p>
                        </div>
                      )}

                      {hasMinted && (
                        <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
                          <p className="text-blue-200 text-sm">
                            ℹ️ You have already minted a voice. One voice per address.
                          </p>
                        </div>
                      )}
  
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setAudioUrl(null);
                            setAudioBlob(null);
                            setAnalysisResults(null);
                          }}
                          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors"
                        >
                          Re-record
                        </button>
                        <button
                          onClick={mintVoice}
                          disabled={isMinting || analysisResults.confidenceScore < 60 || hasMinted}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-3 rounded-lg transition-all font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isMinting ? (
                            <>Processing...</>
                          ) : (
                            <>
                              <Upload className="w-5 h-5" />
                              Mint On-Chain
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              )}
  
              <button
                onClick={reset}
                className="w-full mt-4 text-gray-400 hover:text-white text-sm py-2 transition-colors"
              >
                ← Back to Categories
              </button>
            </div>
          </div>
        </div>
      );
    }
  
    if (step === 'success') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white p-6 flex items-center justify-center">
          <div className="max-w-2xl w-full">
            {/* Navigation */}
            <div className="flex justify-between items-center mb-6 gap-4">
              <Link
                href="/echo-chamber"
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-sm font-medium"
              >
                <Users className="w-4 h-4" />
                <span>The Echo Chamber</span>
              </Link>
              <div className="backdrop-blur-sm bg-black/20 rounded-lg p-1 border border-white/10">
                <Wallet>
                  <ConnectWallet />
                  <WalletDropdown>
                    <WalletAdvancedWalletActions />
                    <WalletAdvancedAddressDetails />
                    <WalletAdvancedTransactionActions />
                    <WalletAdvancedTokenHoldings />
                  </WalletDropdown>
                </Wallet>
              </div>
            </div>
            <div className="text-center">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-green-600 rounded-full mb-6 animate-bounce">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-5xl font-bold mb-4">Voice Minted!</h1>
              <p className="text-xl text-gray-300 mb-6">
                Your voice is now a part of blockchain history
              </p>
            </div>
  
            <div className="bg-black/40 border-2 border-purple-500/50 rounded-2xl p-8 mb-6">
              <div className="space-y-4 text-left">
                <div className="flex justify-between py-2 border-b border-purple-500/20">
                  <span className="text-gray-400">Category:</span>
                  <span className="font-medium capitalize">{selectedCategory}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-purple-500/20">
                  <span className="text-gray-400">Word:</span>
                  <span className={`font-bold ${getSmallWordFontSize(assignedWord)} break-words break-all`}>{assignedWord}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-purple-500/20">
                  <span className="text-gray-400">Emotion:</span>
                  <span className="font-medium capitalize">{assignedEmotion?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-purple-500/20">
                  <span className="text-gray-400">Humanity Score:</span>
                  <span className={`font-bold ${
                    (analysisResults?.confidenceScore || 0) >= 80 ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {analysisResults?.confidenceScore || 0}%
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-purple-500/20">
                  <span className="text-gray-400">On-chain Size:</span>
                  <span className="font-medium">{audioBlob ? (audioBlob.size / 1024).toFixed(2) : '0'} KB</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-400">Token ID:</span>
                  <span className="font-mono text-sm font-medium">#{mintedId}</span>
                </div>
              </div>
            </div>
  
            <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-6 mb-6">
              <p className="text-sm text-gray-300">
                Your voice passed human verification and is now permanently stored on Base L2. 
                The audio bytes, your humanity score, and the emotional context are all immutably recorded. 
                You are proof that consciousness existed in this moment.
              </p>
            </div>
  
            <button
              onClick={reset}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-4 px-8 rounded-lg transition-all font-bold text-lg"
            >
              Return Home
            </button>
            </div>
          </div>
        </div>
      );
    }
  
    return null;
  };
  
  // Main Page component with MiniKit integration and wallet gate
  const Page = () => {
    const { 
      setFrameReady,
      context 
    } = useMiniKit();
    const { address, status } = useAccount();
    const [initLoading, setInitLoading] = useState(true);

    // Initialize MiniKit frame readiness and Farcaster SDK
    useEffect(() => {
      const initializeSDK = async () => {
        try {
          // Call Farcaster SDK ready() to dismiss splash screen
          await sdk.actions.ready();
        } catch (error) {
          console.error('Error calling sdk.actions.ready():', error);
        }
        
        // Also call OnchainKit's setFrameReady if available
        if (setFrameReady) {
          setFrameReady();
        }
      };
      
      initializeSDK();
      
      const timer = setTimeout(() => {
        setInitLoading(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }, [setFrameReady]);

    const fid = context?.user?.fid;
    const isConnected = status === 'connected' && !!address;

    // Show loading state while MiniKit initializes
    if (initLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600 rounded-full mb-4">
              <Volume2 className="w-10 h-10" />
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Initializing...</span>
            </div>
          </div>
        </div>
      );
    }

    // Show wallet gate until a wallet connection exists
    if (!isConnected) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <div className="bg-black/40 border-2 border-purple-500/50 rounded-2xl p-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600 rounded-full mb-6">
                <Volume2 className="w-10 h-10" />
              </div>
              <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Proof of Voice
              </h1>
              <p className="text-lg text-gray-300 mb-2">
                Connect a wallet to mint your voice on-chain
              </p>
              <p className="text-sm text-gray-400 mb-6">
                All wallets supported by OnchainKit + Base are compatible.
              </p>
              <ConnectWallet
                render={({ onClick, isLoading }) => (
                  <button
                    onClick={onClick}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-4 px-6 rounded-xl transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Opening wallet...</span>
                      </>
                    ) : (
                      <span>Enter App</span>
                    )}
                  </button>
                )}
              />

              <p className="mt-6 text-xs text-gray-500">
                A modal will appear so you can pick Coinbase Wallet, Smart Wallet, or any supported connector. Your voice will be analyzed and stored permanently on Base L2.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Once connected, render the main ProofOfVoice component
    return (
      <ProofOfVoice fid={fid} walletAddress={address} />
    );
  };
  
  export default Page;
