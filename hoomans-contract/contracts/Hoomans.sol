// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Hoomans is ERC721, Ownable, ReentrancyGuard {
    // Merkle Root Variables
    bytes32 public wlMerkleRoot;
    bytes32 public fcfsMerkleRoot;

    mapping(address => uint256) public wlMintedCount;
    mapping(address => uint256) public fcfsMintedCount;
    mapping(address => uint256) public publicMintedCount;

    // Contract Variables
    string private revealedBaseURI;
    string private unrevealedURI;

    uint256 public wlMintPrice = 4200000000000000; //0.0042 ETH mint price
    uint256 public publicMintPrice = 5000000000000000; //0.005 ETH mint price for whitelist

    uint256 public constant MAX_WL_MINT = 5; // Whitelist max mint number
    uint256 public constant MAX_FCFS_MINT = 10; // FCFS max mint number
    uint256 public constant MAX_PUBLIC_MINT = 10; // Public max mint number
    uint256 public constant MAX_SUPPLY = 2000; // Maximum number of NFTs

    uint256 public wlMinted = 0; // Total number of WL NFTs minted so far
    uint256 public fcfsMinted = 0; // Total number of FCFS NFTs minted so far
    uint256 public publicMinted = 0; // Total number of Public NFTs minted so far
    uint256 public totalMinted = 0; // Total number of NFTs minted so far

    // State Variables
    bool public isPaused = false;
    bool public revealed = false;
    bool public whitelistOpen = false;
    bool public fcfsOpen = false;
    bool public publicOpen = false;

    // Events
    event WhitelistMinted(address indexed to, uint256 tokenId);
    event FcfsMinted(address indexed to, uint256 tokenId);
    event PublicMinted(address indexed to, uint256 tokenId);
    event OwnerMinted(address indexed to, uint256 tokenId);
    event OwnerMintedToFriends(address indexed to, uint256 tokenId);
    event Airdrop(address indexed to, uint256 tokenId);

    event Withdrawn(uint256 amount, address withdrawnTo);
    event BaseURIUpdated(string newBaseURI, address updatedBy);
    event CollectionRevealed(string newBaseURI);
    event EtherReceived(address sender, uint amount);

    // Constructor
    constructor(
        bytes32 wlMerkleRoot_,
        bytes32 fcfsMerkleRoot_,
        address initialOwner
    ) ERC721("Hoomans", "HOOMANS") Ownable(initialOwner) {
        unrevealedURI = "https://arweave.net/NwvwWUZxrQl8KRofnG3Tq9WAV4UJC0ylFKv9iGWUtYk/"; // Default URI
        wlMerkleRoot = wlMerkleRoot_;
        fcfsMerkleRoot = fcfsMerkleRoot_;
    }

    // Check if address is whitelisted
    function checkIsWhitelisted(
        bytes32[] calldata _merkleProof
    ) public view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));

        // Check against the WL Merkle Root
        if (MerkleProof.verify(_merkleProof, wlMerkleRoot, leaf)) {
            return true;
        }

        // Address is not whitelisted
        return false;
    }

    // Check if address is FCFS
    function checkIsFcfs(
        bytes32[] calldata _merkleProof
    ) public view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));

        // Check against the FCFS Merkle Root
        if (MerkleProof.verify(_merkleProof, fcfsMerkleRoot, leaf)) {
            return true;
        }

        // Address is not FCFS
        return false;
    }

    // Airdrop NFTs to Whitelisted Addresses
    function airdrop(
        address[] calldata toAddresses
    ) public onlyOwner whenNotPaused {
        require(
            totalMinted + toAddresses.length <= MAX_SUPPLY,
            "Minting would exceed max supply"
        );

        for (uint256 i = 0; i < toAddresses.length; i++) {
            address to = toAddresses[i];

            mintTokens(to, 1, MintType.Airdrop);
        }
    }

    // Whitelist Mint
    function whitelistMint(
        bytes32[] calldata _merkleProof,
        uint256 numTokens
    ) public payable nonReentrant whenNotPaused {
        require(whitelistOpen, "Whitelist sale is not open");
        require(totalMinted + numTokens <= MAX_SUPPLY, "Exceeds max supply");
        require(
            numTokens > 0 && numTokens <= MAX_WL_MINT,
            "Cannot mint more than allowed"
        );
        require(
            wlMintedCount[msg.sender] + numTokens <= MAX_WL_MINT,
            "Exceeds WL limit"
        );

        // Find Leaf
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        bytes32 merkleRoot = wlMerkleRoot;

        require(
            MerkleProof.verify(_merkleProof, merkleRoot, leaf),
            "Invalid Address: WL Group"
        );

        // Calculate token cost
        uint256 cost = calculateCost(numTokens);
        require(msg.value == cost, "Incorrect ETH value sent");

        // Mint tokens
        mintTokens(msg.sender, numTokens, MintType.Whitelist);

        // Add WL token count
        wlMintedCount[msg.sender] += numTokens;
        wlMinted += numTokens;
    }

    // FCFS Mint
    function fcfsMint(
        bytes32[] calldata _merkleProof,
        uint256 numTokens
    ) public payable nonReentrant whenNotPaused {
        require(fcfsOpen, "FCFS sale is not open");
        require(totalMinted + numTokens <= MAX_SUPPLY, "Exceeds max supply");
        require(
            numTokens > 0 && numTokens <= MAX_FCFS_MINT,
            "Cannot mint more than allowed"
        );
        require(
            fcfsMintedCount[msg.sender] + numTokens <= MAX_FCFS_MINT,
            "Exceeds FCFS limit"
        );

        // Find Leaf
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        bytes32 merkleRoot = fcfsMerkleRoot;

        require(
            MerkleProof.verify(_merkleProof, merkleRoot, leaf),
            "Invalid Address: FCFS Group"
        );

        // Calculate token cost
        uint256 cost = calculateCost(numTokens);
        require(msg.value == cost, "Incorrect ETH value sent");

        // Mint tokens
        mintTokens(msg.sender, numTokens, MintType.Fcfs);

        // Add FCFS token count
        fcfsMintedCount[msg.sender] += numTokens;
        fcfsMinted += numTokens;
    }

    // Public Mint
    function publicMint(
        uint256 numTokens
    ) public payable nonReentrant whenNotPaused {
        require(publicOpen, "Public sale is not open");
        require(numTokens > 0, "Must mint at least one token");
        require(totalMinted + numTokens <= MAX_SUPPLY, "Exceeds max supply");
        require(
            numTokens > 0 && numTokens <= MAX_PUBLIC_MINT,
            "Cannot mint more than allowed"
        );
        require(
            publicMintedCount[msg.sender] + numTokens <= MAX_PUBLIC_MINT,
            "Exceeds public mint limit"
        );
        require(
            msg.value == publicMintPrice * numTokens,
            "Incorrect ETH value sent"
        );

        // Mint Tokens
        mintTokens(msg.sender, numTokens, MintType.Public);

        // Add Public token count
        publicMintedCount[msg.sender] += numTokens;
        publicMinted += numTokens;
    }

    // Owner Mint
    function ownerMint(
        address to,
        uint256 numTokens
    ) public onlyOwner whenNotPaused {
        require(
            totalMinted + numTokens <= MAX_SUPPLY,
            "Minting would exceed max supply"
        );
        require(numTokens > 0, "Must mint at least one token");
        require(
            numTokens <= 20,
            "Owner can only mint up to 20 tokens at a time"
        );

        mintTokens(to, numTokens, MintType.Owner);
    }

    // Withdraw Function
    function withdraw(
        address payable withdrawalAddress,
        uint256 amount
    ) external onlyOwner nonReentrant {
        require(withdrawalAddress != address(0), "Invalid withdrawal address");
        require(amount > 0, "Amount must be greater than 0");
        require(
            address(this).balance >= amount,
            "Insufficient contract balance"
        );

        (bool sent, ) = withdrawalAddress.call{value: amount}("");
        require(sent, "Failed to send Ether");
        emit Withdrawn(amount, withdrawalAddress);
    }

    //Reveal NFTs
    function reveal(string memory _newBaseURI) external onlyOwner {
        revealed = true;
        revealedBaseURI = _newBaseURI;
        emit CollectionRevealed(_newBaseURI);
    }

    // Sale State Functions
    function startWhitelistSale() external onlyOwner {
        whitelistOpen = true;
    }

    function startFcfsSale() external onlyOwner {
        fcfsOpen = true;
    }

    function startPublicSale() external onlyOwner {
        publicOpen = true;
    }

    function stopWhitelistSale() external onlyOwner {
        whitelistOpen = false;
    }

    function stopFcfsSale() external onlyOwner {
        fcfsOpen = false;
    }

    function stopPublicSale() external onlyOwner {
        publicOpen = false;
    }

    // Pause Functions
    modifier whenNotPaused() {
        require(!isPaused, "Contract is paused");
        _;
    }

    function pause() external onlyOwner {
        isPaused = true;
    }

    function unpause() external onlyOwner {
        isPaused = false;
    }

    // Override Functions
    function tokenURI(
        uint256 tokenId
    ) public view virtual override returns (string memory) {
        _requireOwned(tokenId);
        string memory baseURI = revealed ? revealedBaseURI : unrevealedURI;

        return
            bytes(baseURI).length > 0
                ? string(
                    abi.encodePacked(
                        baseURI,
                        Strings.toString(tokenId),
                        ".json"
                    )
                )
                : "";
    }

    // Calculate cost
    function calculateCost(uint256 numTokens) private view returns (uint256) {
        uint256 cost = 0;
        cost = numTokens * wlMintPrice;
        return cost;
    }

    // Mint tokens
    enum MintType {
        Public,
        Whitelist,
        Fcfs,
        Owner,
        Airdrop
    }

    function mintTokens(
        address to,
        uint256 numTokens,
        MintType mintType
    ) private {
        for (uint256 i = 0; i < numTokens; i++) {
            uint256 newTokenId = totalMinted + 1;
            _mint(to, newTokenId);
            totalMinted++;
            if (mintType == MintType.Public) {
                emit PublicMinted(to, newTokenId);
            } else if (mintType == MintType.Whitelist) {
                emit WhitelistMinted(to, newTokenId);
            } else if (mintType == MintType.Fcfs) {
                emit FcfsMinted(to, newTokenId);
            } else if (mintType == MintType.Owner) {
                emit OwnerMinted(to, newTokenId);
            } else if (mintType == MintType.Airdrop) {
                emit Airdrop(to, newTokenId);
            }
        }
    }

    // Setter Functions
    function setRevealedBaseURI(string memory newBaseURI) external onlyOwner {
        revealedBaseURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI, msg.sender);
    }

    function setWlMintPrice(uint256 newWlMintPrice) external onlyOwner {
        wlMintPrice = newWlMintPrice;
    }

    function setPublicMintPrice(uint256 newPublicMintPrice) external onlyOwner {
        publicMintPrice = newPublicMintPrice;
    }

    function setWl(bytes32 wlMerkleRoot_) external onlyOwner {
        wlMerkleRoot = wlMerkleRoot_;
    }

    function setFcfs(bytes32 fcfsMerkleRoot_) external onlyOwner {
        fcfsMerkleRoot = fcfsMerkleRoot_;
    }

    // Fallback Functions
    fallback() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }

    receive() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }
}
