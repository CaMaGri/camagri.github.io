---
title: "Behind the Scenes - Part 3 - Smart Contracts"
date: 2023-03-05T13:11:19+01:00
---

*Smart contracts* are probably the most interesting and complex part of the project and that is why we will spend more time understanding them.

In what follows we will first explain the concept of **secret** that is common to all three contracts and then we will analyze each contract separately. Some very technical issues may be omitted, but the analysis that we will carry out here is much more in-depth than the previous ones, trying to achieve a good understanding of the logic behind the contracts.

## The Secrets ##

When writing the contracts, one of the issues that arose was the need to find a way for the contracts to recognize when a token was special without exposing the list of special tokens in the process.

The problem with this is that blockchains are transparent in the information they store, which means that no matter how we store a value, if it is not hidden **before** it is used in a transaction, it can be known by anyone. In other words, it does not matter that we store this information in a private variable, for example, this information, although it will not be accessible by the person who uses the contract, can be known by analyzing the blockchain.

One of the simplest ways to hide information and make it very hard to guess is to apply a *hash* function and store the result so that only someone who knows the input can regenerate that output, but this is not a solution if that input is predictable.\
In our case, what we need is to hide the token id of the tokens that are special and if we only keep the *hash* of those ids, it would be very easy to figure out which *hashes* correspond to which ids. So, to fix this problem, something else had to be added to the *hash* input besides the token id, something that would make it more difficult for special tokens not to be discovered. That is where **"the secret of the token"** comes into play.

Each token has a secret that is nothing more than the *hash* of the **"description"** field of its metadata, this being the main reason why a token's metadata is revealed only after it has been minted. Only then, its *"description"* field and its *"image"* field are revealed, thus preventing someone from knowing in advance its secret and therefore whether it is special or not.

Knowing the secret is only the first step to access the contract functions, the second condition is to own the token to which the secret belongs. This relationship between the Id token and the secret is established through another *hash* function applied to the two combined elements, resulting in the value stored in the contract.

![token-hash-generation](/posts/projects/bc/token_hash_generation.png)

In the image we can see the process through which the value stored in a contract is calculated. As expected, **keccak256** is the hash function used, which is applied first to the *"description"* field of the metadata and then to the result of the encode between the token id and the secret.
So, in order to know if a token id is special, we must first be able to access the *"description"* field of its metadata, calculate the hash as indicated above and compare the result with the hashes stored in the different contracts. In case there is a match, we will then know that our token is special.

These hashes can be found in the three contracts of each *BuccaneerCircus* story, indicating which tokens are special within the set of tokens we possess.

Understanding the mechanics of the secrets we are ready to begin the analysis of the contracts.

## BuccaneerCircus.sol ##

**BuccaneerCircus.sol** is the main contract and the foundation on which the other three contracts work. While this is a simple contract that extends the functionality provided by *OpenZeppelin's* **ERC721Enumerable** and **Ownable** contracts, there are some features that were added that are worth looking into.

The setup functions **setupBaseContracts()** and **setMarquisBanquetContract()** are in charge of establishing in this contract the addresses of the other three contracts, but also, in the case of *setupBaseContracts()*, minting the first 15 tokens and sending each one to the corresponding address: #0 to the *TheCursedOne* contract, the tokens from #1 to #10 to the *WantedCaptains* contract and finally the tokens from #11 to #14 to the *BuccaneerCircus team* wallet. This is so because the tokens that represent the reward in any of the adventures of the project are managed by the same contract that implements the game logic.

The minting in this contract is executed through the **mintRovers()** function, which only controls two things before performing the minting: That the maximum of 16 tokens per transaction is not exceeded and that *0.1 ether* is being sent to the contract for each token that we are trying to lie. The logic that follows these checks is mostly implemented in the contracts from which It is inherited.

The last function we will discuss is the **withdraw()** function. This function is in charge of recovering all the Ethereum that the contract has and sending it to the address specified as a parameter. What must be noted about this function is that during its execution, 1% of the total stored Ethereum is sent to the address of the *Marquess's Banquet* contract, which was previously established in the setup, transferring the remainder to the recipient of the *withdrawal*. This 1% represents the first place where the *Marquess's Banquet* gets its wealth.

Details about the implementation of this contract can be studied in the contract code. In the following sections we will analyze the remaining three contracts trying to explain their operation as best as possible without falling into technical details that do not contribute to their understanding.