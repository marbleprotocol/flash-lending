pragma solidity 0.4.24;

import "../Transfer.sol";
import "../proxy/Withdrawable.sol";
import "./ExternalCall.sol";

contract TradeExecutor is Transfer, Withdrawable, ExternalCall {

    // Allow exchange wrappers to send Ether
    function () public payable {}

    /*
     * @dev Execute multiple trades in a single transaction.
     * @param wrappers Addresses of exchange wrappers.
     * @param token Address of ERC20 token to receive in first trade.
     * @param trade1 Calldata of Ether => ERC20 trade.
     * @param trade2 Calldata of ERC20 => Ether trade.
    */
    function trade(
        address[2] wrappers,
        address token,
        bytes trade1,
        bytes trade2
    )
        external
        payable
    {
        // Execute the first trade to get tokens
        require(execute(wrappers[0], msg.value, trade1));

        uint256 tokenBalance = IERC20(token).balanceOf(this);

        // Transfer tokens to the next exchange wrapper
        transfer(token, wrappers[1], tokenBalance);

        // Execute the second trade to get Ether
        require(execute(wrappers[1], 0, trade2));
        
        // Send the arbitrageur Ether
        msg.sender.transfer(address(this).balance);
    }

    function tradeForTokens(
        address[2] wrappers,
        address token,
        bytes trade1,
        bytes trade2
    )
        external
    {
        // Transfer tokens to the first exchange wrapper
        uint256 tokenBalance = IERC20(token).balanceOf(this);
        transfer(token, wrappers[0], tokenBalance);

        // Execute the first trade to get Ether
        require(execute(wrappers[0], 0, trade1));

        uint256 balance = address(this).balance;

        // Transfer Ether to the next exchange wrapper
        transfer(ETH, wrappers[1], balance);

        // Execute the second trade to get tokens
        require(execute(wrappers[1], balance, trade2));

        // tokenBalance = IERC20(token).balanceOf(this);
        // require(IERC20(token).transfer(msg.sender, tokenBalance));
    }

    function execute(address wrapper, uint256 value, bytes data) private returns (bool) {
        return external_call(wrapper, value, data.length, data);
    }

}
