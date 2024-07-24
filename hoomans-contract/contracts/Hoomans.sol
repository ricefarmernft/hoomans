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
    bytes32 public ohayoMerkleRoot;
    bytes32 public chimkenMerkleRoot;

    mapping(address => uint256) public ohayoMintedCount;
    mapping(address => uint256) public chimkenlistMintedCount;
    mapping(address => uint256) public publicMintedCount;

    // Contract Variables
    string private revealedBaseURI;
    string private unrevealedURI;
    uint256 public wlMintPrice = 6900000000000000; //0.0069 ETH mint price
    uint256 public publicMintPrice = 8800000000000000; //0.0088 ETH mint price for whitelist
    uint256 public MAX_OHAYO_MINT = 3; // Whitelist max mint number
    uint256 public constant MAX_OHAYO_SUPPLY = 300; // Ohayo max mint supply
    uint256 public totalOhayoMinted = 0; // Total number of Ohayo NFTs minted so far
    uint256 public constant MAX_WHITELIST_MINT = 2; // Whitelist max mint number
    uint256 public constant MAX_PUBLIC_MINT = 3; // Public max mint number
    uint256 public constant MAX_SUPPLY = 999; // Maximum number of NFTs
    uint256 public constant WHITELIST_SALE_SUPPLY = 999; // Number of NFTs available in whitelist sale
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
        bytes32 ohayoMerkleRoot_,
        bytes32 chimkenMerkleRoot_,
        address initialOwner
    ) ERC721("Hoomans", "HOOMANS") Ownable(initialOwner) {
        unrevealedURI = "https://arweave.net/NwvwWUZxrQl8KRofnG3Tq9WAV4UJC0ylFKv9iGWUtYk/"; // Default URI
        _setOhayoMerkleRoot(ohayoMerkleRoot_);
        _setChimkenMerkleRoot(chimkenMerkleRoot_);
    }

    // Check if address is whitelisted
    function checkIsWhitelisted(
        bytes32[] calldata _merkleProof
    ) public view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));

        // Check against the first group's Merkle Root
        if (MerkleProof.verify(_merkleProof, ohayoMerkleRoot, leaf)) {
            return true;
        }

        // Check against the second group's Merkle Root
        if (MerkleProof.verify(_merkleProof, chimkenMerkleRoot, leaf)) {
            return true;
        }

        // Address is not whitelisted in either group
        return false;
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
            maxTokens = MAX_OHAYO_MINT;
        } else if (group == 2) {
            maxTokens = MAX_WHITELIST_MINT;
        }

        require(
            numTokens > 0 && numTokens <= maxTokens,
            "Cannot mint more than allowed"
        );

        // Find Leaf
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        bytes32 merkleRoot = group == 1 ? ohayoMerkleRoot : chimkenMerkleRoot;

        require(
            MerkleProof.verify(_merkleProof, merkleRoot, leaf),
            group == 1
                ? "Invalid Address: Ohayo WL Group"
                : "Invalid Address: Chimkenlist Group"
        );

        // Ensure not exceeding mint limit per group
        if (group == 1) {
            require(
                ohayoMintedCount[msg.sender] + numTokens <= MAX_OHAYO_MINT,
                "Exceeds Ohayo WL limit"
            );
            require(
                totalOhayoMinted + numTokens <= MAX_OHAYO_SUPPLY,
                "Exceeds Ohayo max supply"
            );
        } else if (group == 2) {
            require(
                chimkenlistMintedCount[msg.sender] + numTokens <=
                    MAX_WHITELIST_MINT,
                "Exceeds Chimken WL limit"
            );
        }

        // Calculate token cost
        uint256 cost = calculateCost(numTokens);
        require(msg.value == cost, "Incorrect ETH value sent");

        // Mint tokens
        mintTokens(msg.sender, numTokens, MintType.Whitelist);

        // Update minted count
        if (group == 1) {
            ohayoMintedCount[msg.sender] += numTokens;
            totalOhayoMinted += numTokens;
        } else if (group == 2) {
            chimkenlistMintedCount[msg.sender] += numTokens;
        }
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
            uint256 newTokenId = totalMinted + 1;

            _mint(to, newTokenId);

            totalMinted++;
            emit Airdrop(to, newTokenId);
        }
    }

    // Public Mint
    function publicMint(
        uint256 numTokens
    ) public payable nonReentrant whenNotPaused {
        require(publicOpen, "Public sale is not open");
        require(numTokens > 0, "Must mint at least one token");
        require(totalMinted + numTokens <= MAX_SUPPLY, "Exceeds max supply");
        require(
            publicMintedCount[msg.sender] + numTokens <= MAX_PUBLIC_MINT,
            "Max 3 NFTs per address in public mint"
        );
        require(
            msg.value == publicMintPrice * numTokens,
            "Incorrect ETH value sent"
        );

        mintTokens(msg.sender, numTokens, MintType.Public);

        // Update public minted count
        publicMintedCount[msg.sender] += numTokens;
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
            "Owner can only mint up to 10 tokens at a time"
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
            uint256 newTokenId = totalMinted + 1;

            _mint(to, newTokenId);

            totalMinted++;
            emit OwnerMintedToFriends(to, newTokenId);
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

    // Pause Function
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

    // Internal Functions
    function _setOhayoMerkleRoot(bytes32 ohayoMerkleRoot_) internal onlyOwner {
        ohayoMerkleRoot = ohayoMerkleRoot_;
    }

    function _setChimkenMerkleRoot(
        bytes32 chimkenMerkleRoot_
    ) internal onlyOwner {
        chimkenMerkleRoot = chimkenMerkleRoot_;
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
        Owner
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

    function setOhayoMerkleRoot(bytes32 ohayoMerkleRoot_) external onlyOwner {
        _setOhayoMerkleRoot(ohayoMerkleRoot_);
    }

    function setChimkenMerkleRoot(
        bytes32 chimkenMerkleRoot_
    ) external onlyOwner {
        _setChimkenMerkleRoot(chimkenMerkleRoot_);
    }

    function setMaxOhayoMint(uint256 newMaxOhayoMint) external onlyOwner {
        MAX_OHAYO_MINT = newMaxOhayoMint;
    }

    // Fallback Functions
    fallback() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }

    receive() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }
}
