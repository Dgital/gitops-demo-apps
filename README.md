# GitOps Demo: application repository

This repository contains source code for our [GitOps - A Practical Implementation](https://dgital.com/blog/2025/06/17/gitops-practical-implementation) case study.


The project is created to demonstrate GitOps in AWS with Microservices. It contains three example Node.JS application and an Envoy proxy with a Flagger Canary. The Kubernetes manifests for the application are generated with the *devops-cli* tool, which is mainly run by Github Actions. Please note, that we assume that you already have an EKS cluster installed with FluxCD.

## Prerequisites

-   Node.js (version: see: package.json/engines.node)
-   Install Docker
-   Granted
-   PNPM (version: see: package.json/packageManager)
-   AWS SAM CLI 1.70.0+
-   Enable long paths:

```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
-Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

## Granted

If you wish to use multiple AWS account during local development *Granted* could be useful.

-   Install Granted
    -   For Windows download https://docs.commonfate.io/granted/getting-started/#installing-the-cli -> Unzip and set PATH
    -   Install Firefox if not installed
    -   run granted and configure
        -   Use Firefox as default Granted browser: yes
        -   Use your default browser for SSO signin
    -   Unblock assume.ps1 (right click on file -> properties -> unblock)
-   Set Current AWS profile: `assume <profile>`
-   Show current user: `aws sts get-caller-identity`
-   Open management console: `assume <profile> -c`
-   Open a service: `assume <profile> -s <servicename>`, e.g: assume jsdev -s s3 (list of services: https://github.com/common-fate/granted/blob/main/pkg/console/service_map.go)

## AWS CLI

-   Install: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
-   Examples:
    -   list s3 buckets: `aws s3 ls`
    -   docker exec into an ECS container: `aws ecs execute-command --cluster <clustername> --task <taskid> --container <container> --interactive --command "/bin/sh"`
    -   telnet from inside an ECS container: `apt update && apt install telnet`


## Using Kubernetes

-   Install kubectl: `choco install kubernetes-cli`
-   Install kubectx, if you have multiple clusters: `choco install kubens kubectx`

## PNPM

This project uses PNPM to manage dependencies.

-   Install (via corepack):
    -   `corepack enable`
    -   `corepack prepare pnpm@latest --activate`
    -   `npm install -g pnpm@latest-8`
-   Alias
    -   powershell: `Set-Alias -Name pn -Value pnpm` (put into $profile for permanent storage)

## NX

NX is used to manage this monorepo.

-   Run task: `pnpm nx run <project>:<task>` (e.g.: `pnpm nx run home:container`)
-   Reset (when NX can't detect changes properly): `pnpm nx reset`

# How To

## ASSUME Role

-   `aws sts assume-role --role-arn <ROLE_ARN> --role-session-name "RolesSessionLOCAL"`

-   copy into c:/Users/<youusername>/.aws/credentials
    aws_access_key_id=...
    aws_secret_access_key=...
    aws_session_token=...

## Configure devops-cli

The CLI can be configured via environment variables. If you want to run the tool locally, create a new `.env` file in the `apps/devops-cli` directory from the provided `.env.template` file.
