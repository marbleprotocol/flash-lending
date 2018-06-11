pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Transfer.sol";


contract Bank is Ownable, Transfer {
    using SafeMath for *;

    // Token => Account => Deposit
    mapping (address => mapping (address => uint256)) public deposits;

    // Token => Total Deposits
    mapping (address => uint256) public totalDeposits;

    // Lender => Approved
    mapping (address => bool) public approved;

    address constant public ETH = 0x0;

    modifier onlyApproved() {
        require(approved[msg.sender] == true);
        _;
    }

    /**
    * @dev Deposit tokens to the bank.
    */
    function deposit(address token, uint256 amount) public payable {
        transferFrom(token, msg.sender, this, amount);
        deposits[token][msg.sender] = deposits[token][msg.sender].add(amount);
        totalDeposits[token] = totalDeposits[token].add(amount); 
    }

    /**
    * @dev Withdraw tokens from the bank.
    */
    function withdraw(address token, uint256 amount) external {
        require(balanceOf(token, msg.sender) >= amount);

        uint256 totalDeposit = totalDeposits[token];
        uint256 totalSupply = totalSupplyOf(token);
        uint256 principal = amount.mul(totalDeposit).div(totalSupply);
        deposits[token][msg.sender] = deposits[token][msg.sender].sub(principal);
        
        // Transfer tokens to the withdrawer
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
    function borrowFor(address token, address borrower, uint256 amount) public onlyApproved {
        transfer(token, borrower, amount);        
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

    /**
    * @dev Gets balance of a specific account.
    * @notice Accounts have a proportional claim to any interest earned by the bank.
    */
    function balanceOf(address token, address who) public view returns (uint256 balance) {
        uint256 totalSupply = totalSupplyOf(token);
        uint256 deposit = deposits[token][who];
        uint256 totalDeposit = totalDeposits[token];
        return deposit.mul(totalSupply).div(totalDeposit);
    }

}