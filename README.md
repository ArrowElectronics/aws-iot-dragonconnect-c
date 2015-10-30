# aws-iot-dragonconnect-c

# Introduction
The DragonConnect project demonstrates recording events originating from
the DragonBoard and managing a General Purpose IO (GPIO) device.  The events
are generated by pressing the volume up and volume down buttons using MQTT
with those events being displayed in a web browser.  This demonstration uses
the Amazon API Gateway, Lambda, and DynamoDB.

The GPIO device is an LED that is controlled using the IoT API and Things
Shadows using a web interface.  The Amazon technologies used are the API
Gateway and Lambda functions.

# Getting Started
In order to run this demonstrations, you will need

* An Amazon account
* A breadboard
* Wire
* LED
* 50 milliohm resisitor

## Configuring Amazon Services
The following steps provide an overview of configuring the Amazon Services

* Configure the Lambda functions through the console
* Create the dragonconnect-audio-events DynamoDB table
* Configure the API Gateway for the Lambda functions through the Amazon console.  The API Gateway will need to enable CORS for several of the resources.

In order to manage the LED, you will need to wire a breadboard as follows

* Connect one end of the wire from the GPIO 2 (positive) position to a row (n) in the breadboard
* Connect the anode of the LED in the same row (n)
* Connect the cathode of the LED to a different row (m)
* Connect one end of the resistor in the same row (m) as the cathode of the LED
* Connect the other end of the resistor to a third row (o)
* Connect the ground from the GPIO to the third row (o) of the breadbroad

Upload the contents of the ui directory to s3 and configure the bucket to act
as a static website following the instructions at
http://docs.aws.amazon.com/AmazonS3/latest/dev/WebsiteHosting.html.

Finally, you will need to login to the DragonBoard, transfer the contents
of the device directory, and compile the program using the Makefile.
