const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Cross Chain Name Service", function () {
  let simulator;
  let routerAddress;
  let register;
  let receiver;
  let lookup;

  before(async () => {
    const [deployer] = await ethers.getSigners();

    // Deploy CCIPLocalSimulator
    const CCIPLocalSimulator = await ethers.getContractFactory("CCIPLocalSimulator");
    simulator = await CCIPLocalSimulator.deploy();
    await simulator.deployed();

    // Get Router contract address
    routerAddress = await simulator.configuration();

    // Deploy CrossChainNameServiceRegister
    const Register = await ethers.getContractFactory("CrossChainNameServiceRegister");
    register = await Register.deploy(routerAddress);
    await register.deployed();

    // Deploy CrossChainNameServiceReceiver
    const Receiver = await ethers.getContractFactory("CrossChainNameServiceReceiver");
    receiver = await Receiver.deploy(routerAddress);
    await receiver.deployed();

    // Deploy CrossChainNameServiceLookup
    const Lookup = await ethers.getContractFactory("CrossChainNameServiceLookup");
    lookup = await Lookup.deploy(routerAddress);
    await lookup.deployed();

    // Enable chains
    await register.enableChain(1);
    await receiver.enableChain(1);

    // Set CrossChainNameService addresses
    await lookup.setCrossChainNameServiceAddress(1, register.address);
    await lookup.setCrossChainNameServiceAddress(2, receiver.address);
  });

  it("Should register and lookup cross-chain name service", async () => {
    const [deployer, alice] = await ethers.getSigners();
    const name = "alice.ccns";
    const aliceAddress = alice.address;

    // Register name
    await register.register(name, aliceAddress);

    // Lookup name
    const registeredAddress = await lookup.lookup(name);

    // Assert that the returned address is Alice's EOA address
    expect(registeredAddress).to.equal(aliceAddress);
  });
});
