const params = require('./params');

module.exports = function(callback) {
    (async () => {
        try {
            const multisigContract = new web3.eth.Contract(params.wrapABI, params.contractAddress);
            const administrator = await multisigContract.methods.getAdministrator().call();
            const owners = await multisigContract.methods.getOwners().call();
            const threshold = await multisigContract.methods.getThreshold().call();
            console.log(`Administrator ${administrator}`);
            console.log(`Owners ${owners}`);
            console.log(`Threshold ${threshold}`);
        } catch (e) {
            console.log(e);
        }
        console.log("done");
        callback();
    })();
}