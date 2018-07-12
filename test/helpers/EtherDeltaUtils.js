const EtherDelta = artifacts.require("EtherDeltaExchange");
const EtherDeltaWrapper = artifacts.require("EtherDeltaWrapper");

export class EtherDeltaUtils {
  constructor(web3) {
    this.web3 = web3;
  }

  async init() {
    this.etherDelta = await EtherDelta.new("0x0", "0x0", "0x0", 0, 0, 0);
    this.etherDeltaWrapper = await EtherDeltaWrapper.new(this.etherDelta.address);
    this.etherDeltaWrapperContract = new this.web3.eth.Contract(
      EtherDeltaWrapper.abi,
      this.etherDeltaWrapper.address
    );
  }
}
