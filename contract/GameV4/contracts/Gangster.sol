// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol';
import '@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol';
import './ERC2981Base.sol';

contract Gangster is ERC1155, AccessControl, ERC1155Burnable, ERC1155Supply, ERC2981Base {
  bytes32 public constant URI_SETTER_ROLE = keccak256('URI_SETTER_ROLE');
  bytes32 public constant MINTER_ROLE = keccak256('MINTER_ROLE');
  RoyaltyInfo private _royalties;

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
