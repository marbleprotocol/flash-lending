pragma solidity 0.4.24;

import "../Withdrawable.sol";
import "../interface/Bancor.sol";

contract BancorWrapper is Withdrawable {

    uint256 public constant MAX_UINT = uint(-1);

    function getTokens(
        address converter,
        IERC20Token[] _path,
        uint256 _minReturn
    )
        external
        payable
    {
        Bancor(converter).quickConvert.value(msg.value)(_path, msg.value, _minReturn);
        // Get the last token in the token path
        IERC20Token token = _path[_path.length - 1];
        uint256 balance = token.balanceOf(address(this));
        token.transfer(msg.sender, balance);
    }

    function getEther(
        address converter,
        IERC20Token[] _path,
        uint256 _minReturn
    )
        external
    {
        // Get the first token in the token path
        IERC20Token token = _path[0];
        uint256 balance = token.balanceOf(address(this));

        if (IERC20Token(token).allowance(this, converter) < balance) {
            IERC20Token(token).approve(converter, MAX_UINT);
        }

        Bancor(converter).quickConvert(_path, balance, _minReturn);
        msg.sender.transfer(address(this).balance);
    }

}
