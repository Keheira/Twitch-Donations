// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

/*
* @title Donation Portal
* @author Keheira
* @notice This contract is a sample donation portal. It acts somewhat like donating bits on a twitch stream.
*/
contract DonationPortal {

    /* 
    * variables
    */

    address payable public owner;

    struct Donation {
    address user;
    string message;
    uint amount;
    uint256 timestamp;
    }

    Donation[] donations;

    // @notice initial top donor is null
    Donation public topDonor;

    // @notice initial total is 0
    uint public publicDonationTotal;

    // @notice initial total is 0
    uint private privateDonationTotal;

    /*
    * @notice Emitted when there is a new donation
    * @param donor address
    * @param donation amount
    */
    event LogDonationAdded(address donor, uint amount);

    /*
    * @notice Emitted when total donation is calculated
    * @param donation amount
    */
    event LogDonationTotal(uint amount);

    /*
    * @notice Emitted when there is a new top donation
    * @param donation object
    */
    event LogTopDonation(address donor, uint amount);

    /*
    * @notice Emitted when there is a new top donation
    * @param donation object
    */
    event LogDonationReset();

    /*
    * @notice get last donaation of sender
    * @param donation object
    */
    mapping(address => uint256) public lastDonationAt;

    /*
    * modifiers
    */
    modifier isOwner {
        // Check that person calling is the owner
        require(msg.sender == owner, "You aren't the owner");
        _;
    }

    // @notice setup contract initial values
    constructor() payable {
        owner = payable(msg.sender);
        publicDonationTotal = 0;
        privateDonationTotal = 0;
        topDonor = Donation({
            user: address(0),
            message: "contract started",
            amount: 0,
            timestamp: 0
        });
    }

    /*
    * @Notice no data or no matching funtion
    */
    fallback () external payable { revert(); }

    /*
    * @Notice empty call data
    */
    receive () external payable { revert(); }

    /*
    * @notice Add a new donation to the array
    * @param donation message
    * @param amount of donation
    */
    function addDonation(string memory message, uint amount) public {
        require(
            lastDonationAt[msg.sender] + 2 minutes < block.timestamp,
            "Let's cool down a bit"
        );

        lastDonationAt[msg.sender] = block.timestamp;

        //TODO: am I sending things??
        // payable(msg.sender).transfer(amount);

        Donation memory newItem = Donation({
            user: msg.sender,
            message: message,
            amount: amount,
            timestamp: block.timestamp
        });
        
        donations.push(newItem);

        if (amount > topDonor.amount){
            topDonor = newItem;
            emit LogTopDonation(newItem.user, newItem.amount);
        }

        emit LogDonationAdded(msg.sender, amount);
        publicDonationTotal += amount;
        privateDonationTotal += amount;
        emit LogDonationTotal(publicDonationTotal);
    }

    /*
    * @notice Allow owner to pull donations from the contract
    * I think oublic might be wrong
    */
    function pullDonations() public isOwner {
        owner.transfer(address(this).balance);
    }

    /*
    * @notice Return all donations
    */
    function getAllDonations() public view returns (Donation[] memory){
        return donations;
    }

    /*
    * @notice Return the total amount of donations at this time
    */
    function getTotalDonations() public view returns (uint){
        return publicDonationTotal;
    }

    /*
    * @notice Return the total amount of donations over lifetime
    */
    function getLifetimeDonations() public view returns (uint){
        return privateDonationTotal;
    }

    /*
    * @notice Return top donation
    */
    function getTopDonation() public view returns (Donation memory){
        return topDonor;
    }

    function resetDonations() public isOwner{
        pullDonations();
        publicDonationTotal = 0;
        topDonor = Donation({
            user: address(0),
            message: "contract started",
            amount: 0,
            timestamp: 0
        });
    }

    /*
    * @notice get a specific item to testing
    * @param item location
    */
    function getDonation(uint location) public view
        returns (address user, string memory message, uint amount, uint256 timestamp) {
        user = donations[location].user;
        message = donations[location].message;
        amount = uint(donations[location].amount);
        timestamp = donations[location].timestamp;
        return (user, message, amount, timestamp);
    }

    //TODO: maybe get total balance address has sent?
}