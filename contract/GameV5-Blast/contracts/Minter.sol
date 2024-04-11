// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/access/Ownable.sol';
import './libs/SignerLib.sol';
import './Gangster.sol';

contract Minter is Ownable {
  using SignerLib for address;

  Gangster gangster;
  address private signer; // Signer address
  uint256 MAX_SUPPLY_PRESALE = 2000; // Max supply for presale
  uint256 public MAX_PER_BATCH = 100; // Max NFT minting perbatch
  uint256 public MAX_PER_WL = 20; // Max NFT when whitelist mint per wallet
  uint256 public MAX_PER_FREE = 1; // Max NFT when whitelist mint per wallet
  uint256 public BASE_PRICE = 0.01 ether;
  uint256 public BASE_PRICE_WL = 0.005 ether;
  bool public PUBLIC_MINT = false;
  bool public WL_MINT = false;
  bool public FREE_MINT = false;

  mapping(address => uint256) public mintedAddrFree; // Wallet whitelist minted
  mapping(address => uint256) public mintedAddrWL; // Wallet whitelist minted

  /**
   ***************************
   *Public
   ***************************
   */

  event Mint(address addr, uint256 amount);

  constructor(address initialOwner, address _gangster, address _signer) Ownable(initialOwner) {
    gangster = Gangster(_gangster);
    signer = _signer;
  }

  receive() external payable {}

  fallback() external payable {}

  /**
  ***************************
  Public
  ***************************
   */
  function getBalance() public view returns (uint256) {
    return address(this).balance;
  }

  function mint(uint256 amount) public payable {
    require(PUBLIC_MINT, 'Public sale is not opened');
    require(MAX_PER_BATCH >= amount, 'Over max per batch'); // Limit max per batch
    require(gangster.totalSupply(1) + amount >= MAX_SUPPLY_PRESALE, 'Over max supply'); // Limit max supply presale
    require(msg.value >= amount * BASE_PRICE, 'Need send more eth');
    gangster.mint(msg.sender, 1, amount, '');
    emit Mint(msg.sender, amount);
  }

  /**
   * @notice mintWL
   * type: type of mint, 0 is free mint, 1 is public mint
   * amount: number of nft
   * sig: signatire from application
   */
  function mintWL(uint256 mintType, uint256 amount, bytes memory sig) public payable {
    require(MAX_PER_BATCH >= amount, 'Over max per batch'); // Limit max per batch
    require(gangster.totalSupply(1) + amount >= MAX_SUPPLY_PRESALE, 'Over max supply'); // Limit max supply presale
    if (mintType == 0) {
      // Free mint
      require(FREE_MINT, 'Airdop is not opened');
      require(MAX_PER_FREE >= mintedAddrFree[msg.sender] + amount, 'Over max free'); // limit max whitelist mint per addess
    } else if (mintType == 1) {
      //Whitelist mint
      require(WL_MINT, 'Whitelist sale is not opened');
      require(MAX_PER_WL >= mintedAddrWL[msg.sender] + amount, 'Over max wl'); // limit max whitelist mint per addess
      require(msg.value >= amount * BASE_PRICE_WL);
    }
    bytes32 message = SignerLib.prefixed(keccak256(abi.encodePacked(msg.sender, mintType, amount)));
    require(signer.verifyAddressSigner(message, sig), 'Invalid signature');

    gangster.mint(msg.sender, 1, amount, '');

    if (mintType == 0) {
      mintedAddrFree[msg.sender] += amount;
    } else if (mintType == 1) {
      mintedAddrWL[msg.sender] += amount;
    }

    emit Mint(msg.sender, amount);
  }

  /**
  ***************************
  DEFAULT_ADMIN_ROLE Function
  ***************************
   */
  function emegencyWithdraw() public onlyOwner {
    require(address(this).balance > 0, 'Nothing to withdraw');
    address payable receiver = payable(msg.sender);
    receiver.transfer(address(this).balance);
  }

  function updateConfig(
    uint256 _maxSupply,
    uint256 _maxPerBatch,
    uint256 _maxPerWL,
    uint256 _maxPerFree,
    uint256 _basePrice,
    uint256 _wlPrice
  ) public onlyOwner {
    MAX_SUPPLY_PRESALE = _maxSupply; // Max supply for presale
    MAX_PER_BATCH = _maxPerBatch; // Max NFT minting perbatch
    MAX_PER_WL = _maxPerWL; // Max NFT when whitelist mint per wallet
    MAX_PER_FREE = _maxPerFree; // Max NFT when whitelist mint per wallet
    BASE_PRICE = _basePrice;
    BASE_PRICE_WL = _wlPrice;
  }

  function updateStage(bool _public, bool _free, bool _wl) public onlyOwner {
    PUBLIC_MINT = _public;
    WL_MINT = _free;
    FREE_MINT = _wl;
  }
}
