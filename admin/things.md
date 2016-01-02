---
layout: topic
---

# Overview

The general elements, IAM and IoT policies, API, and dashboard of the
<font class="dragon_font">Dragon</font>Connect example should have been
configured.

One of the final steps is to create a thing and an associated principal
(certificate) and attach the principal to the DragonConnect IoT policy.
The things.js script in the admin module will perform these actions.

This documentation assumes that the prerequisites for the admin module have
been satisfied earlier through the configuration of the
[Foundation](./foundation.html).

# Create

To create a thing, you must first decide upon a name for the thing.  This
same name will be used to configure the
<font class="dragon_font">Dragon</font>Connect client.  In order to create a
thing, issue the following command

```sh
$ cd admin
$ node lib/things.js create ${thingId}
```

The certificate of the thing with identifier of ${thingId} will be stored
in the registry

```sh
$ cd admin/registry/${thingId}
```

You will need the aws.crt and aws.key to complete the configuration of the
client.

# Delete

The things.js script will also delete a thing.  This involves detaching the
DragonConnect IoT policy, deactivating associated certificate, deleting the
certificate, and, finally, deleting the thing

```sh
$ cd admin
$ node lib/things.js delete ${thingId}
```
