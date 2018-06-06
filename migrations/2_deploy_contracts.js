const QuoteToken = artifacts.require("ETH");
const BaseToken = artifacts.require("ZRX");
const PriceToken = artifacts.require("PriceToken");
const CreditToken = artifacts.require("CreditToken");
const MarginToken = artifacts.require("MarginToken");
const MockAuction = artifacts.require("MockAuction");
const Lender = artifacts.require("MarginLender");

const INITIAL_SUPPLY = 1000 * 10 ** 18;
const INTEREST_RATE = 1000; // 10%
const LEVERAGE = 1; // 1X
const INITIAL_PRICE = 1 * 10 ** 18;

module.exports = (deployer, network, accounts) => {
    const lender = accounts[0];
    const shortSeller = accounts[1];
    const market = accounts[2];

    return deployer.deploy(Lender).then(async () => {
        await deployer.deploy(BaseToken, [lender, market], [INITIAL_SUPPLY, INITIAL_SUPPLY]);
        await deployer.deploy(QuoteToken, [shortSeller, market], [INITIAL_SUPPLY, INITIAL_SUPPLY]);
        await deployer.deploy(MockAuction, Lender.address);
        await deployer.deploy(CreditToken, BaseToken.address, Lender.address);
        await deployer.deploy(MarginToken, BaseToken.address, QuoteToken.address, 1, MockAuction.address);
    });
};