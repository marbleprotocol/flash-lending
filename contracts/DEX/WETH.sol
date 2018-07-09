pragma solidity 0.4.24;


contract WETH {
    mapping (address => uint) public balanceOf;
    function deposit() public payable;
    function withdraw(uint wad) public;
    function approve(address guy, uint wad) public returns (bool);
}