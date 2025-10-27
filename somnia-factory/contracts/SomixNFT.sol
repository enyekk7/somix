// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.4.0
pragma solidity ^0.8.27;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract SomixNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    uint256 public mintPrice;
    uint256 public maxSupply;
    bool public mintingEnabled;
    
    // Track minted count
    uint256 public totalMinted;

    constructor(
        address initialOwner,
        string memory collectionName,
        string memory symbol,
        uint256 _mintPrice,
        uint256 _maxSupply
    )
        ERC721(collectionName, symbol)
        Ownable(initialOwner)
    {
        mintPrice = _mintPrice;
        maxSupply = _maxSupply;
        mintingEnabled = true;
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://ipfs.io";
    }

    // Owner mint function (free)
    function safeMint(address to, string memory uri)
        public
        onlyOwner
        returns (uint256)
    {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        totalMinted++;
        return tokenId;
    }

    // Public payable mint function
    function publicMint(string memory uri) public payable returns (uint256) {
        require(mintingEnabled, "Minting is not enabled");
        require(msg.value >= mintPrice, "Insufficient payment");
        require(totalMinted < maxSupply, "Max supply reached");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        totalMinted++;
        
        return tokenId;
    }

    // Update mint price (only owner)
    function setMintPrice(uint256 _newPrice) public onlyOwner {
        mintPrice = _newPrice;
    }

    // Enable/disable minting (only owner)
    function setMintingEnabled(bool _enabled) public onlyOwner {
        mintingEnabled = _enabled;
    }

    // Withdraw collected funds (only owner)
    function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
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

