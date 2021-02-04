const params = require('./params');

const signer = async function (multisigContract, confirmingAccounts, txHash) {
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
            const contractAddress = process.env.CONTRACT_ADDRESS;
            const erc20Address = process.env.CONTRACT_ADDRESS;
            const accounts = await web3.eth.getAccounts();
            const multisigContract = new web3.eth.Contract(params.wrapABI, contractAddress);
            const erc20Contract = new web3.eth.Contract(params.erc20ABI, erc20Address);
            let signers = [accounts[0]];
            const destination = accounts[1];
            const tezosTransaction = "ooLfc6nEYiHH7jUfGHLahCuPS7YkQRyNNt3Thamoy24664EFtDK";
            let data = await erc20Contract.methods.transfer(destination, 10).encodeABI();
            let txHash = await multisigContract.methods
                .getTransactionHash(destination, 0, data, Buffer.from(tezosTransaction)).call()
            let signature = await signer(multisigContract, signers, txHash);
            console.log(`Destination: ${accounts[1]}`)
            console.log(`Hash: ${txHash}`);
            console.log(`Signature: ${signature}`)
        } catch (e) {
            callback(e);
        }
        console.log("done");
        callback();
    })();
}