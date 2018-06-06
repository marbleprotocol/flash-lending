var Wallet = require("ethereumjs-wallet");
var ProviderEngine = require("web3-provider-engine");
var FiltersSubprovider = require("web3-provider-engine/subproviders/filters.js");
var WalletSubprovider = require("web3-provider-engine/subproviders/wallet.js");
const FetchSubprovider = require("web3-provider-engine/subproviders/fetch.js");
require("dotenv").config();

class Infura {
    constructor(infuraURL) {
        var privateKeyBuffer = new Buffer(process.env.PRIVATE_KEY, "hex");
        this.wallet = new Wallet(privateKeyBuffer);
        this.address = "0x" + this.wallet.getAddress().toString("hex");
        this.engine = new ProviderEngine();
        this.engine.addProvider(new WalletSubprovider(this.wallet, {}));
        this.engine.addProvider(new FiltersSubprovider());
        this.engine.addProvider(
            new FetchSubprovider({ rpcUrl: infuraURL + process.env.INFURA_ACCESS_TOKEN })
        );
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

module.exports = Infura;