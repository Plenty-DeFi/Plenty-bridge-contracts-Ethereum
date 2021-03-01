const allParams = require('./params');

module.exports = function(callback) {
    (async () => {
        try {
            const params = allParams(await web3.eth.net.getNetworkType());
            const accounts = await web3.eth.getAccounts();
            const erc20Contract = new web3.eth.Contract(params.erc20ABI, params.erc20Address);
            await erc20Contract.methods.approve(params.contractAddress, web3.utils.toWei("100", 'ether')).send({
                from: accounts[0]
            });
        } catch (e) {
            console.log(e);
        }
        console.log("done");
        callback();
    })();
}