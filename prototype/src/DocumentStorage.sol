// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DocumentStorage {
    mapping(address => string[]) private userDocuments;
    
    function storeDocument(string memory ipfsHash) public {
        userDocuments[msg.sender].push(ipfsHash);
    }
    
    function getDocuments(address user) public view returns (string[] memory) {
        return userDocuments[user];
    }
    
    function getMyDocuments() public view returns (string[] memory) {
        return userDocuments[msg.sender];
    }
}