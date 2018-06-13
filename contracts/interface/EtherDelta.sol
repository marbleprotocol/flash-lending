pragma solidity 0.4.24;

contract EtherDelta {
    function balanceOf(address token, address user) public view returns (uint);
    function deposit() public payable;
    function depositToken(address token, uint amount) public;
    function trade(
        address tokenGet,
        uint amountGet,
        address tokenGive,
        uint amountGive,
        uint expires,
        uint nonce,
        address user,
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint amount) public;
    function withdraw(uint amount) public;
    function withdrawToken(address token, uint amount) public;
}
