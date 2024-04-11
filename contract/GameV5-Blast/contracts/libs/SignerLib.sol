// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

library SignerLib {
  /**
  ***************************
  Internal Function
  ***************************
   */

  /**
   * @notice Verify signature
   */
  function verifyAddressSigner(address signer, bytes32 message, bytes memory sig) internal pure returns (bool) {
    return signer == recoverSignerFromSignature(message, sig);
  }

  //function to get the public address of the signer
  function recoverSignerFromSignature(bytes32 message, bytes memory sig) internal pure returns (address) {
    require(sig.length == 65);

    uint8 v;
    bytes32 r;
    bytes32 s;

    assembly {
      // first 32 bytes, after the length prefix
      r := mload(add(sig, 32))
      // second 32 bytes
      s := mload(add(sig, 64))
      // final byte (first byte of the next 32 bytes)
      v := byte(0, mload(add(sig, 96)))
    }

    return ecrecover(message, v, r, s);
  }

  // Builds a prefixed hash to mimic the behavior of eth_sign.
  function prefixed(bytes32 _hashedMessage) internal pure returns (bytes32) {
    bytes memory prefix = '\x19Ethereum Signed Message:\n32';
    bytes32 prefixedHashMessage = keccak256(abi.encodePacked(prefix, _hashedMessage));
    return prefixedHashMessage;
  }
}
