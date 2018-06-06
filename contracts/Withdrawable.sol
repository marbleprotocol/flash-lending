pragma solidity 0.4.24;
 
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


interface IERC20 {
    function balanceOf(address _owner) public view returns (uint balance);
    function transfer(address _to, uint _value) public returns (bool success);
}


contract Withdrawable is Ownable {
    // Allow the owner to withdraw Ether
    function withdraw() public onlyOwner {
        owner.transfer(address(this).balance);
    }
    
    // Allow the owner to withdraw tokens
    function withdrawToken(address token) public onlyOwner returns (bool) {
        IERC20 foreignToken = IERC20(token);
        uint256 amount = foreignToken.balanceOf(address(this));
        return foreignToken.transfer(owner, amount);
    }
}