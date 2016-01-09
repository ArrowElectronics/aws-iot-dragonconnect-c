---
layout: topic
---

# Overview
The DragonConnect API is defined using
<a href="http://swagger.io" target="_blank">Swagger</a> and configured and
deployed using the
<a href="https://github.com/awslabs/aws-apigateway-importer"
target="_blank">Amazon API Gateway Importer</a>.

# Create

The Amazon API Gateway Importer is a Java application.  If you would like to
download and compile the application you will need a
<a href="http://www.oracle.com/technetwork/java/javase/downloads/index.html?ssSourceSiteId=ocomen"
target="_blank">Java 8 SDK</a> and
<a href="http://maven.apache.org" target="_blank">Apache Maven</a>.  As a
convenience, we have included a recent compiled version in the lib directory.

The configuration of the API requires the account number, deployment region,
and extension used to create a unique IAM role.  In order to find the
extension, use the following command (remember to use a backtick (`)
surrounding the DragonConnect-ApiGateway string)

```sh
$ aws iam list-roles \
--query 'Roles[?RoleName.contains(@, `DragonConnect-ApiGateway`)].RoleName' \
--output text
DragonConnect-ApiGateway-59f4
```

With this information, edit the template api/dragonconnect-template.yaml,
and replace the account number, deployment region, and extension.  If
available, you may also choose to use an operating system command such as sed

```sh
$ cd api
$ sed -e 's/${region}/us-east-1/g' \
-e 's/${accountNumber}/012345678901/g' \
-e 's/${ext}/59f4/g' dragonconnect-template.yaml > dragonconnect.yaml
```

The _API Gateway_ may now be used to create the API and deploy it to a stage.
The following command deploys the API to the dev stage.  Remember the stage
name you choose, as it will be needed when configuring the dashboard.

```sh
$ java -jar lib/aws-apigateway-importer.jar --create \
--deploy dev dragonconnect.yaml
```

The following command will validate that the API has been configured and
deployed to the dev stage (the value of the --deploy parameter used in
the previous command)

```sh
$ aws apigateway get-stage --rest-api-id \
$(aws apigateway get-rest-apis \
--query 'items[?name.contains(@, `DragonConnect`)].id' --output text) \
--stage-name dev 
```

The stageName attribute of the result from the above command
should match "dev".

# Delete

The API Gateway configuration may be deleted through the AWS console or by
using the command

```sh
$ aws apigateway delete-rest-api --rest-api-id $(aws apigateway get-rest-apis \
--query 'items[?name.contains(@, `DragonConnect`)].id' --output text)
```
