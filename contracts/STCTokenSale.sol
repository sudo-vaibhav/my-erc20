// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "./STCToken.sol";

contract STCTokenSale{
    address payable admin;
    STCToken public tokenContract;
    uint256 public tokenPrice;
    uint256 public tokensSold;


    event Sell(
        address _buyer,
        uint256 _amount
    );

    constructor(STCToken _tokenContract,uint256 _tokenPrice){
        admin = payable(msg.sender);
        tokenContract = _tokenContract;
        tokenPrice = _tokenPrice;
    }

    function buyTokens(uint256 _numberOfTokens) public payable{
        // require that contract has enough tokens
        require(tokenContract.balanceOf(address(this))>=_numberOfTokens,"contract doesn't have enough tokens to sell");
        
        // require the value is greater or equal to msg.value
        require(msg.value >= _numberOfTokens * tokenPrice,"sent value should be equal to or greater than price");
        
        // require that a transfer is successful
        require(tokenContract.transfer(msg.sender, _numberOfTokens));

        // keep track of tokens sold
        tokensSold+= _numberOfTokens;

        // trigger sell event
        emit Sell(msg.sender, _numberOfTokens);
    }

    function endSale() public{
        require(msg.sender == admin,"sender of this message should be admin");
        require(tokenContract.transfer(admin, tokenContract.balanceOf(address(this))),"all leftover tokens should be sent to admin");

        // destroy this contract
        selfdestruct(admin);


    }
}


