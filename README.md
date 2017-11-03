# Icarus

Serverless project for monitoring various repositories and productivity tools

## Prerequisites

Node:

```bash
brew install node
```

NPM modules

```bash
npm install serverless -g
npm install
```

## Domain setup

This application uses custom DNS names for lambdas.

The base domain must be hosted by Route53.

The domain name to use by the API is defined by the `ICARUS_API_DOMAIN` environment variable.
All Lambda stages uses the same domain.

DNS and certificate setup requires [manual setup](./custom_domain.md) to be executed, one-off, before deploying.

Frontend site use custom domains as well.
Every stage uses a separate sub-domain, following the pattern:
`icarus-<stage>.<site-base-domain>`

**TBD Frontend domain setup**

## Environment

The following environment variables are expected, to deploy the project:

* `ICARUS_API_DOMAIN`: DNS name of the domain used by API
* `ICARUS_STAGE`: Lambda stage you are deploying. **NOT required when buinding in CI**: the `build.sh` script takes care of it.
* `ICARUS_SITE_BASE_DOMAIN`: Base domain for front-end site. May be the base domain of API domain, but this is not required.
* `SLACK_TEAM_URL`: URL of Slack team

Secrets:
* `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET`: Slack integration credentials
* `DROPBOX_CLIENT_ID` and `DROPBOX_CLIENT_SECRET`: Dropbox integration credentials
* `GITHUB_WEBHOOK_SECRET`: GitHub webhook application secret
* `GITHB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`: GitHub API integration credentials
* `RDS_USER` and `RDS_PWD`: RDS master user and pwd (master username default: `master`; no default pwd!)
* `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`: AWS credentials of the user with enough power to execute the deployment.

### AWS Region

At the moment the region is hardwired to `us-east-1`, due to a limit of Amazon Certificate Manager,
used for assigning public DNS names to lambda endpoints
(see: https://github.com/amplify-education/serverless-domain-manager#user-content-known-issues)

### AWS user permission

For deployment, a user with total admin powers works for sure. 
It is possible to set up a user with less, but still great power.. and great responsibility ;)

**TBD Document required permissions**

## Dev deployment

### Lambdas

To deploy `dev` stage backend run:

```
sls deploy -v
```

When working more than one developer at a time is extermely useful to have a separate dev deployment per-developer.
This includes separate endpoints, separate DynamoDB tables and separate CloudFormation stacks.

Set the environment variable `ICARUS_STAGE` to the stage.

**Attention: specifying the stage with `--stage ...` would work for the backend but not for the frontend.**

You may define a different `stage` per developer, named like `<developer name>dev`. 
The developer name must contains only letters (A-Za-z) and no hyphen is allowed between the name and the suffix.


**DO NOT USE** `deploy.sh` during development: it only deploys the `master` branch to `test` stage. 


#### DynamoDB and RDS deletion

By default, `sls remove` does not delete DynamoDB tables and RDS instances.

To force deletion of DynamoDB tables and RDS instances, add the `--dbDeletion Delete` option when running `sls deploy`.

Note that the Deletion Policy is defined when you create the Stack and used when you remove it.

### Frontend

Frontend build expects the `ICARUS_STAGE` environment variable to decise which lambda stage to use (no `--stage` command line parameter) there.
The default lambda stage is `dev`.

Frontend is a separate Node project in the `./client` subdirectory.

#### Localhost development

- (from `./client` subdir): `npm run dev`

Runs a Node instance on localhost serving the application and reloading dynamically.

Localhost frontend still uses deployed Lambdas, so don't forget specifying `ICARUS_STAGE` (or using the default `dev` stage).

#### Deployment

1. Build the application: (from `./client`) `npm run build`
2. Deploy on S3: (from main directory) `sls client deploy`

Note that the build runs from the client subdir, while the deploy runs from the main subdir!

#### Database retention

By default, databases (DynamoDB tables and Aurora instances) are deployed with a `'Delete'` *DeletionPolicy*.
It means they will be deleted when you remove the stack, losing all data.

You may optionally specify `--dbDeletion Retain` when **deploying** the stack to prevent deletion on terminartion.

Note that the *DeletionPolicy* has to be specified when the infrastructure is created, to make it work when you will later delete it.

**TODO Set CloudFront distribution and Route53 alias**

### Cleanup

#### Frontend stage cleanup

`sls client remove --stage <stage>` takes down the S3 bucket containing the frontend

**TBD Remove CloudFront distribution**

#### Backend stage cleanup

`sls remove -v --stage <stage>` removes lambdas, DynamoDB tables and RDS Cluster

**There is a known issue blocking complete removal**. If removal fails, delete DynamoDB tables and RDS Cluster from AWS Console, then re-run the remove script.

#### Custom API Gateway domaim removal

`sls delete_domain` removes the custom domain used by all stages.

Execute this command only after deleting all stages.


## CI/CD

Set all required env variables in Travis project settings, including AWS credentials.

Travis uses `deploy.sh` script, and only deploys `master` branch to `test` stage.


## Public URLs

* Frontend: `https://icarus-<stage>.<site-base-domain>`
* Lambda service base URI: `https://<icarus-api-domain>/<stage>/`

## More documentation

* [Custom DNS domain](./docs/custom_domain.md)

* [Slack integration](./docs/slack_integration.md)
* [GitHub integration](./docs/github_integration.md)
* [Dropbox integration](./docs/dropbox_integration.md)


* [Login & authorisation journeys](./docs/login_journeys.md)
* [DynamoDB and RDS tables](./docs/tables.md)


## Known Issues/Limitations

* SSL Certificate generation and import in ACM, DNS base domain setup are all manual.
* API Gateway Custom Domains are only available in `us-east-1` Region (10/2017) so we must use that Region.
    * There is some issue deploying RDS Aurora on `us-east-1a` and `-1b`. I can't find any documentation, but other people had the same issue. CF complaining about "Your subnet group doesn't have enough availability zones..." when using `us-east-1a` and `-1b`, while it works on `-1c` and `-1d`. For example, see [this answer](https://stackoverflow.com/questions/44924723/creation-rds-aurora-cluster-via-cloudformation#answer-45340611)

