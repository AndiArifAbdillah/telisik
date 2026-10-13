// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {AttestationRegistry} from "./AttestationRegistry.sol";

/// @title TelisikEscrow
/// @notice Holds investor funds and releases them tranche by tranche. A tranche can only
///         be released when the latest attestation for it passed, or through a GP override
///         whose reason is recorded onchain. The verifier can propose a freeze but can never
///         move money.
contract TelisikEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum TrancheState { Locked, Reported, Released, Frozen, Refunded }

    struct Deal {
        address gp;
        address startup;
        IERC20 token;
        uint256 deposited;
        uint256 released;
        bool frozen;
        uint256 trancheCount;
    }

    struct Tranche {
        uint256 amount;
        bytes32 reportHash;
        TrancheState state;
    }

    AttestationRegistry public immutable registry;
    uint256 public dealCount;
    mapping(uint256 => Deal) public deals;
    mapping(uint256 => mapping(uint256 => Tranche)) public tranches;

    event DealCreated(uint256 indexed dealId, address indexed gp, address indexed startup, address token, uint256 total, uint256 trancheCount);
    event Deposited(uint256 indexed dealId, uint256 amount);
    event ReportSubmitted(uint256 indexed dealId, uint256 indexed tranche, bytes32 reportHash);
    event Released(uint256 indexed dealId, uint256 indexed tranche, uint256 amount, uint256 attestationId);
    event OverrideReleased(uint256 indexed dealId, uint256 indexed tranche, uint256 amount, string reason);
    event FreezeProposed(uint256 indexed dealId, address indexed by, string reason);
    event Frozen(uint256 indexed dealId, string reason);
    event Refunded(uint256 indexed dealId, uint256 amount);

    error NotGP();
    error NotStartup();
    error NotVerifier();
    error BadDeal();
    error BadTranche();
    error WrongState();
    error DealFrozen();
    error NotFunded();
    error NoPassingAttestation();
    error EmptyReason();

    constructor(AttestationRegistry registry_) {
        registry = registry_;
    }

    modifier onlyGP(uint256 dealId) {
        if (msg.sender != deals[dealId].gp) revert NotGP();
        _;
    }

    function subjectOf(uint256 dealId, uint256 tranche) public view returns (bytes32) {
        return keccak256(abi.encode(address(this), dealId, tranche));
    }

    function createDeal(address startup, IERC20 token, uint256[] calldata amounts) external returns (uint256 dealId) {
        if (startup == address(0) || amounts.length == 0) revert BadDeal();
        dealId = ++dealCount;
        Deal storage d = deals[dealId];
        d.gp = msg.sender;
        d.startup = startup;
        d.token = token;
        d.trancheCount = amounts.length;
        uint256 sum;
        for (uint256 i = 0; i < amounts.length; i++) {
            if (amounts[i] == 0) revert BadDeal();
            tranches[dealId][i + 1].amount = amounts[i];
            sum += amounts[i];
        }
        emit DealCreated(dealId, msg.sender, startup, address(token), sum, amounts.length);
    }

    function total(uint256 dealId) public view returns (uint256 sum) {
        uint256 n = deals[dealId].trancheCount;
        for (uint256 i = 1; i <= n; i++) sum += tranches[dealId][i].amount;
    }

    function deposit(uint256 dealId, uint256 amount) external nonReentrant onlyGP(dealId) {
        Deal storage d = deals[dealId];
        if (d.frozen) revert DealFrozen();
        d.deposited += amount;
        d.token.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposited(dealId, amount);
    }

    /// @notice The first tranche is usually released on signing, without a report.
    function releaseOnSigning(uint256 dealId) external nonReentrant onlyGP(dealId) {
        _release(dealId, 1, type(uint256).max);
    }

    function submitReport(uint256 dealId, uint256 tranche, bytes32 reportHash) external {
        Deal storage d = deals[dealId];
        if (msg.sender != d.startup) revert NotStartup();
        if (d.frozen) revert DealFrozen();
        Tranche storage t = tranches[dealId][tranche];
        if (tranche == 0 || tranche > d.trancheCount) revert BadTranche();
        if (t.state != TrancheState.Locked) revert WrongState();
        t.reportHash = reportHash;
        t.state = TrancheState.Reported;
        emit ReportSubmitted(dealId, tranche, reportHash);
    }

    /// @notice Release a reported tranche. Requires the latest attestation for it to have passed
    ///         and to cover the exact report the startup submitted.
    function release(uint256 dealId, uint256 tranche) external nonReentrant onlyGP(dealId) {
        Tranche storage t = tranches[dealId][tranche];
        if (t.state != TrancheState.Reported) revert WrongState();
        uint256[] memory ids = registry.idsForSubject(subjectOf(dealId, tranche));
        if (ids.length == 0) revert NoPassingAttestation();
        uint256 id = ids[ids.length - 1];
        AttestationRegistry.Attestation memory a = registry.get(id);
        if (!a.passed || a.dataHash != t.reportHash) revert NoPassingAttestation();
        _release(dealId, tranche, id);
    }

    /// @notice GP releases despite a failed check. The reason is public and permanent.
    function overrideRelease(uint256 dealId, uint256 tranche, string calldata reason) external nonReentrant onlyGP(dealId) {
        if (bytes(reason).length == 0) revert EmptyReason();
        if (tranches[dealId][tranche].state != TrancheState.Reported) revert WrongState();
        uint256 amount = tranches[dealId][tranche].amount;
        _release(dealId, tranche, type(uint256).max);
        emit OverrideReleased(dealId, tranche, amount, reason);
    }

    /// @notice Anyone the registry trusts as a verifier can propose a freeze; only the GP freezes.
    function proposeFreeze(uint256 dealId, string calldata reason) external {
        if (!registry.isVerifier(msg.sender)) revert NotVerifier();
        emit FreezeProposed(dealId, msg.sender, reason);
    }

    function freeze(uint256 dealId, string calldata reason) external onlyGP(dealId) {
        Deal storage d = deals[dealId];
        if (d.frozen) revert DealFrozen();
        d.frozen = true;
        for (uint256 i = 1; i <= d.trancheCount; i++) {
            Tranche storage t = tranches[dealId][i];
            if (t.state == TrancheState.Locked || t.state == TrancheState.Reported) t.state = TrancheState.Frozen;
        }
        emit Frozen(dealId, reason);
    }

    function refund(uint256 dealId) external nonReentrant onlyGP(dealId) {
        Deal storage d = deals[dealId];
        if (!d.frozen) revert WrongState();
        uint256 amount = d.deposited - d.released;
        d.deposited = d.released;
        for (uint256 i = 1; i <= d.trancheCount; i++) {
            Tranche storage t = tranches[dealId][i];
            if (t.state == TrancheState.Frozen) t.state = TrancheState.Refunded;
        }
        d.token.safeTransfer(d.gp, amount);
        emit Refunded(dealId, amount);
    }

    function _release(uint256 dealId, uint256 tranche, uint256 attestationId) private {
        Deal storage d = deals[dealId];
        if (d.frozen) revert DealFrozen();
        if (tranche == 0 || tranche > d.trancheCount) revert BadTranche();
        Tranche storage t = tranches[dealId][tranche];
        if (t.state == TrancheState.Released || t.state == TrancheState.Frozen || t.state == TrancheState.Refunded) revert WrongState();
        if (d.deposited - d.released < t.amount) revert NotFunded();
        t.state = TrancheState.Released;
        d.released += t.amount;
        d.token.safeTransfer(d.startup, t.amount);
        emit Released(dealId, tranche, t.amount, attestationId);
    }
}
