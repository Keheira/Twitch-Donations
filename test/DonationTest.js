const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("DonationPortal Contract Testing", function () {
    async function deployDonationPortalFixture(){
        // Get an ethereum account
        const [owner, user1, user2] = await ethers.getSigners();

        // instance of contract
        const Donation = await ethers.getContractFactory("DonationPortal");

        // deploy contract
        const donationContract = await Donation.deploy();

        await donationContract.deployed()

        // constant amount to test
        const testAmount = 1000
        const testTopAmount = 2000

        // return things needed
        return { donationContract, owner, user1, user2, testAmount, testTopAmount }
    }

    // it("Initial Variables", async function () {
    //     const { donationContract, owner } = await loadFixture(deployDonationPortalFixture)

    //     const initialDonor = await donationContract.topDonor

    //     const zeroAddress = await ethers.constants.AddressZero

    //     expect(await donationContract.owner()).to.equal(owner.address); // owner should equal owner address
    //     expect(await donationContract.publicDonationTotal()).to.equal(0); // public donation total should be 0
    //     expect(await donationContract.privateDonationTotal()).to.equal(0); // private donation total should be 0
    //     console.log('top donor is: ', initialDonor)
    //     expect(initialDonor.address).to.equal(zeroAddress); // top donation address should be zero
    //     expect(await donationContract.topDonor().amount).to.equal(0); // top donation address should be zero
    // });

    it("addDonation() should be able to add donation with empty message", async() => {
        const { donationContract, user1, testAmount } = await loadFixture(deployDonationPortalFixture)

        await donationContract.connect(user1).addDonation("", testAmount)
        const result = await donationContract.getDonation(0)

        expect(result.user).to.equal(user1.address)
        expect(result.message).to.equal("")
        expect(result.amount).to.equal(testAmount)
    })

    it("addDonation() should be able to add donation with a message", async() => {
        const { donationContract, user1, testAmount } = await loadFixture(deployDonationPortalFixture)

        await donationContract.connect(user1).addDonation("donation 1", testAmount)
        const result = await donationContract.getDonation(0)

        expect(result.user).to.equal(user1.address)
        expect(result.message).to.equal("donation 1")
        expect(result.amount).to.equal(testAmount)
    })

    it("addDonation() should expect cool down message", async() => {
        const { donationContract, user1, user2, testAmount } = await loadFixture(deployDonationPortalFixture)

        await donationContract.connect(user1).addDonation("donation 1", testAmount)
        await donationContract.connect(user2).addDonation("donation 2", testAmount)
        await expect(donationContract.connect(user1).addDonation("donation 1", testAmount)).to.be.revertedWith("Let's cool down a bit")
    })

    it("getAllDonations() should have 2 donations", async() => {
        const { donationContract, user1, user2, testAmount } = await loadFixture(deployDonationPortalFixture)

        await donationContract.connect(user1).addDonation("donation 1", testAmount)
        await donationContract.connect(user2).addDonation("donation 2", testAmount)
        const result = await donationContract.getAllDonations()

        expect(result.length).to.equal(2)
    })

    it("getTotalDonations() get amount of all donations", async() => {
        const { donationContract, user1, user2, testAmount } = await loadFixture(deployDonationPortalFixture)

        await donationContract.connect(user1).addDonation("donation 1", testAmount)
        await donationContract.connect(user2).addDonation("donation 2", testAmount)
        const result = await donationContract.getTotalDonations()

        expect(result).to.equal(2000)
    })

    it("getTopDonation() should get the top donation amount", async() => {
        const { donationContract, user1, user2, testAmount, testTopAmount } = await loadFixture(deployDonationPortalFixture)
        
        await donationContract.connect(user1).addDonation("donation 1", testAmount)
        await donationContract.connect(user2).addDonation("donation 2", testTopAmount)
        const result = await donationContract.getTopDonation()

        expect(result.user).to.equal(user2.address)
    })

    it("pullDonations() shouldn't allow user to take an amount of donations", async() => {
        const { donationContract, user1, user2, testAmount } = await loadFixture(deployDonationPortalFixture)

        await donationContract.connect(user1).addDonation("donation 1", testAmount)
        await donationContract.connect(user2).addDonation("donation 2", testAmount)

        await expect(donationContract.connect(user1).pullDonations()).to.be.revertedWith("You aren't the owner")
    })

    it("pullDonations() should allow owner to take an amount of donations", async() => {
        const { donationContract, owner, user1, user2, testAmount } = await loadFixture(deployDonationPortalFixture)

        await donationContract.connect(user1).addDonation("donation 1", testAmount)
        await donationContract.connect(user2).addDonation("donation 2", testAmount)

        await donationContract.pullDonations()
        expect(await donationContract.publicDonationTotal()).to.equal(2000)
    })

    it("resetDonations() should allow owner to reset public donations but not private", async() => {
        const { donationContract, owner, user1, user2, testAmount } = await loadFixture(deployDonationPortalFixture)

        await donationContract.connect(user1).addDonation("donation 1", testAmount)
        await donationContract.connect(user2).addDonation("donation 2", testAmount)

        await donationContract.resetDonations()
        expect(await donationContract.getLifetimeDonations()).to.equal(2000)
        expect(await donationContract.publicDonationTotal()).to.equal(0)
    })
});