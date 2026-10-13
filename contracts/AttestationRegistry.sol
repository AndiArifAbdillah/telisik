// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

/// @title AttestationRegistry
/// @notice Append-only record of verification results. Raw data stays offchain;
///         only hashes, the risk score and the decision model are stored.
contract AttestationRegistry {
    struct Attestation {
        bytes32 subject;     // keccak256(escrow, dealId, tranche) or a procurement package id
        bytes32 dataHash;    // hash of the report that was checked
        bytes32 resultHash;  // hash of the full verification result (findings + evidence)
        uint8 riskScore;     // 0 (clean) .. 4 (large, patterned gaps)
        bool passed;
        string model;        // decision model and version, e.g. "rules-v1" or "jev-1.13-free"
        address verifier;
        uint64 timestamp;
    }

    address public owner;
    mapping(address => bool) public isVerifier;
    Attestation[] private _attestations;
    mapping(bytes32 => uint256[]) private _bySubject;

    event VerifierSet(address indexed verifier, bool allowed);
    event Recorded(
        uint256 indexed id,
        bytes32 indexed subject,
        bytes32 dataHash,
        bytes32 resultHash,
        uint8 riskScore,
        bool passed,
        string model,
        address verifier
    );

    error NotOwner();
    error NotVerifier();
    error BadScore();

    constructor(address verifier) {
        owner = msg.sender;
        isVerifier[verifier] = true;
        emit VerifierSet(verifier, true);
    }

    function setVerifier(address verifier, bool allowed) external {
        if (msg.sender != owner) revert NotOwner();
        isVerifier[verifier] = allowed;
        emit VerifierSet(verifier, allowed);
    }

    function record(
        bytes32 subject,
        bytes32 dataHash,
        bytes32 resultHash,
        uint8 riskScore,
        bool passed,
        string calldata model
    ) external returns (uint256 id) {
        if (!isVerifier[msg.sender]) revert NotVerifier();
        if (riskScore > 4) revert BadScore();
        id = _attestations.length;
        _attestations.push(Attestation(subject, dataHash, resultHash, riskScore, passed, model, msg.sender, uint64(block.timestamp)));
        _bySubject[subject].push(id);
        emit Recorded(id, subject, dataHash, resultHash, riskScore, passed, model, msg.sender);
    }

    function count() external view returns (uint256) {
        return _attestations.length;
    }

    function get(uint256 id) external view returns (Attestation memory) {
        return _attestations[id];
    }

    function idsForSubject(bytes32 subject) external view returns (uint256[] memory) {
        return _bySubject[subject];
    }

    function latestForSubject(bytes32 subject) external view returns (bool found, Attestation memory a) {
        uint256[] storage ids = _bySubject[subject];
        if (ids.length == 0) return (false, a);
        return (true, _attestations[ids[ids.length - 1]]);
    }
}
