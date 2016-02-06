#!/bin/bash
SCRIPTPATH=$( cd $(dirname $0) ; pwd -P )

BASE_DRAGONBOARD_DIR="/home/linaro/Documents"
DEFAULT_REGISTRY_DIR="registry"
ARROW_DIR="arrow"
DRAGONPULSE="aws-iot-dragonpulse-js"
DRAGONCONNECT="aws-iot-dragonconnect-c"

#apt-get install groff

#ask for:
## account number
## region - read from ~/.aws/config
## stage
## s3 bucket identifier


echo -e "DragonConnect should exist at $BASE_DRAGONBOARD_DIR/$ARROW_DIR/$DRAGONCONNECT"

if [ ! -d "$BASE_DRAGONBOARD_DIR" ]; then
	echo -e "Please provide an alternate base directory:"
	read pPath

	if [ "$pPath" == "" ] ; then
	  echo "Using default path '/home/linaro/Documents'"
	else
	  echo "Using custom path $pPath"
	  BASE_DRAGONBOARD_DIR=$pPath
	fi
fi

if [ -d "$BASE_DRAGONBOARD_DIR/$ARROW_DIR/$DRAGONCONNECT" ]; then

	cd $BASE_DRAGONBOARD_DIR/$ARROW_DIR/$DRAGONCONNECT

	echo -e "***Creating Amazon IAM and IoT Elements..."
	#Create IAM and IoT Elements
	cd admin
	npm install ../config
	npm install
	node lib/foundation.js create

	#reset the path
	cd $BASE_DRAGONBOARD_DIR/$ARROW_DIR/$DRAGONCONNECT

	echo -e "***Modifying Amazon lambda functions..."
	#Lambda function management
	cd lambda
	export NODE_PATH=lib
	npm install ../config
	npm install -g grunt-cli
	npm install
	grunt create

	#do a check
	#aws lambda list-functions --query 'Functions[?FunctionName.contains(@, `DragonPulse`)]'
	
	#reset the path
	cd $BASE_DRAGONBOARD_DIR/$ARROW_DIR/$DRAGONCONNECT

	echo -e "***Configuring Amazon API gateway..."
	#get the extension
	#aws iam list-roles --query 'Roles[?RoleName.contains(@, `DragonPulse-ApiGateway`)].RoleName' --output text
	#api configuration
	cd api
	#sed -e 's/${region}/AWS_REGION/g' -e 's/${accountNumber}/AWS_ACCOUNT/g' -e 's/${ext}/AWS_API_EXT/g' dragonpulse-template.yaml > dragonpulse.yaml
	#java -jar lib/aws-apigateway-importer.jar --create --deploy AWS_API_STAGE dragonpulse.yaml

	#do a check
	#aws apigateway get-stage --rest-api-id $(aws apigateway get-rest-apis --query 'items[?name.contains(@, `DragonPulse`)].id' --output text) --stage-name dev

	#reset the path
	cd $BASE_DRAGONBOARD_DIR/$ARROW_DIR/$DRAGONCONNECT

	echo -e "***Configuring Dashboard on S3..."
	#get the api identifier
	#aws apigateway get-rest-apis --query 'items[?name.contains(@, `DragonPulse`)].id' --output text
	#sed ui/content/js/config.js
	#aws s3 mb s3://dragonpulse-AWS_S3_IDENT
	cd ui/content
	#aws s3 cp --recursive . s3://dragonpulse-AWS_S3_IDENT

	#reset the path
	cd $BASE_DRAGONBOARD_DIR/$ARROW_DIR/$DRAGONCONNECT
	cd ui/policy
	#aws s3api put-bucket-policy --bucket dragonpulse-$AWS_S3_IDENT --policy file://bucket-policy.json
	#aws s3 website s3://dragonpulse-$AWS_S3_IDENT --index-document index.html

	#reset the path
	cd $BASE_DRAGONBOARD_DIR/$ARROW_DIR/$DRAGONCONNECT

	echo -e "***Provisioning a Thing..."
	cd admin
	THING_ID=$(cat /etc/machine-id)
	export THING_ID=$THING_ID
	node lib/things.js create $THING_ID

	#reset the path
	cd $BASE_DRAGONBOARD_DIR/$ARROW_DIR/$DRAGONCONNECT

	echo -e "***Installing Certificates for the Device..."
	cd DragonBoard/certs
	cp $BASE_DRAGONBOARD_DIR/$DEFAULT_REGISTRY_DIR/$THING_ID/aws.{key,crt} .

	echo -e "***Access your DragonConnect dashboard here:"
	http://dragonconnect-${identifier}.s3-website-${region}.amazonaws.com

else
  echo "Please make sure the directory '$BASE_DRAGONBOARD_DIR/$ARROW_DIR/$DRAGONCONNECT' is accesible"
fi