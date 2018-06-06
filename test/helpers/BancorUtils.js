const BancorConverter = artifacts.require("BancorConverter.sol");
const SmartToken = artifacts.require("SmartToken.sol");
const BancorFormula = artifacts.require("BancorFormula.sol");
const BancorGasPriceLimit = artifacts.require("BancorGasPriceLimit.sol");
const BancorQuickConverter = artifacts.require("BancorQuickConverter.sol");
const BancorConverterExtensions = artifacts.require("BancorConverterExtensions.sol");
const EtherToken = artifacts.require("EtherToken.sol");
const TestERC20Token = artifacts.require("TestERC20Token.sol");
const BancorWrapper = artifacts.require("BancorWrapper.sol");

let etherToken;
let smartToken1;
let smartToken2;
let smartToken3;
let smartToken4;
let erc20Token;
let converterExtensionsAddress;
let converter1;
let converter2;
let converter3;
let converter4;
let quickConverter;
let smartToken1QuickBuyPath;
let smartToken2QuickBuyPath;
let smartToken3QuickBuyPath;
let smartToken4QuickBuyPath;
let erc20QuickBuyPath;
let smartToken1QuickSellPath;
let smartToken2QuickSellPath;
let bancorWrapper;

export const deployBancor = async accounts => {
    let formula = await BancorFormula.new();
    let gasPriceLimit = await BancorGasPriceLimit.new(22000000000);
    quickConverter = await BancorQuickConverter.new();
    await quickConverter.setGasPriceLimit(gasPriceLimit.address);
    await quickConverter.setSignerAddress(accounts[3]);
    let converterExtensions = await BancorConverterExtensions.new(
        formula.address,
        gasPriceLimit.address,
        quickConverter.address
    );
    converterExtensionsAddress = converterExtensions.address;

    etherToken = await EtherToken.new();
    await etherToken.deposit({ value: 10000000 });

    await quickConverter.registerEtherToken(etherToken.address, true);

    smartToken1 = await SmartToken.new("Token1", "TKN1", 2);
    await smartToken1.issue(accounts[0], 1000000);

    smartToken2 = await SmartToken.new("Token2", "TKN2", 2);
    await smartToken2.issue(accounts[0], 2000000);

    smartToken3 = await SmartToken.new("Token3", "TKN3", 2);
    await smartToken3.issue(accounts[0], 3000000);

    smartToken4 = await SmartToken.new("Token4", "TKN4", 2);
    await smartToken4.issue(accounts[0], 2500000);

    erc20Token = await TestERC20Token.new("ERC20Token", "ERC5", 1000000);

    converter1 = await BancorConverter.new(
        smartToken1.address,
        converterExtensionsAddress,
        0,
        etherToken.address,
        250000
    );
    converter1.address = converter1.address;

    converter2 = await BancorConverter.new(
        smartToken2.address,
        converterExtensionsAddress,
        0,
        smartToken1.address,
        300000
    );
    converter2.address = converter2.address;
    await converter2.addConnector(smartToken3.address, 150000, false);

    converter3 = await BancorConverter.new(
        smartToken3.address,
        converterExtensionsAddress,
        0,
        smartToken4.address,
        350000
    );
    converter3.address = converter3.address;

    converter4 = await BancorConverter.new(
        smartToken4.address,
        converterExtensionsAddress,
        0,
        etherToken.address,
        150000
    );
    converter4.address = converter4.address;
    await converter4.addConnector(erc20Token.address, 220000, false);

    await etherToken.transfer(converter1.address, 50000);
    await smartToken1.transfer(converter2.address, 40000);
    await smartToken3.transfer(converter2.address, 25000);
    await smartToken4.transfer(converter3.address, 30000);
    await etherToken.transfer(converter4.address, 20000);
    await erc20Token.transfer(converter4.address, 35000);

    await smartToken1.transferOwnership(converter1.address);
    await converter1.acceptTokenOwnership();

    await smartToken2.transferOwnership(converter2.address);
    await converter2.acceptTokenOwnership();

    await smartToken3.transferOwnership(converter3.address);
    await converter3.acceptTokenOwnership();

    await smartToken4.transferOwnership(converter4.address);
    await converter4.acceptTokenOwnership();

    smartToken1QuickBuyPath = [etherToken.address, smartToken1.address, smartToken1.address];
    smartToken2QuickBuyPath = [
        etherToken.address,
        smartToken1.address,
        smartToken1.address,
        smartToken2.address,
        smartToken2.address
    ];
    smartToken3QuickBuyPath = [
        etherToken.address,
        smartToken4.address,
        smartToken4.address,
        smartToken3.address,
        smartToken4.address
    ];
    smartToken4QuickBuyPath = [etherToken.address, smartToken4.address, smartToken4.address];
    erc20QuickBuyPath = [etherToken.address, smartToken4.address, erc20Token.address];

    await converter1.setQuickBuyPath(smartToken1QuickBuyPath);
    await converter2.setQuickBuyPath(smartToken2QuickBuyPath);
    await converter3.setQuickBuyPath(smartToken3QuickBuyPath);
    await converter4.setQuickBuyPath(smartToken4QuickBuyPath);

    smartToken1QuickSellPath = [smartToken1.address, smartToken1.address, etherToken.address];
    smartToken2QuickSellPath = [
        smartToken2.address,
        smartToken2.address,
        smartToken1.address,
        smartToken1.address,
        etherToken.address
    ];

    bancorWrapper = await BancorWrapper.new(converter1.address);
    await bancorWrapper.approve(smartToken1.address, converter1.address);
    return {
        etherToken,
        smartToken1,
        smartToken2,
        smartToken3,
        smartToken4,
        erc20Token,
        converterExtensionsAddress,
        converter1,
        converter2,
        converter3,
        converter4,
        quickConverter,
        smartToken1QuickBuyPath,
        smartToken2QuickBuyPath,
        smartToken3QuickBuyPath,
        smartToken4QuickBuyPath,
        erc20QuickBuyPath,
        smartToken1QuickSellPath,
        smartToken2QuickSellPath,
        bancorWrapper
    };
};