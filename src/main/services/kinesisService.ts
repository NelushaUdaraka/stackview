import { 
  KinesisClient, 
  ListStreamsCommand, 
  DescribeStreamCommand, 
  CreateStreamCommand, 
  DeleteStreamCommand,
  PutRecordCommand,
  GetRecordsCommand,
  GetShardIteratorCommand,
  ListShardsCommand
} from "@aws-sdk/client-kinesis";

let kinesisClient: KinesisClient | null = null;

function getClient(endpoint: string, region: string) {
  if (!kinesisClient) {
    kinesisClient = new KinesisClient({
      endpoint,
      region,
      credentials: { accessKeyId: "test", secretAccessKey: "test" },
      tls: false,
    });
  }
  return kinesisClient;
}

export const kinesisReinit = (endpoint: string, region: string) => {
  kinesisClient = new KinesisClient({
    endpoint,
    region,
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
    tls: false,
  });
};

export const kinesisListStreams = async (endpoint: string, region: string) => {
  try {
    const client = getClient(endpoint, region);
    const command = new ListStreamsCommand({});
    const data = await client.send(command);
    return { success: true, data: data.StreamNames || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const kinesisDescribeStream = async (endpoint: string, region: string, streamName: string) => {
  try {
    const client = getClient(endpoint, region);
    const command = new DescribeStreamCommand({ StreamName: streamName });
    const data = await client.send(command);
    
    if (data.StreamDescription) {
      try {
        const shardsCommand = new ListShardsCommand({ StreamName: streamName });
        const shardsData = await client.send(shardsCommand);
        data.StreamDescription.Shards = shardsData.Shards as any;
      } catch (shardError) {
        console.error("Failed to list shards:", shardError);
      }
    }
    
    return { success: true, data: data.StreamDescription };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const kinesisCreateStream = async (endpoint: string, region: string, params: any) => {
  try {
    const client = getClient(endpoint, region);
    const createParams: any = {
      StreamName: params.StreamName,
    };

    if (params.StreamModeDetails?.StreamMode === 'ON_DEMAND') {
      createParams.StreamModeDetails = {
        StreamMode: 'ON_DEMAND'
      };
    } else {
      createParams.ShardCount = params.ShardCount || 1;
      createParams.StreamModeDetails = {
        StreamMode: 'PROVISIONED'
      };
    }

    const command = new CreateStreamCommand(createParams);
    await client.send(command);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const kinesisDeleteStream = async (endpoint: string, region: string, streamName: string) => {
  try {
    const client = getClient(endpoint, region);
    const command = new DeleteStreamCommand({ StreamName: streamName });
    await client.send(command);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
