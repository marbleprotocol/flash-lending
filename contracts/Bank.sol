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

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Transfer.sol";

// @title Bank: Accept deposits and allow approved contracts to borrow Ether and ERC20 tokens.
// @author Rich McAteer <rich@marble.org>, Max Wolff <max@marble.org>
contract Bank is Ownable, Transfer {
    using SafeMath for uint256;

    // Borrower => Approved
    mapping (address => bool) public approved;

    modifier onlyApproved() {
        require(approved[msg.sender] == true);
        _;
    }

    /**
    * @dev Deposit tokens to the bank.
    * @param token Address of token to deposit. 0x0 for ETH
    * @param amount Amount of token to deposit.
    */
    function deposit(address token, uint256 amount) external onlyOwner payable {
        transferFrom(token, msg.sender, this, amount);
    }

    /**
    * @dev Withdraw tokens from the bank.
    * @param token Address of token to withdraw. 0x0 for ETH
    * @param amount Amount of token to withdraw.
    */
    function withdraw(address token, uint256 amount) external onlyOwner {
        transfer(token, msg.sender, amount);
    }

    /**
    * @dev Borrow tokens from the bank.
    * @param token Address of token to borrow. 0x0 for ETH
    * @param amount Amount of token to borrow.
    */
    function borrow(address token, uint256 amount) external onlyApproved {
        borrowFor(token, msg.sender, amount);
    }

    /**
    * @dev Borrow tokens from the bank on behalf of another account.
    * @param token Address of token to borrow. 0x0 for ETH
    * @param who Address to send borrowed amount to.
    * @param amount Amount of token to borrow.
    */
    function borrowFor(address token, address who, uint256 amount) public onlyApproved {
        transfer(token, who, amount);        
    }

    /**
    * @dev Repay tokens to the bank.
    * @param token Address of token to repay. 0x0 for ETH
    * @param amount Amount of token to repay.
    */
    function repay(address token, uint256 amount) external payable {
        transferFrom(token, msg.sender, this, amount);
    }

    /**
    * @dev Approve a new borrower.
    * @param borrower Address of new borrower.
    */
    function addBorrower(address borrower) external onlyOwner {
        approved[borrower] = true;
    }

    /**
    * @dev Revoke approval of a borrower.
    * @param borrower Address of borrower to revoke.
    */
    function removeBorrower(address borrower) external onlyOwner {
        approved[borrower] = false;
    }

    /**
    * @dev Gets balance of bank. 
    * @param token Address of token to calculate total supply of.
    */
    function totalSupplyOf(address token) public view returns (uint256 balance) {
        if (token == ETH) {
            return address(this).balance; 
        } else {
            return ERC20(token).balanceOf(this); 
        }
    }

}