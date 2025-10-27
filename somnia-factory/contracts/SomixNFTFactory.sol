// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// NFT Template Contract
contract UserNFTCollection is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    constructor(address initialOwner, string memory collectionName, string memory symbol)
        ERC721(collectionName, symbol)
        Ownable(initialOwner)
    {}

    function _baseURI() internal pure override returns (string memory) {
        return "https://ipfs.io";
    }

    function safeMint(address to, string memory uri)
        public
        onlyOwner
        returns (uint256)
    {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        return tokenId;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

// Factory Contract
contract SomixNFTFactory {
    mapping(address => address) public userContracts;
    address[] public allContracts;
    
    event NFTContractCreated(address indexed user, address indexed contractAddress);

    function createNFTContract(address user) external returns (address) {
        require(userContracts[user] == address(0), "Contract already exists for this user");
        
        // Create collection name from user address
        string memory collectionName = string(abi.encodePacked("Somix Collection - ", toString(user)));
        string memory symbol = "SOMIX";
        
        // Deploy new NFT contract for user
        UserNFTCollection newContract = new UserNFTCollection(
            user,
            collectionName,
            symbol
        );
        
        address contractAddress = address(newContract);
        userContracts[user] = contractAddress;
        allContracts.push(contractAddress);
        
        emit NFTContractCreated(user, contractAddress);
        
        return contractAddress;
    }

    function getUserContract(address user) external view returns (address) {
        return userContracts[user];
    }

    function contractExists(address user) external view returns (bool) {
        return userContracts[user] != address(0);
    }

    function getAllContracts() external view returns (address[] memory) {
        return allContracts;
    }

    // Helper function to convert address to string
    function toString(address account) internal pure returns (string memory) {
        return toString(abi.encodePacked(account));
    }

    function toString(bytes memory data) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < data.length; i++) {
            str[2+i*2] = alphabet[uint256(uint8(data[i] >> 4))];
            str[3+i*2] = alphabet[uint256(uint8(data[i] & 0x0f))];
        }
        return string(str);
    }
}

