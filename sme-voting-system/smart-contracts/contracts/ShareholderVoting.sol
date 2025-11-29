// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ShareholderVoting
 * @dev A placeholder contract for shareholder voting functionality.
 * This will be expanded with full voting logic in later steps.
 */
contract ShareholderVoting {
    string public name;
    address public admin;

    event ContractInitialized(string name, address admin);

    constructor(string memory _name) {
        name = _name;
        admin = msg.sender;
        emit ContractInitialized(_name, msg.sender);
    }

    /**
     * @dev Returns a greeting message (placeholder function)
     */
    function greet() public view returns (string memory) {
        return string(abi.encodePacked("Hello from ", name));
    }
}
