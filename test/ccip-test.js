const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Cross Chain Name Service", function () {
  let simulator;
  let register;
  let receiver;
  let lookup;
  let routerAddress;
  let sourceChainSelector = 1; // Usa un valor más pequeño

  before(async () => {
    const [deployer, alice] = await ethers.getSigners();

    // Deploy CCIPLocalSimulator
    const CCIPLocalSimulator = await ethers.getContractFactory("CCIPLocalSimulator");
    simulator = await CCIPLocalSimulator.deploy();
    await simulator.deployed();

    // Get Router contract address from configuration
    const config = await simulator.configuration();
    routerAddress = config[1]; // Asegúrate de que este sea el valor correcto

    // Deploy CrossChainNameServiceLookup
    const Lookup = await ethers.getContractFactory("CrossChainNameServiceLookup");
    lookup = await Lookup.deploy(); // Aquí, el constructor no necesita argumentos
    await lookup.deployed();

    // Deploy CrossChainNameServiceRegister with all required arguments
    const Register = await ethers.getContractFactory("CrossChainNameServiceRegister");
    register = await Register.deploy(routerAddress, lookup.address); // Pasar todos los argumentos necesarios
    await register.deployed();

    // Deploy CrossChainNameServiceReceiver with all required arguments
    const Receiver = await ethers.getContractFactory("CrossChainNameServiceReceiver");
    receiver = await Receiver.deploy(routerAddress, lookup.address, sourceChainSelector); // Pasar todos los argumentos necesarios
    await receiver.deployed();

    // Set CrossChainNameService addresses
    await lookup.setCrossChainNameServiceAddress(register.address);
    await lookup.setCrossChainNameServiceAddress(receiver.address);
  });

  it("Should register and lookup cross-chain name service", async () => {
    const [deployer, alice] = await ethers.getSigners();
    const name = "alice.ccns";
    const aliceAddress = alice.address;

    // Register name
    await register.register(name);

    // Lookup name
    const registeredAddress = await lookup.lookup(name);

    // Assert that the returned address is Alice's EOA address
    expect(registeredAddress).to.equal(aliceAddress);
  });
});
