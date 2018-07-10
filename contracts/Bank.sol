pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Transfer.sol";


contract Bank is Ownable, Transfer {
    using SafeMath for uint256;

    // Borrower => Approved
    mapping (address => bool) public approved;

    address constant public ETH = 0x0;

    modifier onlyApproved() {
        require(approved[msg.sender] == true);
        _;
    }

    /**
    * @dev Deposit tokens to the bank.
    */
    function deposit(address token, uint256 amount) external onlyOwner payable {
        transferFrom(token, msg.sender, this, amount);
    }

    /**
    * @dev Withdraw tokens from the bank.
    */
    function withdraw(address token, uint256 amount) external onlyOwner {
        transfer(token, msg.sender, amount);
    }

    /**
    * @dev Borrow tokens from the bank.
    */
    function borrow(address token, uint256 amount) external onlyApproved {
        borrowFor(token, msg.sender, amount);
    }

    /**
    * @dev Borrow tokens from the bank on behalf of another account.
    */
    function borrowFor(address token, address who, uint256 amount) public onlyApproved {
        transfer(token, who, amount);        
    }

    /**
    * @dev Repay tokens to the bank.
    */
    function repay(address token, uint256 amount) external payable {
        transferFrom(token, msg.sender, this, amount);
    }

    /**
    * @dev Approve a new borrower.
    */
    function addBorrower(address borrower) external onlyOwner {
        approved[borrower] = true;
    }

    /**
    * @dev Revoke approval of a borrower.
    */
    function removeBorrower(address borrower) external onlyOwner {
        approved[borrower] = false;
    }

    /**
    * @dev Gets balance of bank. 
    */
    function totalSupplyOf(address token) public view returns (uint256 balance) {
        if (token == ETH) {
            return address(this).balance; 
        } else {
            return ERC20(token).balanceOf(this); 
        }
    }

}