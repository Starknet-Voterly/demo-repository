// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract Multi_Vote {
    struct Vote {
        uint256 amount;
        uint8 position;
    }

    struct Proposal {
        uint256 pro;
        uint256 against;
        uint256 abstain;
        mapping(address => Vote) votes;
        uint8 result;
    }

    struct User {
        uint256 total_balance;
        uint256 total_availible;
        uint256 total_power;
        mapping(address => uint256) delegates;
        mapping(uint256 => address) history;
        uint256 history_size;
    }

    uint256 private curr_proposal;
    bool private vote_in_progress;
    uint256 private total_supply;
    mapping(uint256 => Proposal) private proposals;
    mapping(address => User) private users;

    address owner;

    constructor(uint256 _total_supply) {
        total_supply = _total_supply;

        address _from = msg.sender;
        User storage from_user = users[_from];

        //upon creating, the creator get the whol supply <--- implement a mint function in the future
        from_user.total_availible += _total_supply;
        from_user.total_balance += _total_supply;

        owner = msg.sender;
    }

    modifier onlyOwner {
        require(owner == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    function transferTo(address _to, uint256 _amount) public {
        address _from = msg.sender;

        User storage from_user = users[_from];

        uint256 total_availible = from_user.total_availible;
        require(total_availible >= _amount, "not enough votes");

        User storage to_user = users[_to];

        //_from's availible goes down
        from_user.total_availible -= _amount;
        //_to's availible goes up
        to_user.total_availible += _amount;

        //_from's balance goes down
        from_user.total_balance -= _amount;
        //_to's balance goes up
        to_user.total_balance += _amount;
    }

    function delegateTo(address _to, uint256 _amount) public {
        address _from = msg.sender;

        User storage from_user = users[_from];

        uint256 total_availible = from_user.total_availible;
        require(total_availible >= _amount, "not enough votes availible");

        User storage to_user = users[_to];

        // NOTE THIS SHOULD NOT BE IN PRODUCTION.
        // IT IS A CRUDE WAY TO AVOID USING A DATABASE TO STORE THE LIST OF CURRENT DELEGETTEES
        if(from_user.delegates[_to] == 0) {
            from_user.history[from_user.history_size] = _to;
            from_user.history_size ++;
        }
        //-----------------------------------------

        //_from's availible goes down
        from_user.total_availible -= _amount;

        //_to's delegated amount goes up
        from_user.delegates[_to] += _amount;

        //_to's voting power goes up
        to_user.total_power += _amount;
    }

    function undelegate(address _to, uint256 _amount) public {
        require(!vote_in_progress, "vote in progress");

        address _from = msg.sender;

        User storage from_user = users[_from];

        uint256 current_delgated = from_user.delegates[_to];

        require(current_delgated >= _amount, "undelgating more than balance");

        User storage to_user = users[_to];

        //_from's availible goes up
        from_user.total_availible += _amount;

        //_to's delegated amount goes down
        from_user.delegates[_to] -= _amount;

        //_to's voting power goes down
        to_user.total_power -= _amount;

    }

    function propose() public onlyOwner {
        // note we have not mechanism for deciding who can propose
        require(!vote_in_progress, "vote in progress");
        curr_proposal++;
        vote_in_progress = true;
    }

    function end_vote() public onlyOwner returns (uint8 result) {

        // note we have not mechanism for deciding who can endd the vote
        require(vote_in_progress, "vote not in progress");

        Proposal storage proposal = proposals[curr_proposal];

        vote_in_progress = false;


        // note we have a naive solution for choosing the threshold
        if(proposal.pro > proposal.against && proposal.pro > proposal.abstain){
            proposal.result = 1;
            return 1;
        } else if(proposal.against > proposal.pro && proposal.against > proposal.abstain){
            proposal.result = 2;
            return 2;
        } else {
            proposal.result = 3;
            return 3;
        }

    }

    function vote(uint8 _position, uint256 _amount) public {
        require(vote_in_progress, "vote in progress");

        require(_position == 1 || _position == 2 || _position == 3, "vote not valid");

        address _from = msg.sender;

        Proposal storage proposal = proposals[curr_proposal];

        Vote memory from_vote = proposal.votes[_from];

        require(from_vote.amount == 0, "already voted");

        uint256 total_power = users[_from].total_power;
        
        require(total_power >= _amount, "not enough votes availible");

        from_vote.amount = _amount;
        from_vote.position = _position;

        if (_position == 1) {
            proposal.pro += _amount;
        } else if (_position == 2) {
            proposal.against += _amount;
        } else{
            proposal.abstain += _amount;
        }

        proposal.votes[_from] = from_vote;
    }

    function unVote() public {
        require(vote_in_progress, "vote in progress");

        address _from = msg.sender;

        Proposal storage proposal = proposals[curr_proposal];
        Vote memory from_vote = proposal.votes[_from];

        uint8 position = from_vote.position;
        uint256 total_amount = from_vote.amount;

        require(total_amount != 0, "not voted yet");

        if (position == 1) {
            proposal.pro -= total_amount;
        } else if (position == 2) {
            proposal.against -= total_amount;
        } else{
            proposal.abstain -= total_amount;
        }

        from_vote.amount = 0;
        from_vote.position = 0;

        proposal.votes[_from] = from_vote;
    }


    function get_curr_proposal() public view returns(uint256) {
        return curr_proposal;
    }

    function get_vote_in_progress() public view returns(bool) {
        return vote_in_progress;
    }

    function get_total_supply() public view returns(uint256) {
        return total_supply;
    }

    function get_proposal_pro(uint256 _proposal) public view returns(uint256) {
        return proposals[_proposal].pro;
    }

    function get_proposal_against(uint256 _proposal) public view returns(uint256) {
        return proposals[_proposal].against;
    }

    function get_proposal_abstain(uint256 _proposal) public view returns(uint256) {
        return proposals[_proposal].abstain;
    }

    function get_proposal_result(uint256 _proposal) public view returns(uint8) {
        return proposals[_proposal].result;
    }

    function get_vote_amount(uint256 _proposal, address voter) public view returns(uint256) {
        return proposals[_proposal].votes[voter].amount;
    }

    function get_vote_position(uint256 _proposal, address voter) public view returns(uint8) {
        return proposals[_proposal].votes[voter].position;
    }

    function get_user_total_balance(address user) public view returns(uint256) {
        return users[user].total_balance;
    }

    function get_user_total_availible(address user) public view returns(uint256) {
        return users[user].total_availible;
    }

    function get_user_total_power(address user) public view returns(uint256) {
        return users[user].total_power;
    }

    function get_user_delgated_amount(address user, address delegatee) public view returns(uint256) {
        return users[user].delegates[delegatee];
    }

    function get_user_history_size(address user) public view returns(uint256) {
        return users[user].history_size;
    }

    function get_user_history(address user, uint256 index) public view returns(address) {
        return users[user].history[index];
    }
}