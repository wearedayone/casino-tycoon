// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/access/Ownable.sol';
import './libs/SafeTransferLib.sol';

contract DepositLayerL1 is Ownable {
  using SafeTransferLib for address payable;

  event DepositProposalCreated(address indexed account, uint256 amount);

  constructor(address initialOwner) Ownable(initialOwner) {}

  receive() external payable {}

  function submitDepositProposal(address receiver) public payable {
    require(msg.value > 0, 'Need to send more ether');
    emit DepositProposalCreated(receiver, msg.value);
  }

  function withdrawEth(address toAddr) external onlyOwner {
    payable(toAddr).safeTransferETH(address(this).balance);
  }
}
