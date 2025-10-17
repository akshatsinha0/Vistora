#!/usr/bin/env python3
"""Create CloudWatch Logs Insights saved queries"""

import boto3

logs = boto3.client('logs', region_name='us-east-1')

queries = [
    {
        "name": "Error Analysis",
        "queryString": """fields @timestamp, level, message, error, userId, path
| filter level = "error"
| sort @timestamp desc
| limit 100""",
        "logGroupNames": ["/ecs/production/backend"]
    },
    {
        "name": "Slow Requests",
        "queryString": """fields @timestamp, method, path, duration, userId, statusCode
| filter duration > 2000
| sort duration desc
| limit 50""",
        "logGroupNames": ["/ecs/production/backend"]
    },
    {
        "name": "User Activity Tracking",
        "queryString": """fields @timestamp, userId, action, method, path, statusCode
| filter action in ["login", "register", "task:created", "task:updated", "task:deleted"]
| sort @timestamp desc
| limit 100""",
        "logGroupNames": ["/ecs/production/backend"]
    }
]

print("Creating CloudWatch Logs Insights saved queries...")

for query in queries:
    try:
        response = logs.put_query_definition(
            name=query["name"],
            queryString=query["queryString"],
            logGroupNames=query["logGroupNames"]
        )
        print(f"✅ Created query: {query['name']}")
    except Exception as e:
        print(f"❌ Failed to create query {query['name']}: {e}")

print("\n✅ All queries created successfully!")
print("View at: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:logs-insights")
