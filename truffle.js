require('babel-register');
require('babel-polyfill');
const Infura = require('./infura');
const Ledger = require('./ledger');

const Web3 = require('web3');
const web3 = new Web3();

const ledgerOptions = {
  // networkId: 4, // mainnet
  // path: "44'/60'/0'/0", // ledger default derivation path
  // askConfirm: true,
  // accountsLength: 1,
  // accountsOffset: 0
};

const GAS_PRICE = 12; // gwei

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // Match any network id
      gas: 100000000, // High
      gasPrice: 0 //18000000000
    },
    abc: {
      provider: () => {
        return new Ledger('http://localhost:8545');
      },
      network_id: '*',
      gas: 4600000,
      gasPrice: web3.utils.toWei(`${GAS_PRICE}`, 'gwei')
    },
    mainnet: {
      provider: () => {
        return new Infura('https://mainnet.infura.io/');
      },
      network_id: 1
    },
    ropsten: {
      provider: () => {
        return new Infura('https://ropsten.infura.io/');
      },
      network_id: 3
    },
    rinkeby: {
      provider: () => {
        return new LedgerWalletProvider(
          ledgerOptions,
          `https://rinkeby.infura.io/${process.env.INFURA_ACCESS_TOKEN}`
        );
      },
      network_id: 4,
      gas: 4600000,
      gasPrice: web3.utils.toWei(`${GAS_PRICE}`, 'gwei')
    },
    kovan: {
      provider: () => {
        return new Infura('https://kovan.infura.io/');
      },
      network_id: 42
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 5000000
    }
  },
  mocha: {
    timeout: 10000,
    reporter: 'eth-gas-reporter',
    reporterOptions: {
      currency: 'USD'
    }
  }
};
