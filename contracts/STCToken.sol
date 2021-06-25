pragma solidity ^0.5.0;

contract STCToken{
    string public name="STC Token";
    string public symbol="STC";
    uint256 public totalSupply;
    mapping (address=>uint256)  public balanceOf;

    event Transfer(
        address indexed _from,
        address indexed _to,
        uint256 _value
    );

    
    constructor(uint256 _initialSupply) public{
        totalSupply = _initialSupply;
        balanceOf[msg.sender] = _initialSupply;
    }

    function transfer(address _to,uint256 _value) public returns (bool success){
        
        require(balanceOf[msg.sender] >= _value);
        
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        
        
        emit Transfer(msg.sender, _to, _value);
        // return a boolean
        return true;

    }

}