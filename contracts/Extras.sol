// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ExtrasNFT is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    constructor() ERC721("Extras", "EXT") {}


    uint256 owners = 0;

    struct Extras {
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }

    mapping(uint256 => Extras) private extras;

    function safeMint(string memory uri, uint256 price)
        public
        payable
        returns (uint256)
    {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _mint(msg.sender, tokenId);

        _setTokenURI(tokenId, uri);
        createExtras(tokenId, price);

        return tokenId;
    }

    function createExtras(uint256 tokenId, uint256 price) private {
        require(price > 0, "Price of Extras must be at least 1 wei");
        extras[tokenId] = Extras(
            tokenId,
            payable(msg.sender),
            payable(address(this)),
            price,
            false
        );

        _transfer(msg.sender, address(this), tokenId);
    }

    function buyExtras(uint256 tokenId) public payable {
        uint256 price = extras[tokenId].price;
        address seller = extras[tokenId].seller;
        require(
            msg.value >= price,
            "Please submit the asking price in order to buy this extra"
        );
        
        _transfer(address(this), msg.sender, tokenId);

        payable(seller).transfer(msg.value);
        extras[tokenId].owner = payable(msg.sender);
        extras[tokenId].sold = true;
        extras[tokenId].seller = payable(address(0));
    }

    function sellExtras(uint256 tokenId) public payable {
        require(
            extras[tokenId].owner == msg.sender,
            "Only item owner can perform this operation"
        );
        extras[tokenId].sold = false;
        extras[tokenId].seller = payable(msg.sender);
        extras[tokenId].owner = payable(address(this));

        _transfer(msg.sender, address(this), tokenId);
    }

    function getExtras(uint256 tokenId) public view returns (Extras memory) {
        return extras[tokenId];
    }

    function getExtrasLength() public view returns (uint256) {
        return _tokenIdCounter.current();
    }


    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
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
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
