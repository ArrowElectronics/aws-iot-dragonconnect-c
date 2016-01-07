---
layout: topic
---
# Overview

Amazon services are usually configured using an
<a href="http://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html"
target="_blank">Amazon Resource Name (ARN)</a>.  An ARN typically requires
a user's account number and the region where the solution is deployed.
This step defines these values so that the functions of DragonConnect may
use them.

## General Configuration

Update the configuration script (config/index.js)

```sh
$ cd config
```

to include the AWS deployment region and an account number.  The
DragonConnect example assumes that you are the owner of the
account and may not work if you are using another account.  For example,
if your account number is **012345678901** and DragonConnect will be deployed
in the **us-east-1** region then update the config/index.js
configuration file to

```js
region: 'us-east-1',
accountNumber: '012345678901',
```
