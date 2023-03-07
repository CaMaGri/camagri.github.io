---
title: "Behind the Scenes - Part 3B - TheCursedOne.sol"
date: 2023-03-05T14:26:24+01:00
---

**TheCursedOne** is a contract similar in its operation with *WantedCaptains* except for some details that we are going to analyze. Let's remember that in *TheCursedOne* there is only one token that we can claim and for them we must obtain tokens that know the eight stanzas that compose the poem that we are trying to complete. The other detail is that these stanzas must be written down and at the time of pronouncing the poem we must still possess at least four of the eight tokens that provided them to us. It sounds more complex than it really is. Let's look at some functions to clear this up a bit:

```solidity
mapping(address => mapping(uint256 => uint256)) private seenTokens;

...

function setSeenToken(
    uint8 groupId,
    uint256 tokenId,
    bytes32 secret
)
    public
{
    require(
        mainContract.ownerOf(tokenId) == _msgSender(),
        "you must be the token owner"
    );
    require(
        _isValidSecret(groupId, tokenId, secret),
        "invalid group member"
    );

    seenTokens[_msgSender()][groupId] = tokenId;
}
```

The **setSeenToken()** function is the function that is called when we "write down" a stanza of the poem. As we can see, the function first checks that we have the token that we say we have, then it validates that its secret corresponds to the stanza that we are trying to write down (the stanzas within this contract are known as *groupId*) and if these conditions are true, it will save the *tokenId* as a reference for the stanza we marked.
This function should be called at least eight times with different tokens that complete the eight stanzas (groups 1 through 8). It should be noted that we can overwrite an entry already established with another token, as long as at the end It meets the conditions of the group.

With the 8 entries complete and still in possession of at least four of the eight tokens, we can start the claim.

```solidity
function claim() public {
    require(!claimed, "Deken was already claimed");

    uint8 stillOwned = 0;
    for(uint8 groupId = 1; groupId <= 8; groupId++) {
        uint256 tokenId = seenTokens[_msgSender()][groupId];
        require(
            tokenId != 0,
            "not all groups seen"
        );


        if (mainContract.ownerOf(tokenId) == _msgSender())
            stillOwned += 1;
    }

    require(
        stillOwned > 3,
        "you must still own more than 3 tokens"
    );

    // Mark the captain as claimed to avoid reentracies
    claimed = true;

    // Starts Deken transfer to claimer
    mainContract.safeTransferFrom(
        address(this),
        _msgSender(),
        0
    );
}
```

In this implementation of **claim()**, it is checked in the eight iterations that are made (one per group) that we have established a *tokenId* for each group, increasing a counter in the process in the cases where we are still holders of the token. If at the end of the loop we have at least 4 of the 8 tokens, then the token is marked as claimed and transferred to the address of the person who executed the function.

With this we conclude the analysis of the first two challenges of *BuccaneerCircus*. The next and last one requires a slightly longer analysis but it is very interesting to read.
