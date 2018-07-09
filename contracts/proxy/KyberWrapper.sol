pragma solidity 0.4.24;

import "./ExchangeWrapper.sol";
import "../DEX/Kyber.sol";

contract KyberWrapper is ExchangeWrapper {

    ERC20 constant internal ETH_TOKEN_ADDRESS = ERC20(0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee);
    uint256 public constant MAX_UINT = uint(-1);

    constructor(address _exchange) public {
        exchange = _exchange;
    }

    function getTokens(
        ERC20 dest,
        address destAddress,
        uint maxDestAmount,
        uint minConversionRate,
        address walletId
    )
        public
        payable
    {
        Kyber(exchange).trade.value(msg.value)(
            ETH_TOKEN_ADDRESS,
            msg.value,
            dest,
            destAddress,
            maxDestAmount,
            minConversionRate,
            walletId
        );
    }

    function getEther(
        ERC20 src,
        address destAddress,
        uint maxDestAmount,
        uint minConversionRate,
        address walletId
    )
        public
    {
        // Use the full balance of tokens transferred from the trade executor
        uint256 srcAmount = src.balanceOf(this);

        if (src.allowance(this, exchange) < srcAmount) {
            // Approve the exchange to transfer tokens from this contract to the reserve
            src.approve(exchange, MAX_UINT);
        }

        Kyber(exchange).trade(
            src,
            srcAmount,
            ETH_TOKEN_ADDRESS,
            destAddress,
            maxDestAmount,
            minConversionRate,
            walletId
        );
    }

}