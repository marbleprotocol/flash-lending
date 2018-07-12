const LedgerWalletSubproviderFactory = require('ledger-wallet-provider').default;
const ProviderEngine = require('web3-provider-engine');
const FiltersSubprovider = require('web3-provider-engine/subproviders/filters.js');
const FetchSubprovider = require('web3-provider-engine/subproviders/fetch.js');
require('dotenv').config();

var ledgerWalletSubProvider = async LedgerWalletSubproviderFactory();

class Ledger {
  constructor(infuraURL) {
    this.engine = new ProviderEngine();
    this.engine.addProvider(ledgerWalletSubProvider);
    this.engine.addProvider(new FiltersSubprovider());
    this.engine.addProvider(new FetchSubprovider({ rpcUrl: infuraURL }));
    this.engine.start(); // Required by the provider engine.
  }

  sendAsync() {
    this.engine.sendAsync.apply(this.engine, arguments);
  }

  send() {
    return this.engine.send.apply(this.engine, arguments);
  }

  getAddress() {
    return this.address;
  }
}

module.exports = Ledger;
