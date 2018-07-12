const ZeroExWrapper = artifacts.require('ZeroExWrapper');
const BancorWrapper = artifacts.require('BancorWrapper');
const KyberWrapper = artifacts.require('KyberWrapper');
const EtherDeltaWrapper = artifacts.require('EtherDeltaWrapper');

const zeroExExchange = '0x12459C951127e0c374FF9105DdA097662A027093';
const zeroExTokenTransferProxy = '0x8da0D80f5007ef1e431DD2127178d224E32C2eF4';
const zeroExWETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

const kyberNetworkProxy = '0x818E6FECD516Ecc3849DAf6845e3EC868087B755';

const etherDeltaExchange = '0x8d12A197cB00D4747a1fe03395095ce2A5CC6819';

module.exports = function(deployer) {
  const wrapperPromises = [
    // deployer.deploy(ZeroExWrapper, zeroExExchange, zeroExTokenTransferProxy, zeroExWETH),
    deployer.deploy(KyberWrapper, kyberNetworkProxy)
    // deployer.deploy(BancorWrapper),
    // deployer.deploy(EtherDeltaWrapper, etherDeltaExchange)
  ];
  return Promise.all(wrapperPromises);
};
