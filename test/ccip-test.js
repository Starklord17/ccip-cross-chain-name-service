const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Cross Chain Name Service", function () {
  let simulator;
  let register;
  let receiver;
  let lookup;
  let routerAddress;
  let sourceChainSelector = 1;

  before(async () => {
    const [deployer, alice] = await ethers.getSigners();

    // Deploy CCIPLocalSimulator
    const CCIPLocalSimulator = await ethers.getContractFactory("CCIPLocalSimulator");
    simulator = await CCIPLocalSimulator.deploy();
    await simulator.deployed();

    // Get Router contract address from configuration
    const config = await simulator.configuration();
    routerAddress = config[1];

    // Deploy CrossChainNameServiceLookup
    const Lookup = await ethers.getContractFactory("CrossChainNameServiceLookup");
    lookup = await Lookup.deploy();
    await lookup.deployed();

    // Deploy CrossChainNameServiceRegister with all required arguments
    const Register = await ethers.getContractFactory("CrossChainNameServiceRegister");
    register = await Register.deploy(routerAddress, lookup.address);
    await register.deployed();

    // Deploy CrossChainNameServiceReceiver with all required arguments
    const Receiver = await ethers.getContractFactory("CrossChainNameServiceReceiver");
    receiver = await Receiver.deploy(routerAddress, lookup.address, sourceChainSelector);
    await receiver.deployed();

    // Enable the chain in the register contract
    const gasLimit = 1000000; // Define a reasonable gas limit
    await register.enableChain(sourceChainSelector, receiver.address, gasLimit);

    // Set CrossChainNameService addresses
    await lookup.setCrossChainNameServiceAddress(register.address);
    await lookup.setCrossChainNameServiceAddress(receiver.address);
  });

  it("Should register and lookup cross-chain name service", async () => {
    const [deployer, alice] = await ethers.getSigners();
    const name = "alice.ccns";
    const aliceAddress = alice.address;

    // Ensure the CrossChainNameServiceRegister contract is authorized to register names
    await lookup.setCrossChainNameServiceAddress(register.address);

    // Register name with the correct contract
    try {
      await register.register(name); 
    } catch (error) {
      console.error("Error during register:", error);
    }

    // Lookup name
    const registeredAddress = await lookup.lookup(name);

    // Assert that the returned address is Alice's EOA address
    expect(registeredAddress).to.equal(aliceAddress);
  });
});
