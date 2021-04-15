import { expect, assert } from "chai";
import hre, { deployments, waffle } from "hardhat";
import "@nomiclabs/hardhat-ethers";
import {BigNumber} from "ethers";

describe("Ethers wrap", async () => {

    const accounts = waffle.provider.getWallets();

    const deployMultisig = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture();
        const multisigDeployment = await deployments.get("WrapMultisig");
        const multisig = await hre.ethers.getContractFactory("WrapMultisig");
        const contract = multisig.attach(multisigDeployment.address);
        return contract.connect(accounts[4]);
    })

    it('should decline eth payment', async () => {
        const multisig = await deployMultisig();
        await multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2);

        let failed;
        try {
            await accounts[0].sendTransaction({value: BigNumber.from('1'), to: multisig.address, gasLimit: 21000});
        } catch (e) {
            failed = true;
        } finally {
            expect(failed).to.be.true;
        }
    })
})