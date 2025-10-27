import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const FactoryModule = buildModule("FactoryModule", (m) => {
  const factory = m.contract("SomixNFTFactory", []);

  return { factory };
});

export default FactoryModule;

