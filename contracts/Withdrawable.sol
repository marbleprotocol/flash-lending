pragma solidity 0.4.24;
 
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


contract ForeignToken {
    function balanceOf(address _owner) public view returns (uint256);
    function transfer(address _to, uint256 _value) public returns (bool);
}


contract Withdrawable is Ownable {
    // Allow the owner to withdraw Ether
    function withdraw() public onlyOwner {
        owner.transfer(address(this).balance);
    }
    
    // Allow the owner to withdraw tokens
    function withdrawTokens(address token) public onlyOwner returns (bool) {
        ForeignToken foreignToken = ForeignToken(token);
        uint256 amount = foreignToken.balanceOf(address(this));
        return foreignToken.transfer(owner, amount);
    }
}