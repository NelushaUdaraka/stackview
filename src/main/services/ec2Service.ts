import {
  EC2Client,
  DescribeInstancesCommand,
  RunInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
  RebootInstancesCommand,
  TerminateInstancesCommand,
  DescribeImagesCommand,
  DescribeKeyPairsCommand,
  CreateKeyPairCommand,
  DeleteKeyPairCommand,
  DescribeSecurityGroupsCommand,
  CreateSecurityGroupCommand,
  DeleteSecurityGroupCommand,
  AuthorizeSecurityGroupIngressCommand,
  RevokeSecurityGroupIngressCommand,
  DescribeVpcsCommand,
  CreateVpcCommand,
  DeleteVpcCommand,
  DescribeSubnetsCommand,
  DescribeVolumesCommand,
  CreateVolumeCommand,
  DeleteVolumeCommand,
  AttachVolumeCommand,
  DetachVolumeCommand,
  type Filter,
} from '@aws-sdk/client-ec2'

let client: EC2Client | null = null

export function initEC2Client(endpoint: string, region: string) {
  client = new EC2Client({
    endpoint,
    region,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
    forcePathStyle: true,
  } as any)
}

function getClient(): EC2Client {
  if (!client) throw new Error('EC2 client not initialized')
  return client
}

// --- Instances ---
export async function listInstances() {
  const res = await getClient().send(new DescribeInstancesCommand({}))
  const instances: any[] = []
  for (const reservation of res.Reservations ?? []) {
    for (const instance of reservation.Instances ?? []) {
      instances.push({
        ...instance,
        ReservationId: reservation.ReservationId,
      })
    }
  }
  // JSON round-trip converts all Date objects to ISO strings for safe IPC transfer
  return JSON.parse(JSON.stringify(instances))
}

export async function launchInstance(params: {
  imageId: string
  instanceType: string
  keyName?: string
  securityGroupIds?: string[]
  subnetId?: string
  minCount?: number
  maxCount?: number
  userData?: string
  tagName?: string
}) {
  const tags = params.tagName
    ? [{ ResourceType: 'instance', Tags: [{ Key: 'Name', Value: params.tagName }] }]
    : undefined

  const res = await getClient().send(new RunInstancesCommand({
    ImageId: params.imageId,
    InstanceType: params.instanceType as any,
    KeyName: params.keyName,
    SecurityGroupIds: params.securityGroupIds,
    SubnetId: params.subnetId,
    MinCount: params.minCount ?? 1,
    MaxCount: params.maxCount ?? 1,
    UserData: params.userData ? Buffer.from(params.userData).toString('base64') : undefined,
    TagSpecifications: tags as any,
  }))
  return res.Instances?.[0]?.InstanceId
}

export async function startInstances(instanceIds: string[]) {
  await getClient().send(new StartInstancesCommand({ InstanceIds: instanceIds }))
}

export async function stopInstances(instanceIds: string[]) {
  await getClient().send(new StopInstancesCommand({ InstanceIds: instanceIds }))
}

export async function rebootInstances(instanceIds: string[]) {
  await getClient().send(new RebootInstancesCommand({ InstanceIds: instanceIds }))
}

export async function terminateInstances(instanceIds: string[]) {
  await getClient().send(new TerminateInstancesCommand({ InstanceIds: instanceIds }))
}

// --- AMIs ---
export async function listImages(owners?: string[]) {
  const res = await getClient().send(new DescribeImagesCommand({
    Owners: owners ?? ['self', 'amazon'],
  }))
  return res.Images ?? []
}

// --- Key Pairs ---
export async function listKeyPairs() {
  const res = await getClient().send(new DescribeKeyPairsCommand({}))
  return res.KeyPairs ?? []
}

export async function createKeyPair(keyName: string) {
  const res = await getClient().send(new CreateKeyPairCommand({ KeyName: keyName }))
  return { keyPairId: res.KeyPairId, keyName: res.KeyName, keyMaterial: res.KeyMaterial }
}

export async function deleteKeyPair(keyName: string) {
  await getClient().send(new DeleteKeyPairCommand({ KeyName: keyName }))
}

// --- Security Groups ---
export async function listSecurityGroups() {
  const res = await getClient().send(new DescribeSecurityGroupsCommand({}))
  return res.SecurityGroups ?? []
}

export async function createSecurityGroup(params: { groupName: string; description: string; vpcId?: string }) {
  const res = await getClient().send(new CreateSecurityGroupCommand({
    GroupName: params.groupName,
    Description: params.description,
    VpcId: params.vpcId,
  }))
  return res.GroupId
}

export async function deleteSecurityGroup(groupId: string) {
  await getClient().send(new DeleteSecurityGroupCommand({ GroupId: groupId }))
}

export async function authorizeSecurityGroupIngress(params: {
  groupId: string
  protocol: string
  fromPort: number
  toPort: number
  cidrIp: string
}) {
  await getClient().send(new AuthorizeSecurityGroupIngressCommand({
    GroupId: params.groupId,
    IpPermissions: [{
      IpProtocol: params.protocol,
      FromPort: params.fromPort,
      ToPort: params.toPort,
      IpRanges: [{ CidrIp: params.cidrIp }],
    }],
  }))
}

export async function revokeSecurityGroupIngress(params: {
  groupId: string
  protocol: string
  fromPort: number
  toPort: number
  cidrIp: string
}) {
  await getClient().send(new RevokeSecurityGroupIngressCommand({
    GroupId: params.groupId,
    IpPermissions: [{
      IpProtocol: params.protocol,
      FromPort: params.fromPort,
      ToPort: params.toPort,
      IpRanges: [{ CidrIp: params.cidrIp }],
    }],
  }))
}

// --- VPCs ---
export async function listVpcs() {
  const res = await getClient().send(new DescribeVpcsCommand({}))
  return res.Vpcs ?? []
}

export async function createVpc(cidrBlock: string) {
  const res = await getClient().send(new CreateVpcCommand({ CidrBlock: cidrBlock }))
  return res.Vpc?.VpcId
}

export async function deleteVpc(vpcId: string) {
  await getClient().send(new DeleteVpcCommand({ VpcId: vpcId }))
}

// --- Subnets ---
export async function listSubnets(vpcId?: string) {
  const filters: Filter[] = vpcId ? [{ Name: 'vpc-id', Values: [vpcId] }] : []
  const res = await getClient().send(new DescribeSubnetsCommand({ Filters: filters }))
  return res.Subnets ?? []
}

// --- Volumes ---
export async function listVolumes() {
  const res = await getClient().send(new DescribeVolumesCommand({}))
  return res.Volumes ?? []
}

export async function createVolume(params: { availabilityZone: string; size: number; volumeType?: string }) {
  const res = await getClient().send(new CreateVolumeCommand({
    AvailabilityZone: params.availabilityZone,
    Size: params.size,
    VolumeType: (params.volumeType ?? 'gp2') as any,
  }))
  return res.VolumeId
}

export async function deleteVolume(volumeId: string) {
  await getClient().send(new DeleteVolumeCommand({ VolumeId: volumeId }))
}

export async function attachVolume(params: { volumeId: string; instanceId: string; device: string }) {
  await getClient().send(new AttachVolumeCommand({
    VolumeId: params.volumeId,
    InstanceId: params.instanceId,
    Device: params.device,
  }))
}

export async function detachVolume(volumeId: string) {
  await getClient().send(new DetachVolumeCommand({ VolumeId: volumeId }))
}
