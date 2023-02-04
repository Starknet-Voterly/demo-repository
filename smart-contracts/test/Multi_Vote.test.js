// Right click on the script name and hit "Run" to execute
const { expect } = require("chai");
const { ethers } = require("hardhat");

let multi_vote;
let addr1;
let addr2;
let addr3;

describe("Multi_Vote", () => {
  beforeEach(async () => {
    [addr1, addr2, addr3] = await ethers.getSigners();
    const Multi_Vote = await ethers.getContractFactory("Multi_Vote");
    multi_vote = await Multi_Vote.deploy(1000);
    await multi_vote.deployed();
  });

  it("state set correctly", async () => {
    //test global variables
    expect(await get_total_supply()).to.equal(1000);
    expect(await get_vote_in_progress()).to.equal(false);

    //test current vote
    expect(await get_curr_proposal()).to.equal(0);
    await test_vote_info(0, 0, 0, 0, 0);

    //test votes
    await test_user_vote(0, addr1.address, 0, 0);
    await test_user_vote(0, addr2.address, 0, 0);
    await test_user_vote(0, addr3.address, 0, 0);

    //test user balance
    await test_user_acounts(addr1.address, 1000, 1000, 0);
    await test_user_acounts(addr2.address, 0, 0, 0);
    await test_user_acounts(addr3.address, 0, 0, 0);

    //test delgated map
    await test_all_user_delgated(addr1, [[addr1, 0], [addr2, 0], [addr3, 0]]);
    await test_all_user_delgated(addr2, [[addr1, 0], [addr2, 0], [addr3, 0]]);
    await test_all_user_delgated(addr3, [[addr1, 0], [addr2, 0], [addr3, 0]]);

    [[addr1, 0], [addr2, 0], [addr3, 0]]
  });

  describe("transferTo", () => {
    it("transfer state updated correctly", async () => {
      await transferTo(addr1, addr2.address, 10);

      await test_user_acounts(addr1.address, 990, 990, 0);
      await test_user_acounts(addr2.address, 10, 10, 0);
      await test_user_acounts(addr3.address, 0, 0, 0);

      await transferTo(addr2, addr3.address, 5);

      await test_user_acounts(addr1.address, 990, 990, 0);
      await test_user_acounts(addr2.address, 5, 5, 0);
      await test_user_acounts(addr3.address, 5, 5, 0);
    });

    it("cant transfer more", async () => {
      await expect(transferTo(addr1, addr2.address, 10000)).to.be.reverted;
    });
  });

  describe("delegateTo, undelegate, transfer user_history", () => {
    it("cant delgate more than you have", async () => {
      console.log("lol");
    });

    it("delegateTo state updated correctly", async () => {
      await test_user_history(
        addr1.address,
        [],
        [addr1.address, addr2.address, addr3.address]
      );
      await test_user_history(
        addr2.address,
        [],
        [addr1.address, addr2.address, addr3.address]
      );
      await test_user_history(
        addr3.address,
        [],
        [addr1.address, addr2.address, addr3.address]
      );

      //user 1 delegate to user 1
      await delegateTo(addr1, addr1.address, 10);
      await test_user_history(
        addr1.address,
        [addr1.address],
        [addr2.address, addr3.address]
      );
      await test_all_user_delgated(addr3, [[addr1, 0], [addr2, 0], [addr3, 0]]);
      await test_user_acounts(addr1.address, 1000, 990, 10);
      await test_user_acounts(addr2.address, 0, 0, 0);
      await test_user_acounts(addr3.address, 0, 0, 0);
      await test_all_user_delgated(addr1, [[addr1, 10], [addr2, 0], [addr3, 0]]);
      await test_all_user_delgated(addr2, [[addr1, 0], [addr2, 0], [addr3, 0]]);
      await test_all_user_delgated(addr3, [[addr1, 0], [addr2, 0], [addr3, 0]]);

      //user 1 delegate to user 2
      await delegateTo(addr1, addr2.address, 15);
      await test_user_history(
        addr1.address,
        [addr1.address, addr2.address],
        [addr3.address]
      );
      await test_user_acounts(addr1.address, 1000, 975, 10);
      await test_user_acounts(addr2.address, 0, 0, 15);
      await test_user_acounts(addr3.address, 0, 0, 0);
      await test_all_user_delgated(addr1, [[addr1, 10], [addr2, 15], [addr3, 0]]);
      await test_all_user_delgated(addr2, [[addr1, 0], [addr2, 0], [addr3, 0]]);
      await test_all_user_delgated(addr3, [[addr1, 0], [addr2, 0], [addr3, 0]]);

      //user 1 delegate to user 3
      await delegateTo(addr1, addr3.address, 20);
      await test_user_acounts(addr1.address, 1000, 955, 10);
      await test_user_acounts(addr2.address, 0, 0, 15);
      await test_user_acounts(addr3.address, 0, 0, 20);
      await test_all_user_delgated(addr1, [[addr1, 10], [addr2, 15], [addr3, 20]]);
      await test_all_user_delgated(addr2, [[addr1, 0], [addr2, 0], [addr3, 0]]);
      await test_all_user_delgated(addr3, [[addr1, 0], [addr2, 0], [addr3, 0]]);

      //user 1 transfer to user 2
      await transferTo(addr1, addr2.address, 100);
      await test_user_acounts(addr1.address, 900, 855, 10);
      await test_user_acounts(addr2.address, 100, 100, 15);
      await test_user_acounts(addr3.address, 0, 0, 20);
      await test_all_user_delgated(addr1, [[addr1, 10], [addr2, 15], [addr3, 20]]);
      await test_all_user_delgated(addr2, [[addr1, 0], [addr2, 0], [addr3, 0]]);

      //user 2 transfer to user 1
      //user 2 transfer to user 2
      //user 2 transfer to user 3
      await delegateTo(addr2, addr1.address, 5);
      await delegateTo(addr2, addr2.address, 5);
      await delegateTo(addr2, addr3.address, 5);
      await test_user_acounts(addr1.address, 900, 855, 15);
      await test_user_acounts(addr2.address, 100, 85, 20);
      await test_user_acounts(addr3.address, 0, 0, 25);
      await test_all_user_delgated(addr1, [[addr1, 10], [addr2, 15], [addr3, 20]]);
      await test_all_user_delgated(addr2, [[addr1, 5], [addr2, 5], [addr3, 5]]);
      await test_all_user_delgated(addr3, [[addr1, 0], [addr2, 0], [addr3, 0]]);

      //user 2 transfer to user 3
      await transferTo(addr2, addr3.address, 50);
      await test_user_acounts(addr1.address, 900, 855, 15);
      await test_user_acounts(addr2.address, 50, 35, 20);
      await test_user_acounts(addr3.address, 50, 50, 25);
      await test_all_user_delgated(addr1, [[addr1, 10], [addr2, 15], [addr3, 20]]);
      await test_all_user_delgated(addr2, [[addr1, 5], [addr2, 5], [addr3, 5]]);
      await test_all_user_delgated(addr3, [[addr1, 0], [addr2, 0], [addr3, 0]]);

      //user 3 delegates to user 1
      //user 3 delegates to user 2
      //user 3 delegates to user 3
      await delegateTo(addr3, addr1.address, 1);
      await delegateTo(addr3, addr2.address, 1);
      await delegateTo(addr3, addr3.address, 1);
      await test_user_acounts(addr1.address, 900, 855, 16);
      await test_user_acounts(addr2.address, 50, 35, 21);
      await test_user_acounts(addr3.address, 50, 47, 26);
      await test_all_user_delgated(addr1, [[addr1, 10], [addr2, 15], [addr3, 20]]);
      await test_all_user_delgated(addr2, [[addr1, 5], [addr2, 5], [addr3, 5]]);
      await test_all_user_delgated(addr3, [[addr1, 1], [addr2, 1], [addr3, 1]]);

      await test_user_history(
        addr1.address,
        [addr1.address, addr2.address, addr3.address],
        []
      );
      await test_user_history(
        addr2.address,
        [addr1.address, addr2.address, addr3.address],
        []
      );
      await test_user_history(
        addr3.address,
        [addr1.address, addr2.address, addr3.address],
        []
      );
    });

    it("undelegate state updated correctly", async () => {
      await build_simple_situation();
      await undelegate(addr1, addr2.address, 10);
      await undelegate(addr3, addr3.address, 1);

      await test_user_acounts(addr1.address, 900, 865, 16);
      await test_user_acounts(addr2.address, 50, 35, 11);
      await test_user_acounts(addr3.address, 50, 48, 25);
      await test_all_user_delgated(addr1, [[addr1, 10], [addr2, 5], [addr3, 20]]);
      await test_all_user_delgated(addr2, [[addr1, 5], [addr2, 5], [addr3, 5]]);
      await test_all_user_delgated(addr3, [[addr1, 1], [addr2, 1], [addr3, 0]]);
    });

    it("cant delgate more than you have", async () => {
      await build_simple_situation();
      await expect(delegateTo(addr1, addr2.address, 100000)).to.be.reverted;
    });

    it("cant undelgate more than you have", async () => {
      await build_simple_situation();
      await expect(undelegate(addr1, addr2.address, 10000)).to.be.reverted;
    });
  });

  describe("voting", () => {
    it("user 1 can propose", async () => {
      expect(await get_curr_proposal()).to.equal(0);

      await test_vote_info(0, 0, 0, 0, 0);
      expect(await get_vote_in_progress()).to.equal(false);

      await propose(addr1);

      expect(await get_curr_proposal()).to.equal(1);

      expect(await get_vote_in_progress()).to.equal(true);
      await test_vote_info(0, 0, 0, 0, 0);
      await test_vote_info(1, 0, 0, 0, 0);
    });

    it("user 1 can't propose during a proposal", async () => {
      await propose(addr1);
      await expect(propose(addr2)).to.be.reverted;

      expect(await get_curr_proposal()).to.equal(1);

      expect(await get_vote_in_progress()).to.equal(true);
      await test_vote_info(0, 0, 0, 0, 0);
      await test_vote_info(1, 0, 0, 0, 0);

      await end_vote(addr1);

      expect(await get_curr_proposal()).to.equal(1);
      expect(await get_vote_in_progress()).to.equal(false);

      await test_vote_info(0, 0, 0, 0, 0);
      await test_vote_info(1, 0, 0, 0, 3);
    });

    it("user 1 can't propose during a proposal but can after", async () => {
      await propose(addr1);
      await expect(propose(addr2)).to.be.reverted;
      await end_vote(addr1);
      await propose(addr1);

      expect(await get_curr_proposal()).to.equal(2);

      expect(await get_vote_in_progress()).to.equal(true);
      await test_vote_info(0, 0, 0, 0, 0);
      await test_vote_info(1, 0, 0, 0, 3);
      await test_vote_info(2, 0, 0, 0, 0);
    });

    it("non owner can't propose", async () => {
      expect(await get_curr_proposal()).to.equal(0);

      await test_vote_info(0, 0, 0, 0, 0);
      expect(await get_vote_in_progress()).to.equal(false);

      await expect(propose(addr2)).to.be.reverted;

      expect(await get_curr_proposal()).to.equal(0);

      expect(await get_vote_in_progress()).to.equal(false);

      await test_vote_info(0, 0, 0, 0, 0);
    });

    it("user 1 can end proposal", async () => {
      await propose(addr1);

      expect(await get_curr_proposal()).to.equal(1);
      expect(await get_vote_in_progress()).to.equal(true);

      await test_vote_info(0, 0, 0, 0, 0);
      await test_vote_info(1, 0, 0, 0, 0);

      await end_vote(addr1);

      expect(await get_curr_proposal()).to.equal(1);
      expect(await get_vote_in_progress()).to.equal(false);

      await test_vote_info(0, 0, 0, 0, 0);
      await test_vote_info(1, 0, 0, 0, 3);
    });

    it("user 2 can't end proposal", async () => {
      await propose(addr1);

      expect(await get_curr_proposal()).to.equal(1);
      expect(await get_vote_in_progress()).to.equal(true);

      await test_vote_info(0, 0, 0, 0, 0);
      await test_vote_info(1, 0, 0, 0, 0);

      await expect(end_vote(addr2)).to.be.reverted;

      expect(await get_curr_proposal()).to.equal(1);
      expect(await get_vote_in_progress()).to.equal(true);

      await test_vote_info(0, 0, 0, 0, 0);
      await test_vote_info(1, 0, 0, 0, 0);
    });


    describe("actual voting", () => {
        it("votes are recorded", async () => {
            await build_simple_situation();
            await propose(addr1);

            await test_user_vote(1, addr1.address, 0, 0);
            await test_user_vote(1, addr2.address, 0, 0);
            await test_user_vote(1, addr3.address, 0, 0);

            await vote(addr1, 1, 16);
            await test_user_vote(1, addr1.address, 16, 1);
            await test_user_vote(1, addr2.address, 0, 0);
            await test_user_vote(1, addr3.address, 0, 0);

            await vote(addr2, 2, 3);
            await test_user_vote(1, addr1.address, 16, 1);
            await test_user_vote(1, addr2.address, 3, 2);
            await test_user_vote(1, addr3.address, 0, 0);

            await vote(addr3, 3, 3);
            await test_user_vote(1, addr1.address, 16, 1);
            await test_user_vote(1, addr2.address, 3, 2);
            await test_user_vote(1, addr3.address, 3, 3);

            await test_user_acounts(addr1.address, 900, 855, 16);
            await test_user_acounts(addr2.address, 50, 35, 21);
            await test_user_acounts(addr3.address, 50, 47, 26);

            await test_vote_info(1, 16, 3, 3, 0);

            await end_vote(addr1);

            await test_vote_info(1, 16, 3, 3, 1);


        });

        it("can't vote twice", async () => {
            await build_simple_situation();
            await propose(addr1);
            await vote(addr1, 1, 16);

            await test_vote_info(1, 16, 0, 0, 0);
            await test_user_vote(1, addr1.address, 16, 1);

            await expect(vote(addr1, 1, 1)).to.be.reverted;

            await test_vote_info(1, 16, 0, 0, 0);
            await test_user_vote(1, addr1.address, 16, 1);
        });

        it("can't vote more than your power", async () => {
            await expect(vote(addr1, 1, 1)).to.be.reverted;
            await build_simple_situation();
            await propose(addr1);

            await expect(vote(addr1, 1, 1000)).to.be.reverted;

            await test_vote_info(1, 0, 0, 0, 0);
            await test_user_vote(1, addr1.address, 0, 0);
        });

        it("can't vote on a non position", async () => {
            await expect(vote(addr1, 1, 1)).to.be.reverted;

            await build_simple_situation();
            await propose(addr1);

            await expect(vote(addr1, 4, 1)).to.be.reverted;

            await test_vote_info(1, 0, 0, 0, 0);
            await test_user_vote(1, addr1.address, 0, 0);
        });

        it("can all vote on the same thing", async () => {
            await build_simple_situation();
            await propose(addr1);

            await vote(addr1, 1, 1);
            await vote(addr2, 1, 1);
            await vote(addr3, 1, 1);

            await test_vote_info(1, 3, 0, 0, 0);
            await end_vote(addr1);
            await test_vote_info(1, 3, 0, 0, 1);
        });

        it("multiple propositions", async () => {
            await build_simple_situation();
            await propose(addr1);

            await vote(addr1, 1, 1);
            await vote(addr2, 1, 1);
            await vote(addr3, 1, 1);
            
            await test_vote_info(1, 3, 0, 0, 0);
            await end_vote(addr1);
            await test_vote_info(1, 3, 0, 0, 1);


            await propose(addr1);

            await vote(addr1, 2, 1);
            await vote(addr2, 2, 1);
            await vote(addr3, 2, 1);
            
            await test_vote_info(2, 0, 3, 0, 0);
            await end_vote(addr1);
            await test_vote_info(1, 3, 0, 0, 1);
            await test_vote_info(2, 0, 3, 0, 2);


            await propose(addr1);

            await vote(addr1, 3, 1);
            await vote(addr2, 3, 1);
            await vote(addr3, 3, 1);
            
            await test_vote_info(3, 0, 0, 3, 0);
            await end_vote(addr1);
            await test_vote_info(1, 3, 0, 0, 1);
            await test_vote_info(2, 0, 3, 0, 2);
            await test_vote_info(3, 0, 0, 3, 3);
        });

        it("unVote", async () => {
            await expect(unVote(addr1)).to.be.reverted;

            await build_simple_situation();
            await propose(addr1);

            await expect(unVote(addr1)).to.be.reverted;

            await vote(addr1, 1, 1);
            await vote(addr2, 1, 1);
            await vote(addr3, 1, 1);

            await unVote(addr1);
            await vote(addr1, 2, 10);
            
            await test_vote_info(1, 2, 10, 0, 0);

            await unVote(addr1);
            await vote(addr1, 3, 10);
            
            await test_vote_info(1, 2, 0, 10, 0);

            await unVote(addr1);
            await vote(addr1, 1, 10);
            
            await test_vote_info(1, 12, 0, 0, 0);

            await end_vote(addr1);
            await test_vote_info(1, 12, 0, 0, 1);
        });

    });
  });
});

async function delegateTo(caller, to, amount) {
  return await multi_vote.connect(caller).delegateTo(to, amount);
}

async function undelegate(caller, to, amount) {
  return await multi_vote.connect(caller).undelegate(to, amount);
}

async function vote(caller, position, amount) {
  return await multi_vote.connect(caller).vote(position, amount);
}

async function propose(caller) {
  return await multi_vote.connect(caller).propose();
}
async function end_vote(caller) {
  return await multi_vote.connect(caller).end_vote();
}

async function transferTo(caller, to, amount) {
  return await multi_vote.connect(caller).transferTo(to, amount);
}

async function unVote(caller) {
  return await multi_vote.connect(caller).unVote();
}

async function get_total_supply() {
  return await multi_vote.get_total_supply();
}

async function get_vote_in_progress() {
  return await multi_vote.get_vote_in_progress();
}

async function get_curr_proposal() {
  return await multi_vote.get_curr_proposal();
}

async function get_proposal_pro(proposal) {
  return await multi_vote.get_proposal_pro(proposal);
}

async function get_proposal_against(proposal) {
  return await multi_vote.get_proposal_against(proposal);
}

async function get_proposal_abstain(proposal) {
  return await multi_vote.get_proposal_abstain(proposal);
}

async function get_proposal_result(proposal) {
  return await multi_vote.get_proposal_result(proposal);
}

async function get_vote_amount(proposal, voter) {
  return await multi_vote.get_vote_amount(proposal, voter);
}

async function get_vote_position(proposal, voter) {
  return await multi_vote.get_vote_position(proposal, voter);
}

async function get_user_total_balance(user) {
  return await multi_vote.get_user_total_balance(user);
}

async function get_user_total_availible(user) {
  return await multi_vote.get_user_total_availible(user);
}

async function get_user_total_power(user) {
  return await multi_vote.get_user_total_power(user);
}

async function get_user_delgated_amount(user, delegatee) {
  return await multi_vote.get_user_delgated_amount(user, delegatee);
}

async function get_user_history_size(user) {
  return await multi_vote.get_user_history_size(user);
}

async function get_user_history(user, index) {
  return await multi_vote.get_user_history(user, index);
}

async function get_all_user_history(user) {
  const size = await get_user_history_size(user);

  const delegates = new Set();
  for (let i = 0; i < size; i++) {
    delegates.add(await get_user_history(user, i));
  }

  return delegates;
}

async function test_user_history(user, has, not_has) {
  const delegates = await get_all_user_history(user);

  for (let i = 0; i < has.length; i++) {
    expect(delegates.has(has[i])).to.equal(true);
  }

  for (let i = 0; i < not_has.length; i++) {
    expect(delegates.has(not_has[i])).to.equal(false);
  }
}

async function test_user_acounts(user, total, availible, power) {
  expect(await get_user_total_balance(user)).to.equal(total);
  expect(await get_user_total_availible(user)).to.equal(availible);
  expect(await get_user_total_power(user)).to.equal(power);
}

async function test_all_user_delgated(user, delegates) {
    for (let i = 0; i < delegates.length; i++) {
        var tup = delegates[i];
        var amount = await get_user_delgated_amount(user.address, tup[0].address);
        expect(amount).to.equal(tup[1]);
    }
}

async function test_vote_info(proposal, pro, against, abstain, result) {
  expect(await get_proposal_pro(proposal)).to.equal(pro);
  expect(await get_proposal_against(proposal)).to.equal(against);
  expect(await get_proposal_abstain(proposal)).to.equal(abstain);
  expect(await get_proposal_result(proposal)).to.equal(result);
}

async function test_user_vote(proposal, user, amount, position) {
  expect(await get_vote_amount(proposal, user)).to.equal(amount);
  expect(await get_vote_position(proposal, user)).to.equal(position);
}

async function build_simple_situation() {
  await delegateTo(addr1, addr1.address, 10);
  await delegateTo(addr1, addr2.address, 15);
  await delegateTo(addr1, addr3.address, 20);
  await transferTo(addr1, addr2.address, 100);
  await delegateTo(addr2, addr1.address, 5);
  await delegateTo(addr2, addr2.address, 5);
  await delegateTo(addr2, addr3.address, 5);
  await transferTo(addr2, addr3.address, 50);
  await delegateTo(addr3, addr1.address, 1);
  await delegateTo(addr3, addr2.address, 1);
  await delegateTo(addr3, addr3.address, 1);

  await test_user_acounts(addr1.address, 900, 855, 16);
  await test_user_acounts(addr2.address, 50, 35, 21);
  await test_user_acounts(addr3.address, 50, 47, 26);
  await test_all_user_delgated(addr1, [[addr1, 10], [addr2, 15], [addr3, 20]]);
  await test_all_user_delgated(addr2, [[addr1, 5], [addr2, 5], [addr3, 5]]);
  await test_all_user_delgated(addr3, [[addr1, 1], [addr2, 1], [addr3, 1]]);
}
