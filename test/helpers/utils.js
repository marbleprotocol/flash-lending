import BigNumber from "bignumber.js";

export const transactionCost = async (web3, result) => {
    const transaction = await web3.eth.getTransaction(result.tx);
    const txCost = BigNumber(transaction.gasPrice).times(BigNumber(result.receipt.cumulativeGasUsed));
    return txCost;
};