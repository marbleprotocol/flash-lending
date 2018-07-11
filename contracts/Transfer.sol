pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";


contract Transfer {

    address constant public ETH = 0x0;

    /**
    * @dev Transfer tokens from this contract to an account.
    * @param token Address of token to transfer. 0x0 for ETH
    * @param to Address to send tokens to.
    * @param amount Amount of token to send.
    */
    function transfer(address token, address to, uint256 amount) internal returns (bool) {
        if (token == ETH) {
            to.transfer(amount);
        } else {
            require(ERC20(token).transfer(to, amount));
        }
        return true;
    }

    /**
    * @dev Transfer tokens from an account to this contract.
    * @param token Address of token to transfer. 0x0 for ETH
    * @param from Address to send tokens from.
    * @param to Address to send tokens to.
    * @param amount Amount of token to send.
    */
    function transferFrom(
        address token,
        address from,
        address to,
        uint256 amount
    ) 
        internal
        returns (bool)
    {
        require(token == ETH && msg.value == amount || msg.value == 0);

        if (token != ETH) {
            // Remember to approve first
            require(ERC20(token).transferFrom(from, to, amount));
        }
        return true;
    }

}