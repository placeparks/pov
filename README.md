# Proof of Voice

**Immortalize Your Voice on Base**

Proof of Voice is a revolutionary Web3 application that allows users to record their voice, analyze its humanity, and mint it as a unique NFT on Base blockchain. Each voice recording is permanently stored on-chain with emotional analysis, category classification, and audio data.

## 🎤 What is Proof of Voice?

Proof of Voice transforms spoken words into immutable, on-chain NFTs. When you speak a single powerful word, the app:

- **Records your voice** with real-time audio capture
- **Analyzes authenticity** using advanced voice analysis algorithms that detect:
  - Natural breath sounds
  - Speech variability and emotional authenticity
  - Background noise patterns
  - Energy distribution
  - Silence ratios
- **Calculates a Humanity Score** (0-100%) that verifies you're human, not a bot
- **Classifies your voice** into categories: cypherpunk, freedom, empathy, heroes, history, or life
- **Detects emotion** in your delivery (powerful, whispered, calm, etc.)
- **Mints an NFT** on Base L2 with:
  - Compressed audio data stored on-chain
  - Visual SVG representation
  - Metadata including word, category, emotion, and humanity score
  - Timestamp and waveform visualization

## 🌟 Why Proof of Voice Matters

### Human Verification in the Age of AI

In an era where AI-generated content is becoming indistinguishable from human creation, Proof of Voice provides a unique solution:

- **Bot Resistance**: The voice analysis algorithm specifically detects human characteristics that are extremely difficult for AI to replicate—natural breath sounds, emotional variation, and authentic speech patterns
- **One Voice Per Human**: The smart contract enforces "one voice per wallet" ensuring each person can only mint once, creating true scarcity and authenticity
- **On-Chain Permanence**: Unlike traditional social media posts that can be deleted, your voice NFT is permanently stored on the blockchain, creating an immutable record of your humanity

### Digital Identity and Self-Sovereignty

- **Own Your Voice**: Your voice NFT is truly yours—stored on-chain, tradeable, and verifiable
- **Prove Your Humanity**: In a world increasingly filled with bots and AI, your voice NFT serves as cryptographic proof that you are human
- **Emotional Time Capsule**: Capture a moment in time—your emotional state, your voice, your word—forever preserved on the blockchain

### Community and Social Impact

- **The Echo Chamber**: View all minted voices in a beautiful gallery, creating a collective archive of human expression
- **Farcaster Integration**: Share your voice NFT directly on Farcaster, building community around authentic human voices
- **Base L2 Efficiency**: Low-cost minting on Base makes voice NFTs accessible to everyone, not just crypto whales

## 🎨 Features

### Voice Recording & Analysis
- Real-time audio recording with waveform visualization
- Advanced voice analysis detecting human characteristics
- Humanity score calculation (minimum 60% required to mint)
- Automatic category and emotion classification

### NFT Minting
- ERC721 NFT standard on Base L2
- On-chain audio storage (compressed, max 20KB)
- Beautiful SVG artwork generated from your voice data
- Metadata including word, category, emotion, humanity score, and timestamp

### The Echo Chamber
- Gallery of all minted voices
- Statistics: total supply, average score, unique categories
- Audio playback of minted voices
- Ownership-based sharing to Farcaster

### MiniKit Integration
- Native Farcaster Mini App experience
- QuickAuth for Farcaster identity verification
- Seamless wallet connection via OnchainKit
- Direct sharing to Farcaster casts

## 🔐 Technical Innovation

### Smart Contract (`POV.sol`)
- **One Voice Per Wallet**: Enforced at the contract level
- **Audio Size Limit**: 20KB maximum to ensure efficient on-chain storage
- **Humanity Score Gate**: Minimum 60% required to prevent bot mints
- **Mint Fee**: 0.001 ETH to prevent spam
- **Token URI**: Dynamic SVG generation with base64 encoding

### Voice Analysis Algorithm
The app uses sophisticated audio analysis to verify human speech:
- **Breath Sound Detection**: Identifies natural breathing patterns
- **Speech Variability**: Measures natural variation in speech
- **Energy Distribution**: Analyzes frequency distribution patterns
- **Background Noise Analysis**: Detects authentic recording environment
- **Silence Ratio**: Calculates natural pauses in speech

### On-Chain Storage
- Audio data compressed and stored as hex in the smart contract
- SVG artwork generated dynamically from voice metadata
- All data permanently stored on Base L2 blockchain

## 🎯 Use Cases

- **Digital Identity**: Prove your humanity in Web3 spaces
- **Memorialization**: Preserve meaningful words and moments
- **Artistic Expression**: Create unique audio art NFTs
- **Community Building**: Share voices and build connections on Farcaster
- **Historical Archive**: Contribute to a permanent record of human voices

## 🚀 Built With

- **Next.js** - React framework
- **OnchainKit** - Base MiniKit integration
- **Wagmi** - Ethereum React hooks
- **Tailwind CSS** - Styling
- **Solidity** - Smart contract development
- **Base L2** - Ethereum Layer 2 blockchain
- **Farcaster** - Decentralized social network

## 📜 License

MIT License - See LICENSE file for details

---

**Your voice, immortalized on-chain. Forever.**
