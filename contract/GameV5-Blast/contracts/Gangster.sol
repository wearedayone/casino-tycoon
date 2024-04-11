// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol';
import '@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol';
import './ERC2981Base.sol';
import './libs/SafeMath.sol';
import './libs/SignedSafeMath.sol';

// import 'hardhat/console.sol';

contract Gangster is ERC1155, AccessControl, ERC1155Burnable, ERC1155Supply, ERC2981Base {
  using SafeMath for uint256;
  using SignedSafeMath for int256;

  bytes32 public constant URI_SETTER_ROLE = keccak256('URI_SETTER_ROLE');
  bytes32 public constant MINTER_ROLE = keccak256('MINTER_ROLE');
  RoyaltyInfo private _royalties;

  // Max NFT minting perbatch
  uint256 public MAX_PER_BATCH = 100;

  // Max NFT when whitelist mint per wallet
  uint256 public MAX_PER_WL = 10;

  // Max supply of NFT
  mapping(uint256 => uint256) public tokenMaxSupply;
  mapping(address => bool) public mintedAddess;
  // Wallet whitelist minted
  mapping(address => uint256) public mintedAddessWL;

  // NFT when user deposit
  mapping(address => uint256) public gangster; // address -> number of gangster

  uint256 public nPlayer; // number of player
  bool public lockNFT;

  constructor(address defaultAdmin, address minter) ERC1155('') {
    _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
    _grantRole(URI_SETTER_ROLE, defaultAdmin);
    _grantRole(MINTER_ROLE, defaultAdmin);
    _grantRole(MINTER_ROLE, minter);
  }

  function setURI(string memory newuri) public onlyRole(URI_SETTER_ROLE) {
    _setURI(newuri);
  }

  /**
   * @notice Pre-sale buy gangster
   */
  function mint(address account, uint256 id, uint256 amount, bytes memory data) public onlyRole(MINTER_ROLE) {
    _mint(account, id, amount, data);
  }

  /**
   * @notice In-game buy gangster
   */
  function mintOnBehalf(address to, uint256 tokenId, uint256 amount) public onlyRole(MINTER_ROLE) {
    mintNFT(to, tokenId, amount);
  }

  /**
   * @notice In-game buy gangster with whitelisted
   */
  function mintWLOnBehalf(address to, uint256 tokenId, uint256 amount) public onlyRole(MINTER_ROLE) {
    // require whitelisted for genesis token
    require(mintedAddessWL[msg.sender] + amount <= MAX_PER_WL, 'Max whitelisted perwallet reached');
    mintNFT(to, tokenId, amount);
    mintedAddessWL[to] += amount;
  }

  /**
   * @notice set Token Max Supply - default [0,1000]
   */
  function setTokenMaxSupply(uint256[] calldata _tokenMaxSupplies) public onlyRole(DEFAULT_ADMIN_ROLE) {
    for (uint256 i = 0; i < _tokenMaxSupplies.length; i++) {
      tokenMaxSupply[i] = _tokenMaxSupplies[i];
    }
  }

  /**
   * @notice set Max per batch and Max Per Whitelisted Wallet
   */
  function setMaxPerBatch(uint256 _maxPerBatch, uint256 _maxPerWL) public onlyRole(DEFAULT_ADMIN_ROLE) {
    MAX_PER_BATCH = _maxPerBatch;
    MAX_PER_WL = _maxPerWL;
  }

  /**
   * @notice common logic for buy nft in-game
   */
  function mintNFT(address sender, uint256 tokenId, uint256 amount) private {
    uint256 maxSully = tokenMaxSupply[tokenId];
    require(maxSully != 0, 'Invalid token id');
    require(amount != 0, 'Invalid amount');
    require(amount <= MAX_PER_BATCH, 'Max per batch reached');
    require(totalSupply(tokenId) + amount <= tokenMaxSupply[tokenId], 'Max supply reached');

    _mint(address(this), tokenId, amount, '');
    gangster[sender] += amount;

    if (!mintedAddess[sender]) {
      mintedAddess[sender] = true;
      nPlayer++;
    }
  }

  /**
   * @notice depositNFT
   */
  function depositNFT(address from, address addr, uint256 tokenId, uint256 amount) public onlyRole(MINTER_ROLE) {
    _safeTransferFrom(from, address(this), tokenId, amount, '');
    gangster[addr] += amount;
  }

  /**
   * @dev See {IERC1155-setApprovalForAll}.
   */
  function approvalForWithdraw(address operator, bool approved) public onlyRole(DEFAULT_ADMIN_ROLE) {
    _setApprovalForAll(address(this), operator, approved);
  }

  /**
   * @notice withdrawNFT
   */
  function withdrawNFT(address addr, address to, uint256 tokenId, uint256 amount) public onlyRole(MINTER_ROLE) {
    require(!lockNFT, 'NFT is locked');
    require(gangster[addr] >= amount, 'Insufficient balance');
    _safeTransferFrom(address(this), to, tokenId, amount, '');
    gangster[addr] -= amount;
  }

  function retired(address addr) public onlyRole(MINTER_ROLE) {
    require(mintedAddess[addr], 'user is not activated');
    _burn(address(this), 1, gangster[addr]);
    gangster[addr] = 0;
    mintedAddess[addr] = false;
    nPlayer--;
  }

  /**
   * @notice Burn NFT for gangwar
   */
  function burnNFT(address[] memory addr, uint256 tokenId, uint256[] memory amount) public onlyRole(MINTER_ROLE) {
    require(addr.length == amount.length, 'Input array is not match');
    // bytes32 message = prefixed(keccak256(abi.encodePacked(to, tokenId, amount)));
    // require(verifyAddressSigner(message, sig), 'Invalid signature');

    for (uint256 i = 0; i < addr.length; i++) {
      require(gangster[addr[i]] >= amount[i], 'Invalid amount to burn');
    }

    uint256 total = reduce(amount);
    _burn(address(this), tokenId, total);
    for (uint256 i = 0; i < addr.length; i++) {
      gangster[addr[i]] -= amount[i];
    }
  }

  /**
   * @notice set NFT Lock flag - use to prevent withdraw nft when calculate gangwar result
   */
  function setLockNFT(bool value) public onlyRole(MINTER_ROLE) {
    lockNFT = value;
  }

  // The following functions are overrides required by Solidity.

  function _update(
    address from,
    address to,
    uint256[] memory ids,
    uint256[] memory values
  ) internal override(ERC1155, ERC1155Supply) {
    super._update(from, to, ids, values);
  }

  // Value is in basis points so 10000 = 100% , 100 = 1% etc
  function setRoyalties(address recipient, uint256 value) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(value <= 10000, 'ERC2981Royalties: Too high');
    _royalties = RoyaltyInfo(recipient, uint24(value));
  }

  function royaltyInfo(
    uint256,
    uint256 value
  ) external view override returns (address receiver, uint256 royaltyAmount) {
    RoyaltyInfo memory royalties = _royalties;
    receiver = royalties.recipient;
    royaltyAmount = (value * royalties.amount) / 10000;
  }

  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual override(ERC1155, AccessControl, ERC2981Base) returns (bool) {
    return super.supportsInterface(interfaceId);
  }

  /**
   * @notice ERC1155 receiver
   */
  function onERC1155Received(
    address operator,
    address from,
    uint256 id,
    uint256 value,
    bytes calldata data
  ) external returns (bytes4) {
    return bytes4(keccak256('onERC1155Received(address,address,uint256,uint256,bytes)'));
  }

  /**
   * @notice sum of array
   */
  function reduce(uint256[] memory arr) internal pure returns (uint256 result) {
    for (uint256 i = 0; i < arr.length; i++) {
      result += arr[i];
    }
    return result;
  }
}
