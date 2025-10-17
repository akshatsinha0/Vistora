#!/usr/bin/env python3
"""Create CloudWatch Dashboard for Vistora application"""

import boto3
import json

cloudwatch = boto3.client('cloudwatch', region_name='us-east-1')

dashboard_body = {
    "widgets": [
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    ["AWS/ApplicationELB", "RequestCount", {"stat": "Sum", "label": "Total Requests"}],
                    [".", "HTTPCode_Target_4XX_Count", {"stat": "Sum", "label": "4XX Errors"}],
                    [".", "HTTPCode_Target_5XX_Count", {"stat": "Sum", "label": "5XX Errors"}]
                ],
                "view": "timeSeries",
                "stacked": False,
                "region": "us-east-1",
                "title": "Request Rate and Error Rate",
                "period": 300
            }
        },
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    ["AWS/ApplicationELB", "TargetResponseTime", {"stat": "p50", "label": "p50"}],
                    ["...", {"stat": "p90", "label": "p90"}],
                    ["...", {"stat": "p99", "label": "p99"}]
                ],
                "view": "timeSeries",
                "stacked": False,
                "region": "us-east-1",
                "title": "Response Time Percentiles",
                "period": 300,
                "yAxis": {"left": {"label": "Seconds"}}
            }
        },
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    ["AWS/ECS", "CPUUtilization", {"stat": "Average", "label": "Backend CPU"}],
                    ["...", {"stat": "Average", "label": "Frontend CPU"}]
                ],
                "view": "timeSeries",
                "stacked": False,
                "region": "us-east-1",
                "title": "ECS CPU Utilization",
                "period": 300,
                "yAxis": {"left": {"label": "Percent", "max": 100}}
            }
        },
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    ["AWS/ECS", "MemoryUtilization", {"stat": "Average", "label": "Backend Memory"}],
                    ["...", {"stat": "Average", "label": "Frontend Memory"}]
                ],
                "view": "timeSeries",
                "stacked": False,
                "region": "us-east-1",
                "title": "ECS Memory Utilization",
                "period": 300,
                "yAxis": {"left": {"label": "Percent", "max": 100}}
            }
        },
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    ["AWS/ApplicationELB", "HealthyHostCount", {"stat": "Average", "label": "Healthy Targets"}],
                    [".", "UnHealthyHostCount", {"stat": "Average", "label": "Unhealthy Targets"}]
                ],
                "view": "timeSeries",
                "stacked": False,
                "region": "us-east-1",
                "title": "ALB Target Health",
                "period": 60
            }
        },
        {
            "type": "log",
            "properties": {
                "query": "SOURCE '/ecs/production/backend'\n| fields @timestamp, @message\n| filter level = 'error'\n| sort @timestamp desc\n| limit 20",
                "region": "us-east-1",
                "stacked": False,
                "title": "Recent Errors",
                "view": "table"
            }
        }
    ]
}

print("Creating CloudWatch Dashboard...")
response = cloudwatch.put_dashboard(
    DashboardName='Vistora-Production',
    DashboardBody=json.dumps(dashboard_body)
)

print(f"✅ Dashboard created successfully!")
print(f"View at: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=Vistora-Production")
