import 'dotenv/config';

export interface Config {
    clusterName: string;
    envName: string;
    region: string;
    accountId: string;
    entryEnvoyImage: string;
    manifestRepoUrl: string;
    canaryProfile: string;
    githubRepositoryOwner: string;
}

const manifestRepoToken = process.env.MANIFEST_REPO_ACCESS_TOKEN;
// If the token is not provided, use the SSH URL
export const manifestRepoUrl = manifestRepoToken
    ? `https://${manifestRepoToken}@github.com/${process.env.MANIFEST_REPO}.git`
    : `git@github.com:${process.env.MANIFEST_REPO}.git`;

export const config: Config = {
    clusterName: process.env.CLUSTER_NAME,
    envName: process.env.ENV_NAME,
    region: process.env.AWS_REGION,
    accountId: process.env.AWS_ACCOUNT_ID,
    entryEnvoyImage: process.env.ENTRY_ENVOY_IMAGE,
    canaryProfile: process.env.CANARY_PROFILE,
    githubRepositoryOwner: process.env.GITHUB_REPOSITORY_OWNER,
    manifestRepoUrl,
};
