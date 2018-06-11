pragma solidity 0.4.24;

import "./Withdrawable.sol";
import "./ExternalCall.sol";

contract TradeExecutor is Withdrawable, ExternalCall {

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
        public
        payable
    {
        // Execute the first trade to get tokens
        require(execute(wrappers[0], msg.value, trade1));

        // Transfer tokens to the next exchange wrapper
        transferBalance(token, wrappers[1]);

        // Execute the second trade to get Ether
        require(execute(wrappers[1], 0, trade2));
        
        // Send the arbitrageur Ether
        msg.sender.transfer(address(this).balance);
    }

    function execute(address wrapper, uint256 value, bytes data) private returns (bool) {
        return external_call(wrapper, value, data.length, data);
    }

    function transferBalance(address token, address to) private returns (bool) {
        uint256 balance = IERC20(token).balanceOf(this);
        return IERC20(token).transfer(to, balance);
    }

}
