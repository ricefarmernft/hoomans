const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Simplified Contract", function () {
  let Simplified, simplified;
  let owner, addr1, addr2;
  const oneEth = "1000000000000000000"; // 1 Ether in wei
  const mintPrice = "50000000000000000";
  const wlFirstMintPrice = "25000000000000000";

  beforeEach(async function () {
    // Get the ContractFactory and signers
    Simplified = await ethers.getContractFactory("Simplified");
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy with constructor arguments if necessary
    simplified = await Simplified.deploy(
      "0xfe4ee17d37bf6248654ea6a54146252d87936f9130219d78c246c4f466232c7f", // merkleRootGroup1
      "0x2d32adbfbf83c8829549c446dc63f1393e79787541ed7c1791695d0962d9e0e5", // merkleRootGroup2
      owner.address
    );
    // await simplified.deployed();
  });

  const merkleProof = [
    "0x00a139fb5fd55482ede8b0e84735f2664c32431c7440bdf43b129554b71e1ead",
    "0xe3b240c310e38c0a4a97fa6e603a15eede471cc2756112464bd21d245d757dac",
    "0xa1a2dffa5aa43a48d3f831b19b86796be148ba8a20a0b6a2c24649d2f28aa8eb",
    "0xd874d439bcfd8838de10158f0ae7d72985f62a38b9716fe1f1f08846ba7773ac",
    "0x2cdf5c6941298c8160a922acdc2fd30ff8fe77ae501e5532cb3a9e08d36759af",
    "0x50b4192219c935104c47e98f07cf55e8f2f3a2ab16e1c55fc67963e282390001",
    "0x417a7912c5fabd01d15c1ad83b8d39243a673d65e5b7d30b942c383dc45bd0b2",
    "0xb263ccbf84e30e2fbfa2eb2bf520161d830cbfc4563864fc60f31e73dd824f17",
  ];
  const merkleProof2 = [
    "0x8b6cdf98c6142312523184c296c72a6a0cabf6cf29e9aec3b3577357a8455774",
    "0x6365754ac2f7ce28ec11dff888f95991e26a52f585b38db3945fe13313d1440b",
    "0xb509618b515ab64188b76933c4dbc1a92d738b1c9d8ae5bbba51d4c246041d6b",
    "0x0ec9a22232b66ae8640d64deb1d00b31b752e171680427105191643c7ba66d99",
    "0x473585328504ae2ff6006ed0caf5d9c5f6e291476df80ffe619d283eb2d4ebd5",
    "0xe20b109db4cfa3da451bd9774c079793763f2cc543b7f31335a24222a67f0efe",
    "0xf09213132b754bcb11973e6ac39f3d2673f2312cc57d861da0392026ef32a577",
  ];

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await simplified.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    it("Should fail public minting when paused", async function () {
      await simplified.pause();
      await expect(
        simplified.connect(addr1).publicMint(1, { value: mintPrice })
      ).to.be.revertedWith("Contract is paused");
    });

    it("Should allow public minting when not paused", async function () {
      await simplified.startPublicSale();
      await expect(
        simplified.connect(addr1).publicMint(1, { value: mintPrice })
      ).to.emit(simplified, "PublicMinted");
    });

    it("Should correctly calculate cost for first whitelist mint, personal", async function () {
      // This test requires a valid merkle proof for the address
      // Assuming `merkleProof` is a valid proof for `addr1`
      await simplified.startWhitelistSale();
      await expect(
        simplified
          .connect(addr1)
          .whitelistMint(merkleProof, 1, 1, { value: wlFirstMintPrice })
      ).to.emit(simplified, "WhitelistMinted");
      await expect(
        simplified
          .connect(addr1)
          .whitelistMint(merkleProof, 1, 1, { value: mintPrice })
      ).to.emit(simplified, "WhitelistMinted");
      // Additional checks can be performed here, such as verifying the balance
    });
    it("Should correctly calculate cost for two whitelist mint, personal", async function () {
      // This test requires a valid merkle proof for the address
      // Assuming `merkleProof` is a valid proof for `addr1`
      await simplified.startWhitelistSale();
      await expect(
        simplified.connect(addr1).whitelistMint(merkleProof, 2, 1, {
          value: ethers.parseEther("0.075"),
        })
      ).to.emit(simplified, "WhitelistMinted");
      // Additional checks can be performed here, such as verifying the balance
    });

    it("Should correctly calculate cost for first whitelist mint, collab/giveaway", async function () {
      // This test requires a valid merkle proof for the address
      // Assuming `merkleProof` is a valid proof for `addr1`
      await simplified.startWhitelistSale();
      await expect(
        simplified.connect(addr2).whitelistMint(merkleProof2, 2, 2, {
          value: (mintPrice * 2).toString(),
        })
      ).to.emit(simplified, "WhitelistMinted");
      // Additional checks can be performed here, such as verifying the balance
    });

    it("Should fail whitelist minting when paused", async function () {
      await simplified.pause();
      await expect(
        simplified
          .connect(addr1)
          .whitelistMint(merkleProof, 1, 1, { value: wlFirstMintPrice })
      ).to.be.revertedWith("Contract is paused");
    });

    it("Should allow whitelist minting when not paused", async function () {
      await simplified.startWhitelistSale();
      await expect(
        simplified
          .connect(addr1)
          .whitelistMint(merkleProof, 1, 1, { value: wlFirstMintPrice })
      ).to.emit(simplified, "WhitelistMinted");
    });

    it("Should fail public minting when not open", async function () {
      await simplified.stopPublicSale();
      await expect(
        simplified.connect(addr1).publicMint(1, { value: mintPrice })
      ).to.be.revertedWith("Public sale is not open");
    });

    it("Should fail whitelist minting when not open", async function () {
      await simplified.stopWhitelistSale();
      await expect(
        simplified
          .connect(addr1)
          .whitelistMint(merkleProof, 1, 1, { value: wlFirstMintPrice })
      ).to.be.revertedWith("Whitelist sale is not open");
    });

    it("Should fail public minting when minting 3 or more", async function () {
      await simplified.startPublicSale();
      await expect(
        simplified.connect(addr1).publicMint(3, { value: mintPrice })
      ).to.be.revertedWith("Cannot mint more than 2 tokens");
    });

    it("Should fail whitelist minting when minting 3 or more", async function () {
      await simplified.startWhitelistSale();
      await expect(
        simplified
          .connect(addr1)
          .whitelistMint(merkleProof, 3, 1, { value: wlFirstMintPrice })
      ).to.be.revertedWith("Cannot mint more than 2 tokens for WL");
    });

    it("Should fail public minting when minting 0", async function () {
      await simplified.startPublicSale();
      await expect(
        simplified.connect(addr1).publicMint(0, { value: mintPrice })
      ).to.be.revertedWith("Must mint at least one token");
    });

    it("Should fail whitelist minting when minting 0", async function () {
      await simplified.startWhitelistSale();
      await expect(
        simplified
          .connect(addr1)
          .whitelistMint(merkleProof, 0, 1, { value: wlFirstMintPrice })
      ).to.be.revertedWith("Can mint 1 to 2 tokens");
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to start sales", async function () {
      await expect(
        simplified.connect(addr1).startPublicSale()
      ).to.be.revertedWithCustomError(simplified, "OwnableUnauthorizedAccount");
    });

    it("Should only allow owner to stop sales", async function () {
      await expect(
        simplified.connect(addr1).stopPublicSale()
      ).to.be.revertedWithCustomError(simplified, "OwnableUnauthorizedAccount");
    });

    it("Owner can start and stop sales", async function () {
      await simplified.startPublicSale();
      expect(await simplified.publicOpen()).to.equal(true);
      await simplified.stopPublicSale();
      expect(await simplified.publicOpen()).to.equal(false);
    });
  });

  describe("Fallback", function () {
    // Additional tests can be added to cover more functionality
    it("Should correctly receive Ether and emit EtherReceived event", async function () {
      // Assuming simplified is your contract instance and it's already deployed
      const transaction = {
        to: simplified.target, // Make sure this is the contract's address
        value: oneEth, // Amount of Ether to send
      };

      // Send Ether to the contract and expect the EtherReceived event
      await expect(addr1.sendTransaction(transaction))
        .to.emit(simplified, "EtherReceived")
        .withArgs(addr1.address, oneEth);
    });

    it("Should correctly handle fallback calls and emit EtherReceived event", async function () {
      // The data field is non-empty and doesn't match any function selector
      const txData = {
        to: simplified.target,
        value: oneEth,
        data: "0x1234",
      };

      // Check if the EtherReceived event was emitted
      await expect(addr1.sendTransaction(txData))
        .to.emit(simplified, "EtherReceived")
        .withArgs(addr1.address, oneEth);
    });
  });

  describe("Whitelist Check", function () {
    // Assuming you have a function to set the merkle roots if not done in the constructor
    // and a way to generate proofs for testing.
    it("Should return true for a whitelisted address with a valid Merkle proof", async function () {
      // Placeholders for demonstration; use actual values in your tests

      // Directly checking the return value of a `view` function call
      expect(
        await simplified.connect(addr1).checkIsWhitelisted(merkleProof)
      ).to.equal(true);

      expect(
        await simplified.connect(addr2).checkIsWhitelisted(merkleProof2)
      ).to.equal(true);
    });

    it("Should return false for an address not in the whitelist or with an invalid Merkle proof", async function () {
      // Simulating a call from addr2, assuming addr2 is not whitelisted
      expect(
        await simplified.connect(addr2).checkIsWhitelisted(merkleProof)
      ).to.equal(false);
    });
  });

  describe("Owner Minting", function () {
    it("Should only allow the owner to mint tokens", async function () {
      // Attempt minting by a non-owner should fail
      await expect(
        simplified.connect(addr1).ownerMint(addr1.address, 1)
      ).to.be.revertedWithCustomError(simplified, "OwnableUnauthorizedAccount");

      // Minting by the owner should succeed
      await expect(simplified.connect(owner).ownerMint(addr1.address, 1))
        .to.emit(simplified, "OwnerMinted")
        .withArgs(addr1.address, 1);
    });

    // it("Should not allow minting beyond the max supply", async function () {
    //   // Assuming MAX_SUPPLY is 600 and 600 tokens have already been minted
    //   // This setup depends on your contract's initial state and may require adjustments

    //   await expect(
    //     simplified.connect(owner).ownerMint(addr1.address, 1)
    //   ).to.be.revertedWith("Minting would exceed max supply");
    // });

    it("Should not allow minting more than 10 tokens at a time", async function () {
      await expect(
        simplified.connect(owner).ownerMint(addr1.address, 11)
      ).to.be.revertedWith("Owner can only mint up to 10 tokens at a time");
    });

    it("Should not allow minting zero tokens", async function () {
      await expect(
        simplified.connect(owner).ownerMint(addr1.address, 0)
      ).to.be.revertedWith("Must mint at least one token");
    });

    it("Should correctly mint tokens to the specified address and update total minted", async function () {
      const numTokensToMint = 5;

      // Capture the initial total minted
      const initialTotalMinted = await simplified.totalMinted();

      const numberMinted = Number(initialTotalMinted.toString());

      // Perform the mint
      await simplified.connect(owner).ownerMint(addr1.address, numTokensToMint);

      // Verify the tokens were minted to the correct address
      for (let i = 1; i <= numTokensToMint; i++) {
        const tokenId = numberMinted + i;
        expect(await simplified.ownerOf(tokenId)).to.equal(addr1.address);
      }

      // Verify total minted was updated correctly
      expect(await simplified.totalMinted()).to.equal(
        numberMinted + numTokensToMint
      );
    });
  });

  describe("Withdraw Functionality", function () {
    // Additional setup specific to the withdraw tests
    beforeEach(async function () {
      // Assume the contract can receive Ether directly or through a payable function
      // Send Ether to the contract for testing the withdraw functionality
      await owner.sendTransaction({
        to: simplified.target,
        value: oneEth, // Send 1 Ether for testing
      });
    });

    it("Should only allow the owner to withdraw", async function () {
      await expect(
        simplified.connect(addr1).withdraw(addr1.address, oneEth)
      ).to.be.revertedWithCustomError(simplified, "OwnableUnauthorizedAccount");
    });

    it("Should successfully withdraw Ether to the owner", async function () {
      const initialBalance = await ethers.provider.getBalance(owner.address);

      const tx = await simplified
        .connect(owner)
        .withdraw(owner.address, oneEth);
      const receipt = await tx.wait();
      const transactionCost = receipt.gasPrice * receipt.gasUsed;

      const finalBalance = await ethers.provider.getBalance(owner.address);
      // Ensure the final balance is increased by the withdrawal amount, accounting for gas costs
      expect(finalBalance + transactionCost - initialBalance).to.equal(oneEth);
    });

    it("Should revert if the withdrawal address is invalid", async function () {
      await expect(
        simplified
          .connect(owner)
          .withdraw("0x0000000000000000000000000000000000000000", oneEth)
      ).to.be.revertedWith("Invalid withdrawal address");
    });

    it("Should revert if the withdrawal amount exceeds contract balance", async function () {
      const excessiveAmount = "10000000000000000000"; // Assume contract balance is less than 10 Ether
      await expect(
        simplified.connect(owner).withdraw(owner.address, excessiveAmount)
      ).to.be.revertedWith("Insufficient contract balance");
    });

    it("Should revert if the withdrawal amount is zero", async function () {
      await expect(
        simplified.connect(owner).withdraw(owner.address, 0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should emit a Withdrawn event upon successful withdrawal", async function () {
      await expect(simplified.connect(owner).withdraw(owner.address, oneEth))
        .to.emit(simplified, "Withdrawn")
        .withArgs(oneEth, owner.address);
    });
  });

  describe("Reveal Functionality", function () {
    it("Should only allow the owner to reveal the collection", async function () {
      const newBaseURI = "https://example.com/api/";

      // Attempt by non-owner should fail
      await expect(
        simplified.connect(addr1).reveal(newBaseURI)
      ).to.be.revertedWithCustomError(simplified, "OwnableUnauthorizedAccount");

      // Attempt by owner should succeed
      await expect(simplified.connect(owner).reveal(newBaseURI)).not.to.be
        .reverted;
    });

    it("Should update revealed state and baseURI upon reveal", async function () {
      const newBaseURI = "https://example.com/api/";
      await simplified.connect(owner).reveal(newBaseURI);

      expect(await simplified.revealed()).to.equal(true);
      expect(await simplified.getBaseURI()).to.equal(newBaseURI);
    });

    it("Should emit CollectionRevealed event with the new base URI", async function () {
      const newBaseURI = "https://example.com/api/";
      await expect(simplified.connect(owner).reveal(newBaseURI))
        .to.emit(simplified, "CollectionRevealed")
        .withArgs(newBaseURI);
    });
  });

  describe("Owner Mint to Multiple Addresses", function () {
    const numTokens = 3; // Example number of tokens to mint

    beforeEach(async function () {
      // Additional setup if necessary, e.g., ensure contract isn't paused
    });

    it("Should only allow the owner to mint to multiple addresses", async function () {
      const toAddresses = [addr1.address, addr2.address]; // Example recipient addresses
      await expect(
        simplified.connect(addr1).ownerMintToFriends(toAddresses)
      ).to.be.revertedWithCustomError(simplified, "OwnableUnauthorizedAccount");
    });

    it("Should correctly mint tokens to multiple addresses", async function () {
      const toAddresses = [addr1.address, addr2.address, owner.address]; // Adjust as needed
      const initialTotalMinted = await simplified.totalMinted();
      const numberMinted = Number(initialTotalMinted.toString());

      // Perform the mint
      const tx = await simplified
        .connect(owner)
        .ownerMintToFriends(toAddresses);

      // Check total minted is updated correctly
      expect(await simplified.totalMinted()).to.equal(
        numberMinted + toAddresses.length
      );

      // Check each address received a token and the correct event was emitted
      await Promise.all(
        toAddresses.map(async (address, index) => {
          const tokenId = numberMinted + (index + 1);
          expect(await simplified.ownerOf(tokenId)).to.equal(address);
          await expect(tx)
            .to.emit(simplified, "OwnerMintedToFriends")
            .withArgs(address, tokenId);
        })
      );
    });

    it("Should revert if minting exceeds max supply", async function () {
      const toAddresses = new Array(601).fill(addr1.address); // Assuming MAX_SUPPLY is close to being reached
      await expect(
        simplified.connect(owner).ownerMintToFriends(toAddresses)
      ).to.be.revertedWith("Minting would exceed max supply");
    });
  });

  describe("Contract Unpause Functionality", function () {
    beforeEach(async function () {
      // Ensure the contract is paused before testing unpause
      await simplified.connect(owner).pause();
    });

    it("Should only allow the owner to unpause the contract", async function () {
      // Attempt to unpause by a non-owner, which should fail
      await expect(
        simplified.connect(addr1).unpause()
      ).to.be.revertedWithCustomError(simplified, "OwnableUnauthorizedAccount");

      // The contract should still be paused after the failed attempt
      expect(await simplified.isPaused()).to.equal(true);

      // Unpause by the owner, which should succeed
      await expect(simplified.connect(owner).unpause()).to.not.be.reverted; // Optionally check for an "Unpaused" event if applicable

      // The contract should be unpaused now
      expect(await simplified.isPaused()).to.equal(false);
    });

    it("Should successfully unpause the contract", async function () {
      // Unpause the contract
      await simplified.connect(owner).unpause();

      // Verify the contract is unpaused
      const pausedState = await simplified.isPaused();
      expect(pausedState).to.equal(false);
    });
  });

  describe("Token URI Functionality", function () {
    beforeEach(async function () {
      // Mint a token to addr1 for testing; adjust based on your contract's minting function
      await simplified.connect(owner).ownerMint(addr1.address, 1);

      // Set a base URI for testing; adjust if your contract has a different mechanism to set it
      //   await simplified
      //     .connect(owner)
      //     .setBaseURI("https://example.com/api/token/");
    });

    it("Should return the unrevealed URI for a token when not revealed", async function () {
      // Check the token URI of the first token
      expect(await simplified.tokenURI(1)).to.equal(
        "ipfs://QmbLSwALctCxoHFiXgygnThFRGwWpDsncaWPBwfMZkCUuy"
      );
    });

    it("Should revert when accessing the token URI of a non-owned or non-existent token", async function () {
      // Try to access a token URI that does not exist
      await expect(simplified.tokenURI(999)).to.be.reverted; // Adjust the error message as needed
    });

    it("Should return the correct URI for a token when revealed", async function () {
      // Set the revealed state
      await simplified.connect(owner).reveal("ipfs://reveal/"); // Toggle `revealed` to true

      // Check the token URI of the first token, assuming token ID starts at 1
      const expectedURI = "ipfs://reveal/1.json";
      expect(await simplified.tokenURI(1)).to.equal(expectedURI);
    });
  });

  describe("Set Base URI", function () {
    it("Should only allow the owner to set the base URI", async function () {
      const newBaseURI = "https://newexample.com/api/token/";
      await expect(
        simplified.connect(addr1).setBaseURI(newBaseURI)
      ).to.be.revertedWithCustomError(simplified, "OwnableUnauthorizedAccount");
    });

    it("Should update the base URI and emit an event when called by the owner", async function () {
      const newBaseURI = "https://newexample.com/api/token/";
      await expect(simplified.connect(owner).setBaseURI(newBaseURI))
        .to.emit(simplified, "BaseURIUpdated")
        .withArgs(newBaseURI, owner.address);

      // Assuming you have a getter function for baseURI or it's a public variable
      expect(await simplified.getBaseURI()).to.equal(newBaseURI);
    });
  });

  describe("Set Mint Price", function () {
    it("Should only allow the owner to set the mint price", async function () {
      const newMintPrice = ethers.parseEther("0.08"); // Example new mint price
      await expect(
        simplified.connect(addr1).setMintPrice(newMintPrice)
      ).to.be.revertedWithCustomError(simplified, "OwnableUnauthorizedAccount");
    });

    it("Should update the mint price when called by the owner", async function () {
      const newMintPrice = ethers.parseEther("0.08");
      await simplified.connect(owner).setMintPrice(newMintPrice);
      expect(await simplified.mintPrice()).to.equal(newMintPrice);
    });
  });

  describe("Set Whitelist Mint Price", function () {
    it("Should only allow the owner to set the whitelist mint price", async function () {
      const newWhitelistMintPrice = ethers.parseEther("0.04"); // Example new whitelist mint price
      await expect(
        simplified.connect(addr1).setWhitelistMintPrice(newWhitelistMintPrice)
      ).to.be.revertedWithCustomError(simplified, "OwnableUnauthorizedAccount");
    });

    it("Should update the whitelist mint price when called by the owner", async function () {
      const newWhitelistMintPrice = ethers.parseEther("0.04");
      await simplified
        .connect(owner)
        .setWhitelistMintPrice(newWhitelistMintPrice);
      expect(await simplified.wlFirstMintPrice()).to.equal(
        newWhitelistMintPrice
      );
    });
  });

  describe("Set Merkle Root for Group 1 and Group 2", function () {
    const newMerkleRootGroup1 =
      "0x2d32adbfbf83c8829549c446dc63f1393e79787541ed7c1791695d0962d9e0e5";
    const newMerkleRootGroup2 =
      "0xfe4ee17d37bf6248654ea6a54146252d87936f9130219d78c246c4f466232c7f";

    it("Should only allow the owner to set the Merkle root for Group 1", async function () {
      await expect(
        simplified.connect(addr1).setMerkleRootGroup1(newMerkleRootGroup1)
      ).to.be.revertedWithCustomError(simplified, "OwnableUnauthorizedAccount");
      // Success case
      await expect(
        simplified.connect(owner).setMerkleRootGroup1(newMerkleRootGroup1)
      ).to.not.be.reverted;
      // Assuming there's a way to read merkleRootGroup1 for verification:
      expect(await simplified.merkleRootGroup1()).to.equal(newMerkleRootGroup1);
    });

    it("Should only allow the owner to set the Merkle root for Group 2", async function () {
      await expect(
        simplified.connect(addr1).setMerkleRootGroup2(newMerkleRootGroup2)
      ).to.be.revertedWithCustomError(simplified, "OwnableUnauthorizedAccount");
      // Success case
      await expect(
        simplified.connect(owner).setMerkleRootGroup2(newMerkleRootGroup2)
      ).to.not.be.reverted;
      // Assuming there's a way to read merkleRootGroup2 for verification:
      expect(await simplified.merkleRootGroup2()).to.equal(newMerkleRootGroup2);
    });
  });

  describe("Set Max Supply", function () {
    beforeEach(async function () {
      // Mint some tokens to reach a non-zero total minted
      await simplified.connect(owner).ownerMint(addr1.address, 10);
    });

    it("Should only allow the owner to set the max supply", async function () {
      const newMaxSupply = 1000; // Example new max supply
      await expect(
        simplified.connect(addr1).setMaxSupply(newMaxSupply)
      ).to.be.revertedWithCustomError(simplified, "OwnableUnauthorizedAccount");
    });

    it("Should revert if the new max supply is less than total minted", async function () {
      // This requires knowing the current totalMinted; assume it's > 0 for this test
      await expect(
        simplified.connect(owner).setMaxSupply(0)
      ).to.be.revertedWith("New max supply must be greater than total minted");
    });

    it("Should revert if the new max supply is greater than 1000   ", async function () {
      // This requires knowing the current totalMinted; assume it's > 0 for this test
      await expect(
        simplified.connect(owner).setMaxSupply(1001)
      ).to.be.revertedWith("New max supply must be less than or equal to 1000");
    });

    it("Should update the max supply when conditions are met", async function () {
      const newMaxSupply = 1000; // Assumed valid based on contract conditions
      await simplified.connect(owner).setMaxSupply(newMaxSupply);
      expect(await simplified.MAX_SUPPLY()).to.equal(newMaxSupply);
    });
  });

  describe("Set Whitelist Supply", function () {
    beforeEach(async function () {
      // Mint some tokens to reach a non-zero total minted
      await simplified.connect(owner).ownerMint(addr1.address, 10);
    });

    it("Should only allow the owner to set the whitelist supply", async function () {
      const newMaxWhitelistSupply = 500; // Example new max whitelist supply
      await expect(
        simplified.connect(addr1).setWhitelistSupply(newMaxWhitelistSupply)
      ).to.be.revertedWithCustomError(simplified, "OwnableUnauthorizedAccount");
    });

    it("Should revert if the new max whitelist supply is less than total minted", async function () {
      await expect(
        simplified.connect(owner).setWhitelistSupply(5)
      ).to.be.revertedWith("New max supply must be greater than total minted");
    });

    it("Should revert if the new max whitelist supply is greater than 1000", async function () {
      await expect(
        simplified.connect(owner).setWhitelistSupply(1001)
      ).to.be.revertedWith("New max supply must be less than or equal to 1000");
    });

    it("Should update the whitelist supply when conditions are met", async function () {
      const newMaxWhitelistSupply = 500; // Assumed valid based on contract conditions
      await simplified.connect(owner).setWhitelistSupply(newMaxWhitelistSupply);
      expect(await simplified.WHITELIST_SALE_SUPPLY()).to.equal(
        newMaxWhitelistSupply
      );
    });
  });
});
