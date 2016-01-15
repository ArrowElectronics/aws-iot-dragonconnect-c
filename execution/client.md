---
layout: topic
---

# Overview

The DragonConnect client is an application written in C that collects and
transmits volume up and volume down button presses.  The client application
will also activate and deactivate an LED.  Both functions use the MQTT
function of the _IoT_ service.

# Configuration

The configuration of the client involves determining the MQTT endpoint,
compiling the client application, and copying the certificates of
the thing.

## Endpoint

The DragonConnect client needs to be configured to use the appropriate
MQTT endpoint.

The endpoint can be discovered using the following command

```sh
$ aws iot describe-endpoint --query endpointAddress --output text | \
tr :[A-Z] :[a-z]
a1a97y3smarfzt.iot.us-east-1.amazonaws.com
```

## Compiling the Client

Edit the file DragonBoard/src/aws_demo.c and modify the HostAddress
appropriately

```c
char HostAddress[255] = "a1a97y3smarfzt.iot.us-east-1.amazonaws.com";
```

Once the HostAddress has been updated, you will need to compile the application
using the included Makefile

```sh
$ cd DragonBoard
$ make
```

## Running the Client

The client may now be executed by issuing the following commands

```sh
$ cd DragonBoard/bin
$ sudo ./aws_demo
```

# Stopping the Client

The client is stopped using sending a KILL signal to the process which includes
typing a Ctrl-C in the terminal running the process.
