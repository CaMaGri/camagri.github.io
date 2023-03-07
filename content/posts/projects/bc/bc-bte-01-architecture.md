---
title: "Behind the Scenes - Part 2 - Architecture"
date: 2023-03-05T12:13:47+01:00
---

## Architecture ##

A fundamental part of BuccaneerCircus is the different components of its architecture and how they cooperate to make everything work.\
Among the requirements that define this architecture, the most relevant is the progressive disclosure of metadata, something that will make more sense when we analyze smart contracts. For the moment we must know that it will be necessary for some metadata fields to remain hidden until the corresponding token is minted.\
The other requirements could be defined as:

* Serve the static content of the portal (html, images, CSS, JavaScript).
* Encrypt communication on all possible points.
* Automate all possible tasks.
* Use IPFS to store the images and in the future, the metadata as well.
* Interact with the blockchain and update states within the architecture.
* ...

The following diagram is a visual reference of the components and their relationship.

![Architecture Preview](/posts/projects/bc/full_arch_v2.png)

To get an idea of the role of each component, we suggest you analyze how the metadata of a token is obtained, in this case #11, describing each stage of its execution.

1. The first thing we must know to obtain the metadata of a token is the URI where it is located. This URI is obtained as a result of calling the *tokenURI()* function of the project's main contract ( *ERC721* ) with the token ID as  a parameter, which in our case would return ["https://api.buccaneercircus.io/token/11"](https://api.buccaneercircus.io/token/11) .

2. Knowing the URI and having started the request, it is likely that we will notice that the *api.buccanercircus.io* domain does not resolve to a host IP but to **CloudFlare**.\
Several of the *buccaneercircus.io* domains resolve to *CloudFlare* since this is the service used as a proxy between end users and the *AWS* services on which a large part of the project runs. We use *CloudFlare* to reduce *AWS* costs by serving as a content cache, but also making it easier to deploy signed certificates, attack detection, and more—not to mention that it's free for these types of use cases.

3. Having the request passed *CloudFlare* and already within the AWS network, the next component that we will find is the *ApiGateway*, which is nothing more than the *AWS* solution to connect URLs to lambda functions. In other words, here it is defined which HTTP requests (path, querystring, method, etc) trigger the execution of which lambda functions and how the result of that execution is returned to the user.\
In our case, the **GET /token/{tokenId}** request results in the execution of the **get_token_metadata(token_id)** lambda function with the token_id as the only parameter.

4. So, going back to our analysis, the **get_token_metadata()** function will be in charge of taking the metadata of token #11 from the *Private Bucket*, evaluating if it should hide any information and generating a response based on that.

5. The *Private Bucket* is a *S3* bucket where all the metadata files are stored (one file for each token) as well as a file that contains information about the status of the tokens (which should be visible or not) called **minting.json**.\
*S3 Buckets* are the way *AWS* provides us to store content in the cloud and easily access it. The other Bucket that exists in the project is the *Public Bucket* which, as its name suggests, has its public content, which is nothing else than the files that make up the *BuccaneerCircus* portal (css, html, js, etc).

1. Finally, the *get_token_metadata()* function will return the *JSON* corresponding to the metadata, which is sent as response to the HTTP request, hiding the required information depending on the context.

In this analysis we were able to include most of the parts that make up the diagram. Some components were left out, but since they are simple we will explain them individually.

*CloudFront* is an *AWS* solution that we use to implement HTTPs access to the portal files. *S3 Buckets* already implements a solution to serve the files it contains through an HTTP service, but with the problem that they do not support HTTPs.
One of our biggest concerns from the beginning of the project was security and this includes maintaining encrypted and signed connections at all ends, including what happens between *CloudFlare* and *AWS*. It's a bit paranoid but we didn't want the requests to travel flat in any instance of the connection. So even the content on the web has a fully encrypted circuit, from the Bucket to the browser. Shortcuts to *AWS* resources were also disabled.

The last thing we have to analyze is how the information that *get_token_metadata()* uses to know what metadata to hide and what not, is kept up to date. We mentioned above that this is known thanks to a file in JSON format called *minting.json*, which is located in the *Private Bucket*. The information that this file contains is updated by an external service that is in charge of carrying out the queries on the Ethereum network to later reflect that information in *minting.json*. This update is done through an API endpoint that calls the lambda function **update_minting_info_json()** and can only be used by this script since access is restricted by an API Key that only it knows.

Let's see a diagram to better understand the idea:

![update_minting_info_json_diagram](/posts/projects/bc/update_minting_json.png)
*(1) Request minting state. (2) Invoque API to make the update. (3) Overwrite minting.json*

At this point one might ask, why not make the get_token_metadata() function directly query the state of the tokens instead of having an external service updating the file? The problem with this is that AWS microservices have a maximum execution time of 3 seconds and the RPC calls to the Ethereum node are not that fast.\
All of the above leads to a delay between changes in the minting state and the moment in which they are reflected in the disclosure of the metadata, although this does not represent a problem.

These scripts, running remotely and keeping the token information updated, do not run on AWS but on a virtual machine of the Digital Ocean platform. EC2 from AWS could have been used, but Digital Ocean is a platform that we already knew and that is very simple to use as well as cheap.

With this we finish analyzing the general idea of how the project progressive metadata disclosure circuit works. Probably there are details to know which you can consult us without problem, but we believe we have achieved the objective of mentioning the technologies used and making the general architecture of the project known.\
In the following article we will analyze smart contracts and their operation.
