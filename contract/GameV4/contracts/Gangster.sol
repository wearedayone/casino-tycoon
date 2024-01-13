// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol';
import '@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol';
import './ERC2981Base.sol';
import './libs/SafeMath.sol';
import './libs/SignedSafeMath.sol';

contract Gangster is ERC1155, AccessControl, ERC1155Burnable, ERC1155Supply, ERC2981Base {
  using SafeMath for uint256;
  using SignedSafeMath for int256;

  bytes32 public constant URI_SETTER_ROLE = keccak256('URI_SETTER_ROLE');
  bytes32 public constant MINTER_ROLE = keccak256('MINTER_ROLE');
  RoyaltyInfo private _royalties;

  // Max NFT minting perbatch
  uint256 public MAX_PER_BATCH = 25;

  // Max NFT when whitelist mint per wallet
  uint256 public MAX_PER_WL = 20;

  // Max supply of NFT
  mapping(uint256 => uint256) public tokenMaxSupply;
  mapping(address => bool) public mintedAddess;
  // Wallet whitelist minted
  mapping(address => uint256) public mintedAddessWL;

  constructor(address defaultAdmin, address minter) ERC1155('') {
    _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
    _grantRole(MINTER_ROLE, minter);
  }

  function setURI(string memory newuri) public onlyRole(URI_SETTER_ROLE) {
    _setURI(newuri);
  }

  function mint(address account, uint256 id, uint256 amount, bytes memory data) public onlyRole(MINTER_ROLE) {
    _mint(account, id, amount, data);
  }

  function mintBatch(
    address to,
    uint256[] memory ids,
    uint256[] memory amounts,
    bytes memory data
  ) public onlyRole(MINTER_ROLE) {
    _mintBatch(to, ids, amounts, data);
  }

  /**
   * @notice Normal buy gangster
   */
  function mintOnBehalf(address to, uint256 tokenId, uint256 amount) public onlyRole(MINTER_ROLE) {
    mintNFT(to, tokenId, amount);
  }

  /**
   * @notice Buy gangster with referral
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
   * @notice set Max per batch
   */
  function setMaxPerBatch(uint256 _maxPerBatch) public onlyRole(DEFAULT_ADMIN_ROLE) {
    MAX_PER_BATCH = _maxPerBatch;
  }

  /**
   * @notice set Max Per Whitelisted Wallet
   */
  function setMaxPerWL(uint256 _maxPerWL) public onlyRole(DEFAULT_ADMIN_ROLE) {
    MAX_PER_WL = _maxPerWL;
  }

  /**
   * @notice common logic for minting
   */
  function mintNFT(address sender, uint256 tokenId, uint256 amount) private {
    uint256 maxSully = tokenMaxSupply[tokenId];
    require(maxSully != 0, 'Invalid token id');
    require(amount != 0, 'Invalid amount');
    require(amount <= MAX_PER_BATCH, 'Max per batch reached');
    require(totalSupply(tokenId) + amount <= tokenMaxSupply[tokenId], 'Max supply reached');

    _mint(msg.sender, tokenId, amount, '');

    if (!mintedAddess[sender]) mintedAddess[sender] = true;
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
}
