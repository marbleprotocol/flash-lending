pragma solidity 0.4.24;

import "../Withdrawable.sol";


contract ExchangeWrapper is Withdrawable {

    // The deployed address of the exchange
    address public exchange;

    function () public payable {}
}