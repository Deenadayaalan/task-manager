#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { InfrastructureStack } from './infrastructure-stack';
import { PipelineStack } from './pipeline-stack';

const app = new cdk.App();

// Get configuration from context or environment
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

const githubOwner = app.node.tryGetContext('githubOwner') || process.env.GITHUB_OWNER || 'Deenadayaalan';
const githubRepo = app.node.tryGetContext('githubRepo') || process.env.GITHUB_REPO || 'task-manager';
const githubBranch = app.node.tryGetContext('githubBranch') || process.env.GITHUB_BRANCH || 'main';
const githubToken = process.env.GITHUB_TOKEN || '';

// Infrastructure Stack (Cognito, API Gateway, etc.)
const infrastructureStack = new InfrastructureStack(app, 'TaskManagerInfrastructure', {
  env,
  description: 'Task Manager Infrastructure Stack',
});

// Pipeline Stack (CI/CD)
const pipelineStack = new PipelineStack(app, 'TaskManagerPipeline', {
  env,
  githubOwner,
  githubRepo,
  githubBranch,
  githubToken,
  description: 'Task Manager CI/CD Pipeline Stack',
});

// Pipeline depends on infrastructure
pipelineStack.addDependency(infrastructureStack);

// Tags
cdk.Tags.of(app).add('Project', 'TaskManager');
cdk.Tags.of(app).add('Environment', 'Production');
cdk.Tags.of(app).add('Owner', 'DevOps');