#!/usr/bin/env python3
"""Run database migrations on AWS ECS"""

import boto3
import json
import time
import sys

# Initialize AWS clients
ecs = boto3.client('ecs', region_name='us-east-1')
cfn = boto3.client('cloudformation', region_name='us-east-1')

def get_stack_output(stack_name, output_key):
    """Get output value from CloudFormation stack"""
    response = cfn.describe_stacks(StackName=stack_name)
    outputs = response['Stacks'][0]['Outputs']
    for output in outputs:
        if output['OutputKey'] == output_key:
            return output['OutputValue']
    return None

def get_nested_stack_output(parent_stack, logical_id, output_key):
    """Get output from nested stack"""
    response = cfn.describe_stack_resources(
        StackName=parent_stack,
        LogicalResourceId=logical_id
    )
    nested_stack_id = response['StackResources'][0]['PhysicalResourceId']
    return get_stack_output(nested_stack_id, output_key)

print("\n" + "="*50)
print("Running Database Migrations")
print("="*50 + "\n")

# Get infrastructure details
print("Getting infrastructure details...")
db_endpoint = get_stack_output('vistora-main-stack', 'DBEndpoint')
print(f"DB Endpoint: {db_endpoint}")

# Get network details from nested stack
private_subnet1 = get_nested_stack_output('vistora-main-stack', 'NetworkStack', 'PrivateSubnet1Id')
private_subnet2 = get_nested_stack_output('vistora-main-stack', 'NetworkStack', 'PrivateSubnet2Id')
print(f"Subnets: {private_subnet1}, {private_subnet2}")

# Get security group from nested stack
ecs_sg = get_nested_stack_output('vistora-main-stack', 'SecurityStack', 'ECSSecurityGroupId')
print(f"Security Group: {ecs_sg}")

# Create task definition
print("\nCreating migration task definition...")
task_def = {
    "family": "vistora-migration",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "256",
    "memory": "512",
    "executionRoleArn": "arn:aws:iam::781177225477:role/production-ecs-task-execution-role",
    "containerDefinitions": [
        {
            "name": "migration",
            "image": "781177225477.dkr.ecr.us-east-1.amazonaws.com/vistora-backend:f4a03db",
            "essential": True,
            "command": ["npm", "run", "migrate"],
            "environment": [
                {"name": "NODE_ENV", "value": "production"},
                {"name": "DATABASE_URL", "value": f"postgresql://vistora_admin:ViStoraDB2025SecurePass!@{db_endpoint}:5432/vistora"}
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/production/backend",
                    "awslogs-region": "us-east-1",
                    "awslogs-stream-prefix": "migration"
                }
            }
        }
    ]
}

response = ecs.register_task_definition(**task_def)
task_def_arn = response['taskDefinition']['taskDefinitionArn']
print(f"Task Definition: {task_def_arn}")

# Run migration task
print("\nRunning migration task...")
response = ecs.run_task(
    cluster='production-cluster',
    taskDefinition='vistora-migration',
    launchType='FARGATE',
    networkConfiguration={
        'awsvpcConfiguration': {
            'subnets': [private_subnet1, private_subnet2],
            'securityGroups': [ecs_sg],
            'assignPublicIp': 'DISABLED'
        }
    }
)

if response['failures']:
    print(f"Failed to start task: {response['failures']}")
    sys.exit(1)

task_arn = response['tasks'][0]['taskArn']
print(f"Migration task started: {task_arn}")

# Wait for task to complete
print("\nWaiting for task to complete...")
for i in range(12):  # Wait up to 2 minutes
    time.sleep(10)
    response = ecs.describe_tasks(cluster='production-cluster', tasks=[task_arn])
    status = response['tasks'][0]['lastStatus']
    print(f"Task Status: {status}")
    
    if status == 'STOPPED':
        exit_code = response['tasks'][0]['containers'][0].get('exitCode', -1)
        if exit_code == 0:
            print("\n✅ Migrations completed successfully!")
        else:
            print(f"\n❌ Migrations failed with exit code: {exit_code}")
            print("Check CloudWatch logs for details: /ecs/production/backend")
        break
else:
    print("\n⏱️  Task still running. Check CloudWatch logs for progress.")

print("\n" + "="*50)
print("Migration task completed!")
print("="*50 + "\n")
