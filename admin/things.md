---
layout: topic
---

# Overview

The general elements, IAM and IoT policies, API, and dashboard of the
DragonConnect example should have been configured.

One of the final steps is to create a thing and an associated principal
(certificate) and attach the principal to the DragonConnect IoT policy.
The things.js script in the admin module will perform these actions.

This documentation assumes that the prerequisites for the admin module have
been satisfied earlier through the configuration of the
[Foundation](./foundation.html).

# Create

The DragonConnect client uses the machine identifier as the thingId.
The following command will store the machine identifier in the THING_ID
environment variable and then create the thing

```sh
$ cd admin
$ export THING_ID=$(cat /etc/machine-id)
$ node lib/things.js create ${THING_ID}
```

The certificate of the thing with identifier of ${thingId} will be stored
in the registry

```sh
$ cd admin/registry/${THING_ID}
```

You will need the aws.crt and aws.key to complete the configuration of the
client.

# Delete

The things.js script will also delete a thing.  This involves detaching the
DragonConnect IoT policy, deactivating associated certificate, deleting the
certificate, and, finally, deleting the thing

```sh
$ cd admin
$ node lib/things.js delete $(cat /etc/machine-id)
```
