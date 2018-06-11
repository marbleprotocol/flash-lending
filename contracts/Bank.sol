pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Transfer.sol";


contract Bank is Ownable, Transfer {
    using SafeMath for *;


    // Token => Total Deposited
    mapping (address => uint256) public totalDeposits;

    // Token => User => Deposited
    mapping (address => mapping (address => uint256)) public deposits;

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
        require(token == ETH || msg.value == 0);
        deposits[token][msg.sender] = deposits[token][msg.sender].add(amount);
        totalDeposits[token] = totalDeposits[token].add(amount); 
        transferFrom(token, msg.sender, this, amount);
    }

    /**
    * @dev Withdraw tokens from the bank.
    */
    function withdraw(address token, uint256 amount) external {
        require(getAllocation(token,msg.sender) >= amount); 
        // uint256 portion = deposits[token][msg.sender].div(totalDeposits[token]);
        // deposits[token][msg.sender] = amount deposits[token][msg.sender].sub();
        // totalDeposits[token] = totalDeposits[token].sub(amount); 

        
        transfer(token, msg.sender, amount);
    }

    function getAllocation(address token, address who) public view returns (uint256 allocation){
        return balanceOf(token).mul(deposits[token][msg.sender]).div(totalDeposits[token]);
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

    /* ========== UTILS ========== */

    /**
    * @dev Gets balance of bank. 
    */
    function balanceOf(address token) public returns (uint256 balance) {
        if (token == ETH) {
            return address(this).balance; 
        } else {
            return ERC20(token).balanceOf(this); 
        }
    }

    /**
    * @dev Transfer tokens from the bank to an account.
    */
    function transfer(address token, address to, uint256 amount) internal returns (bool success) {
        super.transfer(token, to, amount);
        return true;
    }

    /**
    * @dev Transfer tokens from an account to the bank.
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
        if (token != ETH) { 
            // Remember to approve first
            require(ERC20(token).transferFrom(from, to, amount));
        }
        return true;
    }

}