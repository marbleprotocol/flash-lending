pragma solidity 0.4.24;

import "./Withdrawable.sol";


contract TradeExecutor is Withdrawable {

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

    // Source: https://github.com/gnosis/MultiSigWallet/blob/master/contracts/MultiSigWallet.sol
    // call has been separated into its own function in order to take advantage
    // of the Solidity's code generator to produce a loop that copies tx.data into memory.
    function external_call(address destination, uint value, uint dataLength, bytes data) private returns (bool) {
        bool result;
        assembly {
            let x := mload(0x40)   // "Allocate" memory for output (0x40 is where "free memory" pointer is stored by convention)
            let d := add(data, 32) // First 32 bytes are the padded length of data, so exclude that
            result := call(
                sub(gas, 34710),   // 34710 is the value that solidity is currently emitting
                                   // It includes callGas (700) + callVeryLow (3, to pay for SUB) + callValueTransferGas (9000) +
                                   // callNewAccountGas (25000, in case the destination address does not exist and needs creating)
                destination,
                value,
                d,
                dataLength,        // Size of the input (in bytes) - this is what fixes the padding problem
                x,
                0                  // Output is ignored, therefore the output size is zero
            )
        }
        return result;
    }

}
