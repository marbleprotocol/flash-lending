pragma solidity 0.4.24;

import "./Withdrawable.sol";


contract ExchangeWrapper is Withdrawable {
    
    uint256 constant public MAX_UINT = 2 ** 256 - 1;
    
    // The deployed address of the exchange
    address public exchange;
}