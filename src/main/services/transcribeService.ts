import {
  TranscribeClient,
  ListTranscriptionJobsCommand,
  GetTranscriptionJobCommand,
  StartTranscriptionJobCommand,
  DeleteTranscriptionJobCommand,
  type LanguageCode,
  type MediaFormat,
} from '@aws-sdk/client-transcribe'

let client: TranscribeClient | null = null

export function reinitTranscribeClient(endpoint: string, region: string) {
  client = new TranscribeClient({
    endpoint,
    region,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
  })
}

function getClient(): TranscribeClient {
  if (!client) throw new Error('TranscribeClient not initialized')
  return client
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TranscribeJob {
  jobName: string
  jobStatus: string
  languageCode?: string
  mediaFormat?: string
  mediaUri?: string
  transcriptUri?: string
  creationTime?: string
  startTime?: string
  completionTime?: string
  failureReason?: string
}

// ── Operations ────────────────────────────────────────────────────────────────

export async function listTranscriptionJobs(statusFilter?: string): Promise<TranscribeJob[]> {
  const c = getClient()
  const params: any = {}
  if (statusFilter) params.Status = statusFilter
  const res = await c.send(new ListTranscriptionJobsCommand(params))
  return (res.TranscriptionJobSummaries || []).map(j => ({
    jobName: j.TranscriptionJobName || '',
    jobStatus: j.TranscriptionJobStatus || '',
    languageCode: j.LanguageCode,
    mediaFormat: j.MediaFormat,
    creationTime: j.CreationTime?.toISOString(),
    startTime: j.StartTime?.toISOString(),
    completionTime: j.CompletionTime?.toISOString(),
    failureReason: j.FailureReason,
  }))
}

export async function getTranscriptionJob(jobName: string): Promise<TranscribeJob> {
  const c = getClient()
  const res = await c.send(new GetTranscriptionJobCommand({ TranscriptionJobName: jobName }))
  const j = res.TranscriptionJob!
  return {
    jobName: j.TranscriptionJobName || '',
    jobStatus: j.TranscriptionJobStatus || '',
    languageCode: j.LanguageCode,
    mediaFormat: j.MediaFormat,
    mediaUri: j.Media?.MediaFileUri,
    transcriptUri: j.Transcript?.TranscriptFileUri,
    creationTime: j.CreationTime?.toISOString(),
    startTime: j.StartTime?.toISOString(),
    completionTime: j.CompletionTime?.toISOString(),
    failureReason: j.FailureReason,
  }
}

export async function startTranscriptionJob(params: {
  jobName: string
  languageCode: string
  mediaUri: string
  mediaFormat?: string
  outputBucketName?: string
}): Promise<TranscribeJob> {
  const c = getClient()
  const input: any = {
    TranscriptionJobName: params.jobName,
    LanguageCode: params.languageCode as LanguageCode,
    Media: { MediaFileUri: params.mediaUri },
  }
  if (params.mediaFormat) input.MediaFormat = params.mediaFormat as MediaFormat
  if (params.outputBucketName) input.OutputBucketName = params.outputBucketName
  const res = await c.send(new StartTranscriptionJobCommand(input))
  const j = res.TranscriptionJob!
  return {
    jobName: j.TranscriptionJobName || '',
    jobStatus: j.TranscriptionJobStatus || '',
    languageCode: j.LanguageCode,
    mediaFormat: j.MediaFormat,
    mediaUri: j.Media?.MediaFileUri,
    creationTime: j.CreationTime?.toISOString(),
  }
}

export async function deleteTranscriptionJob(jobName: string): Promise<void> {
  const c = getClient()
  await c.send(new DeleteTranscriptionJobCommand({ TranscriptionJobName: jobName }))
}
