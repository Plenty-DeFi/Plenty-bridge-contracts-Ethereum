const {createERC20Contract, createERC721Contract} = require('../test/utils/helper');
const allParams = require('./params');

module.exports = function (callback) {
    (async () => {
        try {
            const params = allParams(await web3.eth.net.getNetworkType());
            const accounts = await web3.eth.getAccounts();
            const {address: erc20} = await createERC20Contract(web3, accounts[0])
            const {address: erc721} = await createERC721Contract(web3, accounts[0])
            console.log(`ERC20 at ${erc20}`);
            console.log(`ERC721 at ${erc721}`);
            let contractAddress = process.env.WRAP_CONTRACT;
            console.log(`Wrap address ${contractAddress}`);
            const multisigContract = new web3.eth.Contract(params.wrapABI, contractAddress);
            const testToken = new web3.eth.Contract(params.erc20ABI, erc20);
            const nftToken = new web3.eth.Contract(params.erc721ABI, erc721);

            console.log("transfer");
            await testToken.methods.transfer(accounts[1], 10000000).send({from: accounts[0]})
            console.log("approve");
            await testToken.methods.approve(contractAddress, 10000000).send({from: accounts[1]});
            console.log("mint");
            await nftToken.methods.mint(accounts[1], 1337).send({from: accounts[0]});
            console.log("approve")
            await nftToken.methods.setApprovalForAll(contractAddress, true).send({from: accounts[1]});
            console.log("wrap erc20");
            const tx = await multisigContract.methods
                .wrapERC20(erc20, 10000000, "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb")
                .send({from: accounts[1]});
            console.log(tx);
            console.log("wrap erc721");
            const tx2 = await multisigContract.methods
                .wrapERC721(erc721, 1337, "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb")
                .send({from: accounts[1]});
            console.log(tx2);

        } catch (e) {
            callback(e);
        }
        console.log("done");
        callback();
    })();
}