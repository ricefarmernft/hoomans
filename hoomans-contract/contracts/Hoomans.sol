// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/*
    %+*                 :.+                                     
    #..=               -...*                                    
    *.=.-%            *..=.=%                                   
    +.==.-%          #..=-..*                                   
    +.=-:.:%  %%%%%%%...=-..+                                   
    +.:-=:.............=--..:%                                  
    *..=................=-...*                                  
    *.:..................:...+                                  
   %+........................-%                                 
   %-.........................#                                 
   %..........................-%                                
  %:....+==+.....:#=++.........=%                               
 #..............................=%        %#-..+%               
%#:...=....-==-..................=      ..........:*%%          
%*....:#...*##*.......#*........:%     #..............*         
 #*.....+...........-=..........:+      =...............#       
  #---::..+-.....-=..........:--+%        %:.............=      
   %=-------------.......---*=-%-%          :.............=     
   %#+*==---------------+#*+**:...%         +..............#    
   #..-*++*--=--+%##%#+++*#........#       %*..............*##  
  %=...---+%*=++++++*+=-............#      *...............*--# 
  %:...---------------:..............%    %:..............:---=%
  %:....:-----------..................%  %................-----#
  %*.......-----:.....................*%+................:-----#
   %...................................-=+..............:------%
   %*.....................................=-..:::.:--:.-------*#
    #.:....................................:*------------------#
    #..:.....................................*----------------=%
    %-..-........................-...........-+--------------=% 
    %+...+:...........*..........-.....-:.....#-------------+   
     #...:=---:......-=..........=:.-:........*=-----------#%%  
     %....:+-----------.........----..........+=-----------=#   
     %-.....=*=--------=........=--...........+=--------=*%     
      #.......*==------+........+=............#-----=*%%        
      %.......*--==----#.......-==...........=%                 
       -......*--------#.......=-=-..........%                  
       %......+--------*.......+-=-----:....#                   
       *......+=-------#......+-=++-------:*%                   
       -.......*------%.......++-----------%                    
       *==+**#*++**####*:.-:-#########%%%%%                     

*/

contract Hoomans is ERC721, Ownable, ReentrancyGuard {
    // Merkle Root Variables
    bytes32 public guaranteedMerkleRoot;
    bytes32 public fcfsMerkleRoot;

    // Contract Variables
    string private revealedBaseURI;
    string private unrevealedURI;

    uint256 public wlMintPrice = 6900000000000000; //0.0069 ETH mint price
    uint256 public publicMintPrice = 6900000000000000; //0.0088 ETH mint price for whitelist

    uint256 public constant MAX_GUARANTEED_MINT = 2; // Whitelist max mint number
    uint256 public constant MAX_FCFS_MINT = 2; // Whitelist max mint number
    uint256 public constant MAX_SUPPLY = 1999; // Maximum number of NFTs
    uint256 public constant WHITELIST_SALE_SUPPLY = 1999; // Number of NFTs available in whitelist sale

    uint256 public totalMinted = 0; // Total number of NFTs minted so far

    // State Variables
    bool public isPaused = false;
    bool public revealed = false;
    bool public whitelistOpen = false;
    bool public publicOpen = false;

    // Events
    event WhitelistMinted(address indexed to, uint256 tokenId);
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
        bytes32 guaranteedMerkleRoot_,
        bytes32 fcfsMerkleRoot_,
        address initialOwner
    ) ERC721("Hoomans", "HOOMANS") Ownable(initialOwner) {
        unrevealedURI = "https://arweave.net/NwvwWUZxrQl8KRofnG3Tq9WAV4UJC0ylFKv9iGWUtYk/"; // Default URI
        guaranteedMerkleRoot = guaranteedMerkleRoot_;
        fcfsMerkleRoot = fcfsMerkleRoot_;
    }

    // Check if address is whitelisted
    function checkIsWhitelisted(
        bytes32[] calldata _merkleProof
    ) public view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));

        // Check against the first group's Merkle Root
        if (MerkleProof.verify(_merkleProof, guaranteedMerkleRoot, leaf)) {
            return true;
        }

        // Check against the second group's Merkle Root
        if (MerkleProof.verify(_merkleProof, fcfsMerkleRoot, leaf)) {
            return true;
        }

        // Address is not whitelisted in either group
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
        uint256 numTokens,
        uint256 group
    ) public payable nonReentrant whenNotPaused {
        require(whitelistOpen, "Whitelist sale is not open");
        require(group == 1 || group == 2, "Invalid group specified");
        require(totalMinted + numTokens <= MAX_SUPPLY, "Exceeds max supply");

        // Define max tokens per group
        uint256 maxTokens;
        if (group == 1) {
            maxTokens = MAX_GUARANTEED_MINT;
        } else if (group == 2) {
            maxTokens = MAX_FCFS_MINT;
        }

        require(
            numTokens > 0 && numTokens <= maxTokens,
            "Cannot mint more than allowed"
        );

        // Find Leaf
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        bytes32 merkleRoot = group == 1 ? guaranteedMerkleRoot : fcfsMerkleRoot;

        require(
            MerkleProof.verify(_merkleProof, merkleRoot, leaf),
            group == 1
                ? "Invalid Address: Guaranteed Group"
                : "Invalid Address: FCFS Group"
        );

        // Calculate token cost
        uint256 cost = calculateCost(numTokens);
        require(msg.value == cost, "Incorrect ETH value sent");

        // Mint tokens
        mintTokens(msg.sender, numTokens, MintType.Whitelist);
    }

    // Public Mint
    function publicMint(
        uint256 numTokens
    ) public payable nonReentrant whenNotPaused {
        require(publicOpen, "Public sale is not open");
        require(numTokens > 0, "Must mint at least one token");
        require(totalMinted + numTokens <= MAX_SUPPLY, "Exceeds max supply");
        require(
            msg.value == publicMintPrice * numTokens,
            "Incorrect ETH value sent"
        );

        mintTokens(msg.sender, numTokens, MintType.Public);
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

    // Owner Mint to Multiple Addresses
    function ownerMintToFriends(
        address[] calldata toAddresses
    ) public onlyOwner whenNotPaused {
        require(
            totalMinted + toAddresses.length <= MAX_SUPPLY,
            "Minting would exceed max supply"
        );

        for (uint256 i = 0; i < toAddresses.length; i++) {
            address to = toAddresses[i];

            mintTokens(to, 1, MintType.OwnerToFriends);
        }
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

    function startPublicSale() external onlyOwner {
        publicOpen = true;
    }

    function stopWhitelistSale() external onlyOwner {
        whitelistOpen = false;
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
        Owner,
        OwnerToFriends,
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
            } else if (mintType == MintType.Owner) {
                emit OwnerMinted(to, newTokenId);
            } else if (mintType == MintType.OwnerToFriends) {
                emit OwnerMintedToFriends(to, newTokenId);
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

    function setGuaranteed(bytes32 guaranteedMerkleRoot_) external onlyOwner {
        guaranteedMerkleRoot = guaranteedMerkleRoot_;
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
