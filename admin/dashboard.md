---
layout: topic
---

# Overview

The dashboard is a set of static HTML and JavaScript that use the
DragonConnect API to display the audio
events and manage the LED.

# Create

The URL of the DragonConnect API will be of
the form

> https://${rest-api-id}.execute-api.${region}.amazonaws.com/${stage}

The rest-api-id may be discovered using the following the following command
(remember to use a backtick (`) surrounding the string DragonConnect)

```sh
$ aws apigateway get-rest-apis \
--query 'items[?name.contains(@, `DragonConnect`)].id' \
--output text
d15bvgy5j2
```

With this information, configure the
DragonConnect UI client by setting the
DB_API variable in the file ui/content/config.js (be sure to set the stage
to the same value used in the
<a href="./api.html">DragonConnect API</a>
configuration)

```js
var DB_API='https://d15bvgy5j2.execute-api.us-east-1.amazonaws.com/dev';
```

Once the configuration has set, an Amazon s3 bucket may be used to host the
client.  The bucket should have a unique name so consider appending your
user name to the dragonconnect string

> dragonconnect-${identifier}

Create the bucket using the following command

```sh
$ aws s3 mb s3://dragonconnect-${identifier}
```

Copy the DragonConnect UI client to the bucket
by issuing the following command

```sh
$ cd ui/content
$ aws s3 cp --recursive . s3://dragonconnect-${identifier}
```

The bucket must now be configured to accept web requests.  This is a two-step
process which first involves setting a bucket policy.  The prototypical
bucket policy needs to be modified to use the name of the bucket

```json
"arn:aws:s3:::dragonconnect-${identifier}/*"
```

Once the bucket name has been set, configure the bucket policy using the
following command

```sh
$ cd ui/policy
$ aws s3api put-bucket-policy --bucket dragonconnect-${identifier} \
--policy file://bucket-policy.json
```

Finally, enable web requests on the bucket by setting the index document

```sh
$ aws s3 website s3://dragonconnect-${identifier} \
--index-document index.html
```

The DragonConnect dashboard should now be ready to use.

# Delete

The following command will delete the s3 bucket used for the
DragonConnect UI

```sh
$ aws s3 rm -r s3://dragonconnect-${identifier}
```
