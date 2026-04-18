import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';

export interface PipelineStackProps extends cdk.StackProps {
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
  githubToken: string;
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    // S3 Bucket for hosting React app
    const websiteBucket = new s3.Bucket(this, 'TaskManagerWebsiteBucket', {
      bucketName: `task-manager-website-${this.account}-${this.region}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'TaskManagerDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // S3 Bucket for CodePipeline artifacts
    const artifactsBucket = new s3.Bucket(this, 'PipelineArtifactsBucket', {
      bucketName: `task-manager-pipeline-artifacts-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CodeBuild Project for React Build
    const buildProject = new codebuild.Project(this, 'TaskManagerBuildProject', {
      projectName: 'task-manager-build',
      source: codebuild.Source.gitHub({
        owner: props.githubOwner,
        repo: props.githubRepo,
        webhook: true,
        webhookFilters: [
          codebuild.FilterGroup.inEventOf(codebuild.EventAction.PUSH).andBranchIs(props.githubBranch),
        ],
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        environmentVariables: {
          REACT_APP_AWS_REGION: {
            value: this.region,
          },
          REACT_APP_USER_POOL_ID: {
            value: cdk.Fn.importValue('TaskManagerUserPoolId'),
          },
          REACT_APP_USER_POOL_CLIENT_ID: {
            value: cdk.Fn.importValue('TaskManagerUserPoolClientId'),
          },
          REACT_APP_API_ENDPOINT: {
            value: cdk.Fn.importValue('TaskManagerApiEndpoint'),
          },
        },
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec.yml'),
    });

    // Grant permissions to CodeBuild
    websiteBucket.grantReadWrite(buildProject);
    buildProject.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudfront:CreateInvalidation',
        ],
        resources: [distribution.distributionArn],
      })
    );

    // CodeBuild Project for Testing
    const testProject = new codebuild.Project(this, 'TaskManagerTestProject', {
      projectName: 'task-manager-test',
      source: codebuild.Source.gitHub({
        owner: props.githubOwner,
        repo: props.githubRepo,
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '18',
            },
            commands: [
              'npm ci',
            ],
          },
          pre_build: {
            commands: [
              'npm run lint',
              'npm run test:coverage',
            ],
          },
          build: {
            commands: [
              'npm run build',
            ],
          },
        },
        reports: {
          jest_reports: {
            files: [
              'coverage/lcov.info',
            ],
            'file-format': 'LCOVONLY',
          },
        },
        artifacts: {
          files: [
            '**/*',
          ],
        },
      }),
    });

    // CodePipeline
    const sourceOutput = new codepipeline.Artifact();
    const testOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();

    const pipeline = new codepipeline.Pipeline(this, 'TaskManagerPipeline', {
      pipelineName: 'task-manager-pipeline',
      artifactBucket: artifactsBucket,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.GitHubSourceAction({
              actionName: 'GitHub_Source',
              owner: props.githubOwner,
              repo: props.githubRepo,
              branch: props.githubBranch,
              oauthToken: cdk.SecretValue.unsafePlainText(props.githubToken),
              output: sourceOutput,
            }),
          ],
        },
        {
          stageName: 'Test',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Test',
              project: testProject,
              input: sourceOutput,
              outputs: [testOutput],
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Build',
              project: buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
            }),
          ],
        },
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.S3DeployAction({
              actionName: 'S3Deploy',
              bucket: websiteBucket,
              input: buildOutput,
            }),
          ],
        },
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'WebsiteBucketName', {
      value: websiteBucket.bucketName,
      exportName: 'TaskManagerWebsiteBucket',
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      exportName: 'TaskManagerDistributionId',
    });

    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: distribution.distributionDomainName,
      exportName: 'TaskManagerDistributionDomain',
    });

    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
      exportName: 'TaskManagerPipelineName',
    });
  }
}