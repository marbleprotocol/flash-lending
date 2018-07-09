pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./ExchangeWrapper.sol";
import "../DEX/EtherDelta.sol";
import "../Transfer.sol";

contract EtherDeltaWrapper is ExchangeWrapper, Transfer {

    uint256 public constant MAX_UINT = uint(-1);

    constructor(address _exchange) public {
        exchange = _exchange;
    }

    function getTokens(
        uint takerAmount,
        address makerToken,
        uint makerAmount,
        uint expires,
        uint nonce,
        address user,
        uint8 v,
        bytes32 r,
        bytes32 s
    )
        public
        payable
    {
        // Deposit ETH
        EtherDelta(exchange).deposit.value(msg.value)();

        /*
        trade(
            address tokenGet, // takerToken
            uint amountGet, // takerAmount
            address tokenGive, // makerToken
            uint amountGive, // makerAmount
            uint expires,
            uint nonce,
            address user,
            uint8 v,
            bytes32 r,
            bytes32 s,
            uint amount // amount  <= takerAmount
        )
        */

        EtherDelta(exchange).trade(
            ETH, 
            takerAmount,
            makerToken,
            makerAmount,
            expires,
            nonce,
            user,
            v,
            r,
            s,
            msg.value
        );

        // Withdraw tokens
        uint tokenBalance = EtherDelta(exchange).balanceOf(makerToken, this);
        EtherDelta(exchange).withdrawToken(makerToken, tokenBalance);

        // Send tokens to trade executor
        transfer(makerToken, msg.sender, tokenBalance);
    }

    function getEther(
        ERC20 takerToken,
        uint takerAmount,
        uint makerAmount,
        uint expires,
        uint nonce,
        address user,
        uint8 v,
        bytes32 r,
        bytes32 s
    )
        public
    {
        // Use the full balance of tokens transferred from the trade executor
        uint256 amount = takerToken.balanceOf(this);

        if (takerToken.allowance(this, exchange) < amount) {
            // Approve the exchange to transfer tokens from this contract to the reserve
            takerToken.approve(exchange, MAX_UINT);
        }

        EtherDelta(exchange).depositToken(takerToken, amount);

        /*
        trade(
            address tokenGet, // takerToken
            uint amountGet, // takerAmount
            address tokenGive, // makerToken
            uint amountGive, // makerAmount
            uint expires,
            uint nonce,
            address user,
            uint8 v,
            bytes32 r,
            bytes32 s,
            uint amount // amount  <= takerAmount
        )
        */
        
        EtherDelta(exchange).trade(
            takerToken, 
            takerAmount,
            ETH,
            makerAmount,
            expires,
            nonce,
            user,
            v,
            r,
            s,
            amount
        );

        uint ethBalance = EtherDelta(exchange).balanceOf(ETH, this);
        EtherDelta(exchange).withdraw(ethBalance);

        // Send ETH to trade executor
        transfer(ETH, msg.sender, ethBalance);
    }
}