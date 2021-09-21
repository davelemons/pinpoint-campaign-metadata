const AWS = require('aws-sdk');
const pinpoint = new AWS.Pinpoint();
const docClient = new AWS.DynamoDB.DocumentClient();

const getCampaigns = async () => {
    let result, NextToken;
    let accumulated = [];
  
    do {
      result = await pinpoint.getCampaigns({
        ApplicationId: process.env.PINPOINT_APPID, 
        PageSize: '100',
        Token: NextToken
      }).promise();
  
      NextToken = result.CampaignsResponse.NextToken;
      accumulated = [...accumulated, ...result.CampaignsResponse.Item];
    } while (result.CampaignsResponse.NextToken);
  
    return {Items: accumulated};
};

const getJourneys = async () => {
    let result, NextToken;
    let accumulated = [];
  
    do {
      result = await pinpoint.listJourneys({
        ApplicationId: process.env.PINPOINT_APPID, 
        PageSize: '100',
        Token: NextToken
      }).promise();
  
      NextToken = result.JourneysResponse.NextToken;
      accumulated = [...accumulated, ...result.JourneysResponse.Item];
    } while (result.JourneysResponse.NextToken);
  
    return {Items: accumulated};
};


exports.handler = async (event, context) => {
    // All log statements are written to CloudWatch by default. For more information, see
    // https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-logging.html
    console.info(JSON.stringify(event));
    
    await getCampaigns().then(function(campaigns) {
        //console.log(campaigns.Items);
        for (let index = 0; index < campaigns.Items.length; index++) {
            const campaign = campaigns.Items[index];
            console.log('campaign: ', campaign.Id, campaign.Name)
            var params = {
                TableName:process.env.CAMPAIGN_TABLE, 
                Item:campaign
            };

            docClient.put(params).promise()  
            .catch(function(err) {
                console.log(err);
            });
        }
    }).catch(function(e) {
        console.log('Could not load campaigns: ' + e);
    });

    await getJourneys().then(function(journeys) {
        //console.log(campaigns.Items);
        for (let index = 0; index < journeys.Items.length; index++) {
            const journey = journeys.Items[index];
            console.log('journey: ', journey.Id, journey.Name)
            var params = {
                TableName:process.env.JOURNEY_TABLE,
                Item:journey
            };

            docClient.put(params).promise()  
            .catch(function(err) {
                console.log(err);
            });
        }
    }).catch(function(e) {
        console.log('Could not load journeys: ' + e);
    });
}
