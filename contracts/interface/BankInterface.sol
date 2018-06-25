pragma solidity 0.4.24;


contract BankInterface {
    function totalSupplyOf(address token) public view returns (uint256 balance);
    function borrowFor(address token, address borrower, uint256 amount) public;
    function repay(address token, uint256 amount) external payable;
}