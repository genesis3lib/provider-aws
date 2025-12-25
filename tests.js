/**
 * Genesis3 Module Test Configuration - AWS Provider
 *
 * Tests for AWS infrastructure provider including Terraform templates,
 * security configurations, and CI/CD workflows.
 */

module.exports = {
  moduleId: 'provider-aws',
  moduleName: 'AWS Infrastructure',

  scenarios: [
    {
      name: 'aws-basic',
      description: 'Basic AWS infrastructure with S3 and RDS',
      config: {
        moduleId: 'aws-infra',
        kind: 'extension',
        type: 'aws',
        layers: ['ops'],
        enabled: true,
        fieldValues: {
          awsRegion: 'us-east-1',
          enableS3: true,
          enableRDS: true,
          enableElasticBeanstalk: false
        }
      },
      expectedFiles: [
        'ops/aws/s3-config.yaml',
        'ops/aws/rds-config.yaml'
      ]
    },
    {
      name: 'aws-full-stack',
      description: 'Full AWS stack with S3, RDS, and Elastic Beanstalk',
      config: {
        moduleId: 'aws-full',
        kind: 'extension',
        type: 'aws',
        layers: ['ops'],
        enabled: true,
        fieldValues: {
          awsRegion: 'us-west-2',
          enableS3: true,
          enableRDS: true,
          enableElasticBeanstalk: true,
          enableCloudFront: true
        }
      },
      expectedFiles: [
        'ops/aws/s3-config.yaml',
        'ops/aws/rds-config.yaml',
        'ops/aws/elasticbeanstalk-config.yaml'
      ]
    },
    {
      name: 'aws-s3-only',
      description: 'AWS with S3 storage only',
      config: {
        moduleId: 'aws-storage',
        kind: 'extension',
        type: 'aws',
        layers: ['ops'],
        enabled: true,
        fieldValues: {
          awsRegion: 'eu-west-1',
          enableS3: true,
          enableRDS: false,
          enableElasticBeanstalk: false
        }
      },
      expectedFiles: [
        'ops/aws/s3-config.yaml'
      ],
      forbiddenFiles: [
        'ops/aws/rds-config.yaml',
        'ops/aws/elasticbeanstalk-config.yaml'
      ]
    }
  ],

  /**
   * Template validations for Terraform files
   * These validate that mustache templates contain correct security configurations
   */
  templateValidations: [
    {
      name: 'asg-health-check-elb',
      description: 'P0: ASG must use ELB health checks for proper instance health detection',
      template: 'provider-aws/terraform/compute.tf.mustache',
      contains: [
        'health_check_type         = "ELB"',
        'health_check_grace_period = 300'
      ],
      notContains: [
        'health_check_type         = "EC2"',
        'health_check_grace_period = 2592000'
      ]
    },
    {
      name: 'tls-1-3-policy',
      description: 'P0: ALB HTTPS listener must use TLS 1.3 policy for modern security',
      template: 'provider-aws/terraform/load_balancer.tf.mustache',
      contains: [
        'ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"'
      ],
      notContains: [
        'ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"',
        'ssl_policy        = "ELBSecurityPolicy-2016-08"'
      ]
    },
    {
      name: 'alb-access-logging',
      description: 'P2: ALB must have access logging enabled with S3 lifecycle',
      template: 'provider-aws/terraform/load_balancer.tf.mustache',
      contains: [
        'access_logs {',
        'enabled = true',
        'expiration {',
        'var.environment == "production" ? 90 : 30'
      ]
    },
    {
      name: 'alb-sticky-sessions',
      description: 'P2: ALB target group must have sticky sessions configured',
      template: 'provider-aws/terraform/load_balancer.tf.mustache',
      contains: [
        'stickiness {',
        'type            = "lb_cookie"',
        'cookie_duration = 86400',
        'enabled         = true'
      ]
    },
    {
      name: 'asg-instance-refresh',
      description: 'P2: ASG must have rolling instance refresh for zero-downtime deployments',
      template: 'provider-aws/terraform/compute.tf.mustache',
      contains: [
        'instance_refresh {',
        'strategy = "Rolling"',
        'min_healthy_percentage = 50',
        'instance_warmup        = 300'
      ]
    }
  ]
};
