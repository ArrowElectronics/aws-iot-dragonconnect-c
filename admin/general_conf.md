---
layout: topic
---
# Overview

Many Amazon services are configured with an ARN that requires a user's
account number and the region where the solution is deployed.  This step
defines these values so that the functions of
<font class="dragon_font">Dragon</font>Connect may use them.

## General Configuration

Please update the index.js script to include the AWS deployment region
and an account number.  This example assumes that you are the owner of the
account and may not work if you are using another account.  For example,
if your account number is **012345678901** and the
<font class="dragon_font">Dragon</font>Connect example will be
deployed in the **us-east-1** region then update to entries in the index.js
configuration file to

> region: 'us-east-1', <br>
> accountNumber: '012345678901',
