// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title DemoUSDC
/// @notice Test-only stand-in for USDC (6 decimals) so the demo can run full-size deals
///         on Monad testnet without faucet limits. The escrow accepts any ERC20,
///         including real Monad USDC.
contract DemoUSDC is ERC20 {
    constructor() ERC20("Telisik Demo USDC", "dUSDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
