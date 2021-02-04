const params = require('./params');

module.exports = function(callback) {
    (async () => {
        try {
            const accounts = await web3.eth.getAccounts();
            const multisigContract = new web3.eth.Contract(params.wrapABI, params.contractAddress);
            for (let i = 0; i < 3; i++) {
                const data = multisigContract.methods.wrapERC20(params.erc20Address, web3.utils.toWei((1.12345*(i+1)).toString(), 'ether'), params.tezosDestinationAddress).encodeABI();
                await web3.eth.sendTransaction({
                    from: accounts[0],
                    to: params.contractAddress,
                    value: 0,
                    data: data,
                    gas: 400000
                });
            }
        } catch (e) {
            console.log(e);
        }
        console.log("done");
        callback();
    })();
}