var Project = artifacts.require("Project");
var SimpleContractRegistry = artifacts.require("SimpleContractRegistry");
var AliceToken = artifacts.require("AliceToken");
var ImpactRegistry = artifacts.require("ImpactRegistry");

contract('Multiple donations', function(accounts) {
  var main = accounts[0];
  var judge = accounts[3];
  var beneficiary = accounts[4];
  var project, token, contractProvider;

  it("should link project to judge", function(done) {
    Project.deployed().then(function(instance) {
      project = instance;
      return project.setJudge(judge, {from: main})
    }).then(function() {
      return project.judgeAddress.call();
    }).then(function(address) {
      return assert.equal(address, judge, "Judge address wasn't set correctly");
    })
      .then(done)
      .catch(done);
  });

  it("should link project to beneficiary", function(done) {
    project.setBeneficiary(beneficiary, {from: main}).then(function() {
      return project.beneficiaryAddress.call();
    }).then(function(address) {
      return assert.equal(address, beneficiary, "Beneficiary address wasn't set correctly");
    })
      .then(done)
      .catch(done);
  });

  it("should link project to contract provider", function(done) {
    SimpleContractRegistry.deployed().then(function(instance) {
      contractProvider = instance;
      return project.setContractProvider(contractProvider.address, {from: main})
    }).then(function() {
      return project.CONTRACT_PROVIDER_ADDRESS.call();
    }).then(function(address) {
      return assert.equal(address, contractProvider.address, "Contract provider address wasn't set correctly");
    })
      .then(done)
      .catch(done);
  });

  it("should get token contract from registry", function(done) {
    SimpleContractRegistry.deployed().then(function(registryInstance) {
      return registryInstance.contracts.call('digitalGBP');
    }).then(function(address) {
      token = AliceToken.at(address);
      return assert.notEqual(token, undefined);
    })
      .then(done)
      .catch(done);
  });

  it("should donate from multiple accounts", function(done) {

    for (var i = 0; i < 50; i++) {
      var account = accounts[5+i];
      project.notify(account, 10, {from: main});
    }

    token.mint(project.address, 500, {from: main}).then(function () {
      return token.balanceOf.call(project.address, {from: main})
    }).then(function (balance) {
      return assert.equal(balance.valueOf(), 500, "500 wasn't minted");
    })
      .then(done)
      .catch(done);
  });


  it("should unlock outcome from multiple accounts", function (done) {
    token.balanceOf.call(project.address).then(function(balance) {
      return assert.equal(balance.valueOf(), 500, "500 wasn't in project before unlocking outcome");
    }).then(function() {
      return token.balanceOf.call(beneficiary);
    }).then(function(balance) {
      return assert.equal(balance.valueOf(), 0, "0 wasn't in beneficiary before unlocking outcome");
    }).then(function() {
      return project.unlockOutcome("Outcome", 500, {from: judge});
    }).then(function() {
      return token.balanceOf.call(project.address);
    }).then(function(balance) {
      return assert.equal(balance.valueOf(), 0, "0 wasn't in project after unlocking outcome");
    }).then(function() {
      return token.balanceOf.call(beneficiary);
    }).then(function(balance) {
      return assert.equal(balance.valueOf(), 500, "500 wasn't in beneficiary after unlocking outcome");
    })
      .then(done)
      .catch(done);
  });


});