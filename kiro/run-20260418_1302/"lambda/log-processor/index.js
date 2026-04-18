const AWS = require('aws-sdk');
const cloudWatchLogs = new AWS.CloudWatchLogs();
const cloudWatch = new AWS.CloudWatch();

exports.handler = async (event) => {
  console.log('Processing log event:', JSON.stringify(event, null, 2));

  try {
    // Process logs from API Gateway
    if (event.source === 'aws.apigateway') {
      await processApiGatewayLogs(event);
    }

    // Process application logs
    if (event.Records) {
      for (const record of event.Records) {
        if (record.eventSource === 'aws:s3') {
          await processS3LogFile(record);
        }
      }
    }

    // Process direct log entries
    if (event.logEvents) {
      await processLogEvents(event.logEvents);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Logs processed successfully' })
    };
  } catch (error) {
    console.error('Error processing logs:', error);
    
    // Send error metric to CloudWatch
    await sendMetric('LogProcessingErrors', 1, 'Count');
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process logs' })
    };
  }
};

async function processApiGatewayLogs(event) {
  const logGroupName = '/aws/apigateway/task-manager-api';
  
  // Extract metrics from API Gateway logs
  const metrics = extractApiMetrics(event);
  
  // Send custom metrics to CloudWatch
  for (const metric of metrics) {
    await sendMetric(metric.name, metric.value, metric.unit, metric.dimensions);
  }
}

async function processLogEvents(logEvents) {
  for (const logEvent of logEvents) {
    try {
      const logData = JSON.parse(logEvent.message);
      
      // Process different log levels
      switch (logData.level) {
        case 'ERROR':
          await processErrorLog(logData);
          break;
        case 'WARN':
          await processWarningLog(logData);
          break;
        case 'INFO':
          await processInfoLog(logData);
          break;
      }
    } catch (parseError) {
      console.warn('Failed to parse log event:', parseError);
    }
  }
}

async function processErrorLog(logData) {
  // Send error count metric
  await sendMetric('ApplicationErrors', 1, 'Count', {
    Context: logData.context || 'Unknown',
    UserId: logData.userId || 'Anonymous'
  });

  // If it's a critical error, send to SNS for immediate alerting
  if (logData.metadata && logData.metadata.critical) {
    await sendAlert('Critical Error Detected', logData);
  }
}

async function processWarningLog(logData) {
  await sendMetric('ApplicationWarnings', 1, 'Count', {
    Context: logData.context || 'Unknown'
  });
}

async function processInfoLog(logData) {
  // Process business metrics
  if (logData.message === 'Task created') {
    await sendMetric('TasksCreated', 1, 'Count');
  }
  
  if (logData.message === 'User login successful') {
    await sendMetric('UserLogins', 1, 'Count');
  }
}

async function sendMetric(metricName, value, unit, dimensions = {}) {
  const params = {
    Namespace: 'TaskManager/Application',
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: unit,
      Timestamp: new Date(),
      Dimensions: Object.entries(dimensions).map(([Name, Value]) => ({
        Name,
        Value: String(Value)
      }))
    }]
  };

  try {
    await cloudWatch.putMetricData(params).promise();
    console.log(`Metric sent: ${metricName} = ${value}`);
  } catch (error) {
    console.error('Failed to send metric:', error);
  }
}

async function sendAlert(subject, logData) {
  const sns = new AWS.SNS();
  
  const message = {
    subject,
    logData,
    timestamp: new Date().toISOString(),
    environment: process.env.ENVIRONMENT || 'production'
  };

  const params = {
    TopicArn: process.env.ALERT_TOPIC_ARN,
    Subject: subject,
    Message: JSON.stringify(message, null, 2)
  };

  try {
    await sns.publish(params).promise();
    console.log('Alert sent:', subject);
  } catch (error) {
    console.error('Failed to send alert:', error);
  }
}

function extractApiMetrics(event) {
  // Extract relevant metrics from API Gateway event
  return [
    {
      name: 'ApiRequests',
      value: 1,
      unit: 'Count',
      dimensions: {
        Method: event.httpMethod || 'Unknown',
        Resource: event.resource || 'Unknown'
      }
    }
  ];
}