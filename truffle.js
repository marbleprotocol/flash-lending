require('babel-register');
require('babel-polyfill');
const Infura = require('./infura');

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // Match any network id
      gas: 100000000, // High
      gasPrice: 0 //18000000000
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
        return new Infura('https://rinkeby.infura.io/');
      },
      network_id: 4
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
