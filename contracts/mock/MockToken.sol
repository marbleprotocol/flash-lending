pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";


contract MockToken is StandardToken {

    constructor(address[] accounts, uint256[] initialBalances) public {
        for (uint256 i = 0; i < accounts.length; i++) {
            balances[accounts[i]] = initialBalances[i];
            totalSupply_ += initialBalances[i];
        }
    }

    // Remove allowances for testing
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        require(_to != address(0));
        require(_value <= balances[_from]);

        balances[_from] = balances[_from].sub(_value);
        balances[_to] = balances[_to].add(_value);
        emit Transfer(_from, _to, _value);
        return true;
    }

}