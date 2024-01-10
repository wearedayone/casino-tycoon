// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/access/Ownable.sol';
import './libs/SafeTransferLib.sol';

contract DepositLayerL2 is Ownable {
  using SafeTransferLib for address payable;

  event DepositProposalApproved(address indexed account, uint256 amount);

  constructor(address initialOwner) Ownable(initialOwner) {}

  receive() external payable {}

  function approveDepositProposal(address receiver) public payable onlyOwner {
    require(msg.value > 0, 'Need to send more ether');
    payable(receiver).safeTransferETH(msg.value);
    emit DepositProposalApproved(receiver, msg.value);
  }
}
