// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract ProofOfVoice is ERC721, Ownable {
    using Strings for uint256;

    struct VoiceData {
        bytes audioData;           // Compressed audio bytes
        string word;               // Spoken word
        string category;           // Category (cypherpunk, freedom, etc.)
        string emotion;            // Emotion used
        uint8 humanityScore;       // 0-100 verification score
        uint256 timestamp;         // Mint timestamp
        uint16[] waveform;         // Waveform data for visualization
    }

    // Storage
    uint256 private _tokenIds;
    mapping(uint256 => VoiceData) public voices;
    mapping(address => bool) public hasMinted;
    mapping(string => uint256) public categoryCount;
    
    // Events
    event VoiceMinted(
        uint256 indexed tokenId,
        address indexed minter,
        string word,
        string category,
        uint8 humanityScore
    );

    // Constants
    uint256 public constant MINT_FEE = 0.001 ether;
    uint8 public constant MIN_HUMANITY_SCORE = 60;
    uint256 public constant MAX_AUDIO_SIZE = 20480; // 20KB max

    constructor() ERC721("ProofOfVoice", "POV") Ownable(msg.sender) {}

    /**
     * @dev Mint a new voice NFT
     * @param audioData Compressed audio bytes
     * @param word The spoken word
     * @param category Category of the word
     * @param emotion Emotion used while speaking
     * @param humanityScore Verification score (0-100)
     * @param waveform Waveform data for visualization
     */
    function mintVoice(
        bytes calldata audioData,
        string calldata word,
        string calldata category,
        string calldata emotion,
        uint8 humanityScore,
        uint16[] calldata waveform
    ) external payable returns (uint256) {
        require(!hasMinted[msg.sender], "Already minted");
        require(msg.value == MINT_FEE, "Incorrect fee");
        require(humanityScore >= MIN_HUMANITY_SCORE, "Score too low");
        require(audioData.length <= MAX_AUDIO_SIZE, "Audio too large");
        require(audioData.length > 0, "No audio data");
        require(bytes(word).length > 0, "No word provided");

        _tokenIds++;
        uint256 newTokenId = _tokenIds;

        voices[newTokenId] = VoiceData({
            audioData: audioData,
            word: word,
            category: category,
            emotion: emotion,
            humanityScore: humanityScore,
            timestamp: block.timestamp,
            waveform: waveform
        });

        hasMinted[msg.sender] = true;
        categoryCount[category]++;

        _safeMint(msg.sender, newTokenId);

        emit VoiceMinted(newTokenId, msg.sender, word, category, humanityScore);

        return newTokenId;
    }

    /**
     * @dev Generate on-chain metadata (JSON)
     */
    function tokenURI(uint256 tokenId) 
        public 
        view 
        override 
        returns (string memory) 
    {
        require(_ownerOf(tokenId) != address(0), "Token doesn't exist");

        VoiceData memory voice = voices[tokenId];

        // Generate SVG for the NFT
        string memory svg = generateSVG(tokenId, voice);
        string memory svgBase64 = Base64.encode(bytes(svg));

        // Build JSON metadata
        string memory json = string(
            abi.encodePacked(
                '{"name": "Proof of Voice #',
                tokenId.toString(),
                '",',
                '"description": "An immutable voice recording proving human existence in 2025. Word: ',
                voice.word,
                ', Humanity Score: ',
                uint256(voice.humanityScore).toString(),
                '%",',
                '"image": "data:image/svg+xml;base64,',
                svgBase64,
                '",',
                '"attributes": [',
                '{"trait_type": "Word", "value": "',
                voice.word,
                '"},',
                '{"trait_type": "Category", "value": "',
                voice.category,
                '"},',
                '{"trait_type": "Emotion", "value": "',
                voice.emotion,
                '"},',
                '{"trait_type": "Humanity Score", "value": ',
                uint256(voice.humanityScore).toString(),
                '},',
                '{"trait_type": "Timestamp", "value": ',
                voice.timestamp.toString(),
                '}',
                ']',
                '}'
            )
        );

        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(bytes(json))
            )
        );
    }

    /**
     * @dev Generate SVG image for the NFT
     */
    function generateSVG(uint256 tokenId, VoiceData memory voice) 
        internal 
        pure 
        returns (string memory) 
    {
        // Get category colors
        (string memory color1, string memory color2) = getCategoryColors(voice.category);
        
        // Generate waveform path
        string memory waveformPath = generateWaveformPath(voice.waveform);

        return string(
            abi.encodePacked(
                '<svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">',
                '<defs>',
                '<linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">',
                '<stop offset="0%" style="stop-color:',
                color1,
                ';stop-opacity:1" />',
                '<stop offset="100%" style="stop-color:',
                color2,
                ';stop-opacity:1" />',
                '</linearGradient>',
                '</defs>',
                '<rect width="500" height="500" fill="url(#grad)"/>',
                '<text x="250" y="60" font-family="Arial" font-size="14" fill="white" text-anchor="middle" opacity="0.6">',
                unicode"✦ PROOF OF VOICE ✦",
                '</text>',
                '<text x="250" y="120" font-family="Arial" font-size="48" font-weight="bold" fill="white" text-anchor="middle">',
                voice.word,
                '</text>',
                waveformPath,
                '<text x="250" y="400" font-family="Arial" font-size="16" fill="white" text-anchor="middle" opacity="0.8">',
                voice.category,
                unicode' • ',
                voice.emotion,
                '</text>',
                '<text x="250" y="430" font-family="Arial" font-size="18" font-weight="bold" fill="white" text-anchor="middle">',
                'Humanity: ',
                uint256(voice.humanityScore).toString(),
                '%',
                '</text>',
                '<text x="250" y="460" font-family="Arial" font-size="12" fill="white" text-anchor="middle" opacity="0.5">',
                'Token #',
                tokenId.toString(),
                unicode' • Stored on Base L2',
                '</text>',
                '</svg>'
            )
        );
    }

    /**
     * @dev Generate waveform path for SVG
     */
    function generateWaveformPath(uint16[] memory waveform) 
        internal 
        pure 
        returns (string memory) 
    {
        if (waveform.length == 0) return "";

        uint256 centerY = 250;
        uint256 barWidth = 6;
        uint256 spacing = 2;
        uint256 startX = 50;

        string memory paths = "";

        for (uint256 i = 0; i < waveform.length && i < 50; i++) {
            uint256 height = (uint256(waveform[i]) * 80) / 1000; // Scale to max 80px
            if (height < 10) height = 10; // Minimum height
            
            uint256 x = startX + (i * (barWidth + spacing));
            uint256 y = centerY - (height / 2);

            paths = string(
                abi.encodePacked(
                    paths,
                    '<rect x="',
                    x.toString(),
                    '" y="',
                    y.toString(),
                    '" width="',
                    barWidth.toString(),
                    '" height="',
                    height.toString(),
                    '" fill="white" opacity="0.9" rx="3"/>'
                )
            );
        }

        return paths;
    }

    /**
     * @dev Get category colors for gradient
     */
    function getCategoryColors(string memory category) 
        internal 
        pure 
        returns (string memory, string memory) 
    {
        bytes32 hash = keccak256(bytes(category));
        
        if (hash == keccak256("cypherpunk")) return ("#6366f1", "#7c3aed");
        if (hash == keccak256("freedom")) return ("#f59e0b", "#ef4444");
        if (hash == keccak256("empathy")) return ("#ec4899", "#f472b6");
        if (hash == keccak256("heroes")) return ("#94a3b8", "#cbd5e1");
        if (hash == keccak256("history")) return ("#d97706", "#b45309");
        if (hash == keccak256("life")) return ("#10b981", "#059669");
        
        return ("#6366f1", "#7c3aed"); // Default
    }

    /**
     * @dev Get voice audio data
     */
    function getVoiceAudio(uint256 tokenId) 
        external 
        view 
        returns (bytes memory) 
    {
        require(_ownerOf(tokenId) != address(0), "Token doesn't exist");
        return voices[tokenId].audioData;
    }

    /**
     * @dev Get total supply
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIds;
    }

    /**
     * @dev Withdraw contract balance
     */
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}