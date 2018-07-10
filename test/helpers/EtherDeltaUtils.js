const EtherDelta = artifacts.require("EtherDeltaExchange");
const EtherDeltaWrapper = artifacts.require("EtherDeltaWrapper");

export const deployEtherDelta = async (web3, owner) => {
  const etherDelta = await EtherDelta.new(owner, owner, "0x0", 0, 0, 0);

  const etherDeltaWrapper = await EtherDeltaWrapper.new(etherDelta.address);
  return {
    etherDelta,
    etherDeltaWrapper
  };
};