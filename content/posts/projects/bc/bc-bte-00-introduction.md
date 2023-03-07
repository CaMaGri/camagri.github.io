---
title: "Behind the Scenes - Part 1 - Introduction"
date: 2023-03-05T10:59:35+01:00
---

## The Beginning ## 
At the beginning of 2021 we had the idea of creating a game taking advantage of NFT technology for its implementation. Although many ideas arose, most of them greatly exceeded the resources of time and money that we had to carry them out. However, we liked one idea because of its simplicity and because it allowed us to make a first approach to what we were looking for, with a good chance of coming to fruition. This is how BuccaneerCircus was born, a project where the told stories  are enhanced through illustration and the use of smart contracts.
More than a year has passed since then, but today we can happily show the result of all that effort.

The goal of this series of posts is to share all the knowledge gotten during the development of the project, both for those who are curious about its implementation, and for those who are embarking on similar projects and need guidance.

In this first part we will explain what each of the adventures consists of, in a very synthetic way. The goal is to form a general idea of what we have to do behind each adventure that later becomes the requirements for implementation.
Then we will talk about the architecture, the different components that interact in the project and how these help to carry out the implementation.
Finally, we are going to explain Smart Contracts. This is the most technical part and aims to know the details in the implementation of the contracts.

## The Stories ##
To understand not only the architecture of the project but also how smart contracts work, it is advisable to have at least a basic idea of the plot in the different stories. To achieve this, we are going to briefly explain what each story consists of and what the objective of the game is in each case.

### Wanted ###

![Wanted Captains](/posts/projects/bc/wanted_banner.png)

***Wanted** reflects the experiences of the crew with respect to their law fugitive captains and not so much of the latter themselves. The experienced ones usually know how to faithfully recount the events that led to the condemnation of their leader, while the cabin boys are unaware of the details and judge them worse. And it is in this cocktail of emotions that the lack of empathy forges the betrayals.*

The objective in Wanted is to get two informers from the same captain in order to deliver him to justice and obtain his token as reward.
An important detail to take into account is that each captain has 8 informers belonging to two different groups A and B. In order to claim a captain we need one informer to be from group A and the other from group B.

### The Cursed One ###

![The Cursed One](/posts/projects/bc/the-cursed-one_banner.png)

*The legend behind **The Cursed One** tells us the story of a captain who dared to face the Devil himself and because of his arrogance, was condemned to sail forever. It is common knowledge for the islanders that they should not sing about this sailor, as it is an invitation to appear, and few are alive who can tell how that ends.*

The Cursed One poem is composed of eight stanzas that must be written down on paper to be remembered. This paper is in the cabin that we access through the door that is presented to us in this adventure, and can only be accessed if we have at least one BuccaneerCircus token.
At the end, with all eight stanzas written and keeping at least four of the eight tokens that provided them, we'll then be ready to speak the poem, summon The Cursed One, and obtain BuccaneerCircus token #0.

### The Sunken Legend ###

![The Sunken Legend](/posts/projects/bc/the-sunken-legend_banner.png)

*Where there are pirates, there is treasure and BuccaneerCircus is not an exception.
**The Sunken Legend** is about a French marquis who possessed vast wealth that seemed endless, to the point of arousing suspicion. Associated with his philanthropy among friends, the locals spoke of the **"Marquess's Banquet"** to refer to all this. At the time of the man's death, his properties were raided in search of a surreal explanation for so much money, but none was ever found, thus creating the legend.\
Some say that only certain people close to the marquis know the secret to access these riches, which would emerge from the interior of a huge chest; the truth is that whoever manages to lay their hands on it, would obtain an unlimited fortune.*

With this legend begins one of the most ambitious adventures of *BuccaneerCircus*.
*The Sunken Legend* tells us of a chest called the *Marquess's Banquet*, which can only be accessed by possessing the four keys that open it. These four keys are distributed among the *BuccaneerCircus* tokens and as in the other adventures, we will only know if a token has a key, once it has been minted.

Some things to highlight
* Keys can be transferred between tokens as long as the tokens exist under the same account.
* Nothing prevents a token from having more than one key, even all the keys.
* The keys will be randomly redistributed among all *BuccaneerCircus* tokens, once the content of the chest is claimed.
* Finally, a key can also be redistributed if a period of more than one month elapses without it being transferred to another token.

Finally we must have all the tokens that have keys to access the Marquess's Banquet and its contents.

For more details about the adventures or how to participate in them, we recommend you visit the *BuccaneerCircus* portal or write to us through Discord, Twitter or Instagram.

So far we have made an introduction to the project, analyzing the stories and how to participate in them. In what follows we will take a look at the different components and technologies that make up the project and how they interact to make everything work.

