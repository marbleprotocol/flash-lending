/*

  Copyright 2018 Contra Labs Inc.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/

pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./interface/IBank.sol";
import "./interface/IArbitrage.sol";

// @title FlashLender: Borrow from the bank and enforce repayment by the end of transaction execution.
// @author Rich McAteer <rich@marble.org>, Max Wolff <max@marble.org>
contract FlashLender is ReentrancyGuard, Ownable {
    using SafeMath for uint256;

    string public version = '0.1';
    address public bank;
    uint256 public fee;
    
    /**
    * @dev Verify that the borrowed tokens are returned to the bank plus a fee by the end of transaction execution.
    */
    modifier isArbitrage(address token, uint256 amount) {
        uint256 balance = IBank(bank).totalSupplyOf(token);
        uint256 feeAmount = amount.mul(fee).div(10 ** 18); 
        _;
        require(IBank(bank).totalSupplyOf(token) >= (balance.add(feeAmount)));
    }

    constructor(address _bank, uint256 _fee) public {
        bank = _bank;
        fee = _fee;
    }

    /**
    * @dev Borrow from the bank on behalf of an arbitrage contract and execute the arbitrage contract's callback function.
    * @param token Address of the token to borrow. 0x0 for Ether.
    * @param amount Amount to borrow.
    * @param dest Address of the account to receive arbitrage profits.
    * @param data The data to execute the arbitrage trade.
    */
    function borrow(
        address token,
        uint256 amount,
        address dest,
        bytes data
    )
        external
        nonReentrant
        isArbitrage(token, amount)
        returns (bool)
    {
        // Borrow from the bank and send to the arbitrageur.
        IBank(bank).borrowFor(token, msg.sender, amount);
        // Call the arbitrageur's execute arbitrage method.
        return IArbitrage(msg.sender).executeArbitrage(token, amount, dest, data);
    }

    /**
    * @dev Allow the owner to set the bank address.
    * @param _bank Address of the bank.
    */
    function setBank(address _bank) external onlyOwner {
        bank = _bank;
    }

    /**
    * @dev Allow the owner to set the fee.
    * @param _fee Fee to borrow, as a percentage of principal borrowed. 18 decimals of precision (e.g., 10^18 = 100% fee).
    */
    function setFee(uint256 _fee) external onlyOwner {
        fee = _fee;
    }

}