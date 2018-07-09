pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";


contract Transfer {

    address constant public ETH = 0x0;

    /**
    * @dev Transfer tokens from this contract to an account.
    */
    function transfer(address token, address to, uint256 amount) internal returns (bool success) {
        if (token == ETH) {
            to.transfer(amount);
        } else {
            require(ERC20(token).transfer(to, amount), "Transfer failed");
        }
        return true;
    }

    /**
    * @dev Transfer tokens from an account to this contract.
    */
    function transferFrom(
        address token,
        address from,
        address to,
        uint256 amount
    ) 
        internal
        returns (bool success)
    {
        require(token == ETH && msg.value == amount || msg.value == 0, "Msg.value should only equal transfer amount if transferring ETH");

        if (token != ETH) {
            // Remember to approve first
            require(ERC20(token).transferFrom(from, to, amount), "TransferFrom failed");
        }
        return true;
    }

}