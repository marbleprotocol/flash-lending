const FlashLender = artifacts.require('FlashLender');
const Arbitrage = artifacts.require('Arbitrage');
const TradeExecutor = artifacts.require('TradeExecutor');

const bankAddress = '0xa04e5b78fbd31caec8f8af126d00a57f56c1f7ae';

module.exports = function(deployer) {
  deployer
    .deploy(FlashLender, bankAddress, 0)
    .then(() => {
      return deployer.deploy(TradeExecutor);
    })
    .then(() => {
      return deployer.deploy(Arbitrage, FlashLender.address, 0);
    });
};
