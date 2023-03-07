---
title: "Behind the Scenes - Part 3C - TheSunkenLegend.sol"
date: 2023-03-05T14:46:01+01:00
---

By far this was the most ambitious challenge but also the most fun to implement. As there are several things that this contract does, we are going to analyze use cases and explain the functions that are being executed in the process.

Let's start by looking at the typical use case: *Collect all four keys and claim the bounty.*

1. When we mint a token that has a key, what actually happens is that the token does not have the key, but rather has the right to claim it. This right to claim the key is implemented in the **claimKey()** function using the secrets in the same way as they were used in previous contracts. So, the first thing we must do is claim the key and then we will be able to transfer or use it. Note that this needs to be done only once.

2. To access the *bounty*, the four keys must exist under the same wallet, either in one or several tokens, and for this we need to be able to transfer them.\
Nothing prevents a token from having more than one key, but what we do need to know is that keys cannot be transferred between tokens that are in different accounts. This was implemented in this way to prevent accidental transfers of the key to third parties.\
Another existing restriction on the transfer of keys is that they cannot be transferred in periods of less than one hour. This second restriction exists so that in case someone wants to send a token to a third party saying that he has the key, the third party can know how much time he has before the owner can transfer the key again. This gives the buyer some advantage so that they can acquire a key without being exposed to a *FrontRun* attack that takes the key during the token transfer.

    ```solidity
    function transferKey(
        uint256 keyId,
        uint256 toTokenId
    )
        public whenNotShuffling
    {
        require(keyId < 4, "invalid keyId");
        require(
            mainContract.ownerOf(keys[keyId].ownerTokenId) == address(msg.sender),
            "key owner error"
        );
        require(
            mainContract.ownerOf(toTokenId) == address(msg.sender),
            "toTokenId error"
        );
        require(
            block.number.sub(keys[keyId].changeBlockNumber) > ONE_HOUR_BLOCKS,
            "one transfer x hour"
        );
        require(
            keys[keyId].ownerTokenId != toTokenId,
            "already own the key"
        );

        keys[keyId].changeBlockNumber = block.number;
        keys[keyId].ownerTokenId = toTokenId;
    }
    ```
    In the implementation of the **transferKey()** function we can see the five conditions that describe the aforementioned: that we own the token that has the key and the token to which we transfer it; Approximately one hour (~300 blocks) has passed since the last time it was transferred and the recipient token is not the token that owns the key. With these conditions satisfied, the function marks the current block as the change point and the target token as the new owner.

3. With the four keys under the same wallet, we are in a position to claim the bounty. The function responsible for this is **claimBounty()** which has no parameters.
    ```solidity
    function claimBounty() public whenRunning whenNotShuffling {
        require(bountyBalance > 0, "no balance to claim");


        uint256 _rewardAmount = bountyBalance;
        bountyBalance = 0;


        for(uint8 keyId = 0; keyId < 4; keyId++) {
            require(
                mainContract.ownerOf(
                    keys[keyId].ownerTokenId
                ) == address(msg.sender),
                "not key owner"
            );
            keys[keyId].shuffle = true;
        }


        _requestShuffle(_rewardAmount, address(msg.sender));
    }
    ```
    The function controls whether we own the tokens that hold the keys, marking the keys as *"shuffle"* in the process, and then calling the **_requestShuffle()** function. The key flag *"shuffle"* is set so that once the random numbers are generated, the callback function that receives them can know which keys should be shuffled and which should not. Because you are claiming the bounty, all the keys will be redistributed, but as we will analyze later, there are cases where this is not the case.

4. This is where things get a bit trickier. The *_requestShuffle()* function is in charge of calling the external function **requestRandomWords()** that triggers the generation of random numbers. Once the numbers are generated, the function **fulfillRandomWords()** is called with the results, giving continuity to the process.\
To learn more about the operation of *ChainLink's VRF (Verifiable Random Function)*, we provide you the following [link](https://blog.chain.link/verifiable-random-function-vrf/)

    ```solidity
    function _requestShuffle(
        uint256 _amount,
        address _to
    )
        private
    {
        require(subscriptionId > 0, "VRF no set up");
        shuffleStartBlock = block.number;

        shuffleRequestId = vrfCoordinatorIface.requestRandomWords(
            keyHash,
            uint64(subscriptionId),
            3,
            200000,
            1
        );

        payments[shuffleRequestId] = Payment({
            approved: false,
            paid: false,
            amount: _amount,
            to: _to,
            expirationBlock: (block.number + (ONE_HOUR_BLOCKS * 24 * 7))
        });

        userPaymentIds[_to].push(shuffleRequestId);
        allPaymentIds.push(shuffleRequestId);
    }
    ```
    As return value of the *requestRandomWords()* function we will obtain an ID that will be the identifier of this shuffle context. In the code we observe that before carrying out any execution, the first thing that is done is to store the current block number in the **shuffleStartBlock** variable. This variable is used by the **whenNotShuffling** modifier, implemented in several functions, to know if there is a shuffle process running or not, preventing more than one from running at the same time.

    Once we have the identifier for the random number request, the next thing to do is create an instance of Payment that will be stored using the identifier as an index. Payments are the means through which the contract knows to whom it must pay, how much it must pay, if the payment is approved or not, if it was paid or not, and when that payment expires. With all that information in the object, and having saved some references to make it easier to access, we're ready to finish the function and wait for the callback function *fulfillRandomWords()* to be called.

5. During the time that the contract waits for the callback function *fulfillRandomWords()* to be called, it remains partially blocked for functions that apply the *whenNotShuffling()* modifier.

    ```solidity
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    )
        internal override
    {
        if (requestId != shuffleRequestId)
            return;

        uint256 randomWord = randomWords[0];

        for(uint8 keyId = 0; keyId < 4; keyId++) {
            if (keys[keyId].shuffle) {
                keys[keyId].ownerTokenId = randomWord.mod(
                    mainContract.totalSupply()
                );
                randomWord = randomWord >> 16;
                keys[keyId].shuffle = false;
                keys[keyId].changeBlockNumber = block.number;
            }
        }

        payments[requestId].approved = true;
        shuffleStartBlock = 0;
    }
    ```
    The function *fulfillRandomWords()* will only be executed when it is called trying to satisfy the last request that was made. If a redistribution never completes and exceeds the timeout (24 hours), then another redistribution can take its place, making the first redistribution unable to finish. This can happen for example, because the *ChainLink* subscription has no funds or for some other reason. Regardless of the reason, what you need to know here is that the callback is only expected for one day and failure to complete causes new generated requests to replace this one. Requests that could not be completed are not marked as approved and will then be refunded during the *cleanPayments()* function call, increasing the bounty balance to incorporate the amount of the overdue payment.

    With the random number received by the function *fulfillRandomWords()*, the contract iterates over the four keys to find out which ones have the *shuffle* flag set, assigning, when true, a new holder based on the random number, the current block as the moment of change and marking the *shuffle* flag to false.

    Upon completion, the payment corresponding to the request is approved and the *shuffleStartBlock* variable is set to zero, to allow another redistribution to take place.

6. With the *Payment* approved, we are ready to claim it. By calling the **getUserPayments()** function and specifying the address of our wallet, we can find out the status of our payment, including whether it is approved or the amount of the payment.\
In order to get the Ethereum of the payment already approved, we must call the **claimPayment()** function indicating the ID of the payment to execute.

    ```solidity
    function claimPayment(uint256 paymentId) public {
        require(
            payments[paymentId].approved && !payments[paymentId].paid,
            'not approved or already paid'
        );
        require(
            payments[paymentId].to == address(msg.sender),
            'payment owner error'
        );
        require(
            payments[paymentId].expirationBlock >= block.number,
            'expired payment'
        );

        payments[paymentId].paid = true;


        (bool success, ) = payments[paymentId].to.call{
            value: payments[paymentId].amount
        }("");
        require(success, 'transaction error');
    }
    ```
    *claimPayment()* will check that the payment is approved and has not been executed, that the recipient of the payment is us, and that the payment has not expired. With these conditions satisfied, it is marked as paid to avoid reentrant calls and then the transfer of the indicated amount is executed.\
    Some things to note at this point: We may be receiving an amount less than the amount of money the contract has at the time *claimPayment()* is called, since the payment is defined at the time the *claimBounty()* function is called and not after. We can have several pending payments as long as they are not more than a week from their creation.

7. Finally, the **cleanPayments()** function works as a sort of *Garbage Collector*, recovering the balance of all those payments that were due without being completed.

    ```solidity
    function cleanPayments() public {
        require(cleanPaymentsIndex < allPaymentIds.length);
        require(
            payments[allPaymentIds[cleanPaymentsIndex]].expirationBlock < block.number,
            "no expired payments"
        );

        for(; cleanPaymentsIndex < allPaymentIds.length; cleanPaymentsIndex++) {
            Payment memory _payment = payments[allPaymentIds[cleanPaymentsIndex]];

            if(_payment.paid == true) {
                continue;
            }

            // Is It not expired?
            if(_payment.expirationBlock >= block.number) {
                break;
            }

            // If we are here is because the payment was not paid and It is expired
            bountyBalance += _payment.amount;
        }
    }
    ```
    The **cleanPaymentsIndex** variable references the next payment to be processed by **cleanPayments()** within the existing payments in **allPaymentIds**. When *cleanPaymentsIndex* references a payment that has expired but has not been executed, the function returns the amount of the payment to the bounty balance before continuing with the next input. At the end, the function will stop when there are no more payments to process or when the referenced payment is not expired or finalized.

So far we have analyzed the typical use case of this contract, leaving out of the analysis only some functions that we will see next.

The next case to be analyzed consists of invoking the **shuffle()** function to mobilize those keys that remained in the same token for a period of more than one month, without being transferred.

1. This context is quite different from the first use case analyzed since here we don't even need to have a token to call the function.

    ```solidity
    function shuffle() public whenRunning whenNotShuffling {
        uint128 keysToShuffle = 0;
        uint128 keyId = 0;
        uint256 _rewardAmount;

        for(; keyId < 4; keyId++) {
            keys[keyId].shuffle = (
                block.number.sub(
                    keys[keyId].changeBlockNumber
                ) > (ONE_HOUR_BLOCKS * 24 * 30)
            );
            if (keys[keyId].shuffle)
                keysToShuffle += 1;
        }

        if (keysToShuffle == 0)
            revert("no keys to shuffle");

        // In this case, 1% of bounty per key, is paid as reward
        _rewardAmount = bountyBalance.div(100).mul(keysToShuffle);
        bountyBalance -= _rewardAmount;

        _requestShuffle(_rewardAmount, address(msg.sender));
    }
    ```
    The only condition that has to be met to call the *shuffle()* function is that there are keys that are at least one month old since the last time they were transferred. With this condition satisfied, a prize of 1% of the total bounty is calculated for each key, which will be paid following the same mechanics as in the *claimBounty()* function.

2. As you may recall from the previous use case, when we discussed the *claimBounty()* function, it set all keys to be *shuffled*, and we mentioned that this wasn't going to happen every time. It is at this point that that changes. In the *shuffle()* function, the only keys marked for redistribution are those that meet the condition of not having been transferred, while the rest remain unchanged.

3. After the execution of the *shuffle()* function, the process of obtaining the reward is exactly the same as that followed for the payment of the bounty, so its steps refer to understanding the previous analysis.

And with this last analysis we end the description of the contracts. Reading their code is always the best way to understand their entire operation, but many times it happens that the code by itself is not representative of the use case, and although one can get an idea of what they do, Knowing the "why" of that logic makes it easier to understand the contract.



