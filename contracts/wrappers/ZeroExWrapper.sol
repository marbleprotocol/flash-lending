pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "../interface/WETH.sol";
import "../interface/ZeroEx.sol";
import "./ExchangeWrapper.sol";
import "../../Transfer.sol";


contract ZeroExWrapper is ExchangeWrapper, Transfer {

    address public weth; // Wrapped Ether
    address public proxy; // Token transfer proxy
    uint256 constant public MAX_UINT = uint(-1);

    constructor(address _exchange, address _weth, address _proxy) public {
        exchange = _exchange;
        weth = _weth;
        proxy = _proxy;

        // Approve the token transfer proxy to spend the maximum amount of WETH
        WETH(weth).approve(proxy, MAX_UINT);
    }

    function getTokens(
        address[5] orderAddresses,
        uint[6] orderValues,
        uint8 v,
        bytes32 r,
        bytes32 s
    )
        public
        payable
    {
        // Convert to wrapped ETH
        WETH(weth).deposit.value(msg.value)();
        
        ZeroEx(exchange).fillOrder(
            orderAddresses,
            orderValues,
            msg.value, // fillTakerTokenAmount
            true, // shouldThrowOnInsufficientBalanceOrAllowance
            v,
            r,
            s
        );

        // Send tokens to trade executor
        address makerToken = orderAddresses[2];
        uint256 balance = ERC20(makerToken).balanceOf(this);
        transfer(makerToken, msg.sender, balance);
    }

    function getEther(
        address[5] orderAddresses,
        uint[6] orderValues,
        uint8 v,
        bytes32 r,
        bytes32 s
    )
        public
    {
        // https://etherscan.io/address/0x12459c951127e0c374ff9105dda097662a027093#code
        address takerToken = orderAddresses[3];
        // Use the full balance of tokens transferred from the trade executor
        uint256 fillTakerTokenAmount = ERC20(takerToken).balanceOf(this);
        // Approve the exchange to transfer tokens from this contract to the maker
        ERC20(takerToken).approve(proxy, fillTakerTokenAmount);

        ZeroEx(exchange).fillOrder(
            orderAddresses,
            orderValues,
            fillTakerTokenAmount,
            true, // shouldThrowOnInsufficientBalanceOrAllowance
            v,
            r,
            s
        );

        uint256 balance = WETH(weth).balanceOf(this);
        // Unwrap wrapped Ether
        WETH(weth).withdraw(balance);

        // Send Ether to trade executor
        transfer(ETH, msg.sender, balance);
    }

}
