const solc = require('solc');
const ercContracts = require('./testTokens');

const ethSign = async (account, hash) => {
    return new Promise(function (resolve, reject) {
        web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "eth_sign",
            params: [account, hash],
            id: new Date().getTime()
        }, function(err, response) {
            if (err) {
                return reject(err);
            }
            resolve(response.result);
        });
    });
}

function checkTxEvent(transaction, eventName, contract, exists) {
    let logs = transaction.logs
    if(eventName != null) {
        logs = logs.filter((l) => l.event === eventName && l.address === contract)
    }
    assert.equal(logs.length, exists ? 1 : 0, exists ? 'event was not present' : 'event should not be present')
    return exists ? logs[0] : null
}

async function compile(source) {
    var input = JSON.stringify({
        'language': 'Solidity',
        'settings': {
            'outputSelection': {
                '*': {
                    '*': [ 'abi', 'evm.bytecode' ]
                }
            }
        },
        'sources': {
            'tmp.sol': {
                'content': source
            }
        }
    });
    let solcData = await solc.compile(input);
    let output = JSON.parse(solcData);
    if (!output['contracts']) {
        throw Error("Could not compile contract")
    }
    let fileOutput = output['contracts']['tmp.sol']
    let contractOutput = fileOutput[Object.keys(fileOutput)[0]]
    let interface = contractOutput['abi']
    let data = '0x' + contractOutput['evm']['bytecode']['object']
    return {
        "data": data,
        "interface": interface
    }
}

const createContract = async (web3, account, contractCode) => {
    let output = await compile(contractCode);
    let tx = await web3.eth.sendTransaction({from: account, data: output.data, gas: 4000000})
    let receipt = await web3.eth.getTransactionReceipt(tx.transactionHash)
    return {
        address: receipt.contractAddress,
        contract: new web3.eth.Contract(output.interface, receipt.contractAddress)
    }
}

const createERC20Contract = async (web3, account) => {
    return createContract(web3, account, ercContracts.erc20Contract);
}

const createERC721Contract = async (web3, account) => {
    return createContract(web3, account, ercContracts.erc721Contract);
}

module.exports = {
    ethSign,
    checkTxEvent,
    compile,
    createERC20Contract,
    createERC721Contract
}