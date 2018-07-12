const ZeroExWrapper = artifacts.require('ZeroExWrapper');
const BancorWrapper = artifacts.require('BancorWrapper');
const KyberWrapper = artifacts.require('KyberWrapper');
const EtherDeltaWrapper = artifacts.require('EtherDeltaWrapper');

module.exports = function(deployer) {
  const wrapperPromises = [deployer.deploy()];
};
