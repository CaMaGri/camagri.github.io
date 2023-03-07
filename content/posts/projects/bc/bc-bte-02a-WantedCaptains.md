---
title: "Behind the Scenes - Part 3A - WantedCaptains.sol"
date: 2023-03-05T13:22:53+01:00
---

As we mentioned in The Stories section, Wanted goal is obtaining two special tokens that betray a specific captain in order to gain the right to claim that captain's token.
At the beginning of this section we analyzed how the secrets work in BuccaneerCircus and how through them we can know if a token is special or not. Let's start, then, by analyzing the function that allows us to know if any of our tokens is an informer of a captain.

```solidity
function isValidSecret(
    uint248 captainId,
    uint8 groupId,
    uint256 tokenId,
    bytes32 secret
)
    public view returns (bool)
{
    require(groupId < 2, "Group ID should be 0 or 1");
    uint256 index = (captainId * 10) + groupId;

    bytes32 hash = keccak256(abi.encodePacked(tokenId, secret));

    return captainValidHashes[index][hash];
}
```

**isValidSecret()** is a very simple function that is responsible for validating whether a token and its secret correspond to a captain's informer, for a specific group of that captain. Remember that for each captain there are two groups of informers, A and B, which within the contract are known as groups 0 and 1 respectively. The function then computes the **keccak256** *hash* from the *tokenId* and *secret* and only returns *true* if the result exists as one of the inputs defined for that captain and group. It should be noted that this function does not control whether we have the token or not. Controlling this is the responsibility of the user.

```solidity
function claim(
    uint256 captainId,
    uint256 tokenId_0,
    bytes32 secret_0,
    uint256 tokenId_1,
    bytes32 secret_1
)
    public
{
    require(!claimedCaptains[captainId], "captain already claimed");
    require(
        mainContract.ownerOf(tokenId_0) == _msgSender(),
        "no owner of tokenId_0"
    );
    require(
        mainContract.ownerOf(tokenId_1) == _msgSender(),
        "no owner of tokenId_1"
    );

    require(
        isValidSecret(uint248(captainId), 0, tokenId_0, secret_0),
        "tokenId is not member of group 0 for captainId"
    );
    require(
        isValidSecret(uint248(captainId), 1, tokenId_1, secret_1),
        "tokenId is not member of group 1 for captainId"
    );

    // Mark the captain as claimed to avoid reentracies
    claimedCaptains[captainId] = true;

    // Starts captain transfer to claimer
    mainContract.safeTransferFrom(address(this), _msgSender(), captainId);
}
```

With two tokens in our possession that meet the conditions for claiming a captain, we're ready to call the **claim()** function. This function receives as parameters, on the one hand, the ID of the captain that we want to claim and, on the other, the ID and the secret of the two tokens that we intend to use as informers.
Analyzing the function, the first thing we notice is that, in addition to confirming that the captain has not been claimed, what is checked is that we are the owners of the tokens we are trying to use. This is so to avoid a *FrontRun* attack, something that we will discuss in another section with other security aspects.

Knowing that the tokens belong to us, the next thing the contract does is validate, through the *isValidSecret()* function, if these and their secrets correspond to values known to the captain and his two groups. If so, the captain is marked as claimed and then transferred to whoever called the function.

There are other functions that make up the contract but that do not help to understand its logic. For more details on how it works, we invite you to read the complete codes that you will find on the project's [GitHub](https://github.com/CaMaGri/BuccaneerCircus).