pragma solidity 0.4.24;

contract ZeroEx {
    function fillOrder(
      address[5] orderAddresses,
      uint[6] orderValues,
      uint fillTakerTokenAmount,
      bool shouldThrowOnInsufficientBalanceOrAllowance,
      uint8 v,
      bytes32 r,
      bytes32 s)
      public
      returns (uint filledTakerTokenAmount);
}