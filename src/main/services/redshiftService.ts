import { RedshiftClient, DescribeClustersCommand, CreateClusterCommand, DeleteClusterCommand } from "@aws-sdk/client-redshift";

let redshiftClient: RedshiftClient | null = null;
let currentEndpoint: string = "";
let currentRegion: string = "";

export const reinitRedshift = (endpoint: string, region: string) => {
  currentEndpoint = endpoint.replace(/\/$/, "");
  currentRegion = region || "us-east-1";
  
  redshiftClient = new RedshiftClient({
    endpoint: currentEndpoint,
    region: currentRegion,
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
    disableHostPrefix: true, // Crucial for LocalStack Redshift
  });
};

const getClient = (): RedshiftClient => {
  if (!redshiftClient) {
    // Fallback init if needed
    reinitRedshift("http://localhost:4566", "us-east-1");
  }
  return redshiftClient!;
};

export const redshiftListClusters = async () => {
  const client = getClient();
  try {
    // DescribeClusters without identifier returns all clusters
    const command = new DescribeClustersCommand({});
    const response = await client.send(command);
    return { success: true, data: response.Clusters || [] };
  } catch (error: any) {
    console.error("Redshift ListClusters Error:", error);
    return { success: false, error: error.message };
  }
};

export const redshiftDescribeCluster = async (clusterId: string) => {
  const client = getClient();
  try {
    const command = new DescribeClustersCommand({ ClusterIdentifier: clusterId });
    const response = await client.send(command);
    return { success: true, data: response.Clusters?.[0] };
  } catch (error: any) {
    console.error("Redshift DescribeCluster Error:", error);
    return { success: false, error: error.message };
  }
};

export const redshiftCreateCluster = async (params: any) => {
  const client = getClient();
  try {
    const command = new CreateClusterCommand(params);
    const response = await client.send(command);
    return { success: true, data: response.Cluster };
  } catch (error: any) {
    console.error("Redshift CreateCluster Error:", error);
    return { success: false, error: error.message };
  }
};

export const redshiftDeleteCluster = async (clusterId: string) => {
  const client = getClient();
  try {
    const command = new DeleteClusterCommand({ ClusterIdentifier: clusterId, SkipFinalClusterSnapshot: true });
    const response = await client.send(command);
    return { success: true, data: response.Cluster };
  } catch (error: any) {
    console.error("Redshift DeleteCluster Error:", error);
    return { success: false, error: error.message };
  }
};
