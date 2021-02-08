const allParams = require('./params');

const signer = async function (multisigContract, confirmingAccounts, to, value, data, tezosTransaction) {
    let txHash = await multisigContract.methods.getTransactionHash(to, value, data, tezosTransaction).call()
    let signatureBytes = "0x"
    confirmingAccounts.sort();
    for (var i = 0; i < confirmingAccounts.length; i++) {
        let signature = (await web3.eth.sign(txHash, confirmingAccounts[i])).replace('0x', '');
        signatureBytes += signature;
    }
    return signatureBytes
}

module.exports = function(callback) {
    (async () => {
        try {
            const params = allParams(await web3.eth.net.getNetworkType());
            const accounts = await web3.eth.getAccounts();
            const multisigContract = new web3.eth.Contract(params.wrapABI, params.contractAddress);
            const erc721Contract = new web3.eth.Contract(params.erc721ABI, params.erc721Address);
            let signers = [accounts[0], accounts[2]];
            const destination = accounts[4];
            const tezosTransaction = "0x123457";
            let data = await erc721Contract.methods.safeTransferFrom(params.contractAddress, destination, params.erc721TokenId).encodeABI();
            let signatures = await signer(multisigContract, signers, params.erc721Address, 0, data, tezosTransaction);
            await multisigContract.methods.execTransaction(
                params.erc721Address, 0, data, tezosTransaction, signatures
            ).send({
                from: accounts[1],
                gas: 400000
            });
        } catch (e) {
            console.log(e);
        }
        console.log("done");
        callback();
    })();
}