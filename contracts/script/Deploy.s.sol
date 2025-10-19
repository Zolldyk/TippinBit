// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/BorrowingVault.sol";

/**
 * @title Deploy Script for BorrowingVault
 * @notice Deploys BorrowingVault contract to Mezo Testnet
 *
 * Usage:
 * forge script script/Deploy.s.sol:DeployScript --rpc-url mezo_testnet --broadcast --verify -vvvv
 */
contract DeployScript is Script {
    function run() external {
        // Mezo Testnet addresses
        // Note: These need to be updated with actual Mezo testnet addresses
        address btcToken = vm.envOr("BTC_TOKEN_ADDRESS", address(0));
        address musdToken = vm.envOr("MUSD_TOKEN_ADDRESS", 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503);

        // When using --account flag, no need to get private key from env
        // Foundry will prompt for keystore password

        // Start broadcasting transactions
        // The account is already set by the --account flag in the forge script command
        vm.startBroadcast();

        // Deploy BorrowingVault
        console.log("Deploying BorrowingVault...");
        console.log("BTC Token:", btcToken);
        console.log("MUSD Token:", musdToken);

        BorrowingVault vault = new BorrowingVault(btcToken, musdToken);

        console.log("BorrowingVault deployed at:", address(vault));

        vm.stopBroadcast();

        // Save deployment info
        console.log("\n=== Deployment Complete ===");
        console.log("BorrowingVault:", address(vault));
        console.log("\nUpdate your .env.local with:");
        console.log("NEXT_PUBLIC_BORROWING_VAULT_ADDRESS_TESTNET=%s", address(vault));
    }
}
