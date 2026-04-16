import fs from 'fs'
import AdmZip from 'adm-zip'
import {
  LambdaClient,
  ListFunctionsCommand,
  GetFunctionCommand,
  CreateFunctionCommand,
  UpdateFunctionCodeCommand,
  DeleteFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda'

let client: LambdaClient

export function initLambdaClient(endpoint: string, region: string) {
  client = new LambdaClient({
    endpoint,
    region,
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    },
  })
}

export function reinitLambda(endpoint: string, region: string) {
  initLambdaClient(endpoint, region)
}

export async function listFunctions() {
  const command = new ListFunctionsCommand({})
  const response = await client.send(command)
  return response.Functions || []
}

export async function getFunction(functionName: string) {
  const command = new GetFunctionCommand({ FunctionName: functionName })
  const response = await client.send(command)
  return response.Configuration
}

export async function getFunctionCode(functionName: string) {
  const command = new GetFunctionCommand({ FunctionName: functionName })
  const response = await client.send(command)
  if (!response.Code || !response.Code.Location) {
    return { error: 'No code location found for this function.' }
  }

  try {
    const fetchRes = await fetch(response.Code.Location)
    if (!fetchRes.ok) {
      return { error: 'Failed to download deployment package from S3.' }
    }
    
    const contentLength = fetchRes.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > 3 * 1024 * 1024) {
      return { limited: true, error: 'The deployment package of your Lambda function is too large to enable inline code viewing (> 3MB).' }
    }
    
    const arrayBuffer = await fetchRes.arrayBuffer()
    if (arrayBuffer.byteLength > 3 * 1024 * 1024) {
      return { limited: true, error: 'The deployment package of your Lambda function is too large to enable inline code viewing (> 3MB).' }
    }

    const zip = new AdmZip(Buffer.from(arrayBuffer))
    const files: Array<{ path: string, content: string | null, isBinary: boolean }> = []
    
    const entries = zip.getEntries()
    for (const entry of entries) {
      if (entry.isDirectory) continue
      
      const fileName = entry.entryName
      const extMatch = fileName.match(/\.([^.]+)$/)
      const ext = extMatch ? extMatch[1].toLowerCase() : ''
      const binaryExts = ['class', 'so', 'dll', 'exe', 'bin', 'zip', 'gz', 'tar', 'jpeg', 'jpg', 'png', 'gif', 'ico']
      
      if (binaryExts.includes(ext)) {
        files.push({ path: fileName, content: null, isBinary: true })
      } else {
        const fileData = entry.getData()
        if (fileData.length > 512 * 1024) {
          files.push({ path: fileName, content: '// File too large to preview (> 512KB)', isBinary: false })
        } else {
          files.push({ path: fileName, content: fileData.toString('utf8'), isBinary: false })
        }
      }
    }
    
    return { success: true, files }
  } catch (err: any) {
    return { error: `Failed to fetch or parse code: ${err.message}` }
  }
}

export async function updateFunctionCode(functionName: string, updatedFiles: Array<{ path: string, content: string }>) {
  // First get the existing presigned URL
  const getCommand = new GetFunctionCommand({ FunctionName: functionName })
  const getResponse = await client.send(getCommand)
  
  if (!getResponse.Code || !getResponse.Code.Location) {
    return { error: 'No code location found to patch for this function.' }
  }

  try {
    const fetchRes = await fetch(getResponse.Code.Location)
    if (!fetchRes.ok) return { error: 'Failed to download original deployment package.' }
    const arrayBuffer = await fetchRes.arrayBuffer()
    const zip = new AdmZip(Buffer.from(arrayBuffer))

    // Update the files in the zip buffer
    for (const file of updatedFiles) {
      // updateFile accepts either string entryName or the ZipEntry object
      // wait, adm-zip updateFile takes (entryName, Buffer) or we can use addFile which overwrites
      const entry = zip.getEntry(file.path)
      if (entry) {
        zip.updateFile(entry, Buffer.from(file.content, 'utf8'))
      } else {
        zip.addFile(file.path, Buffer.from(file.content, 'utf8'))
      }
    }

    const newZipBuffer = zip.toBuffer()

    const updateCommand = new UpdateFunctionCodeCommand({
      FunctionName: functionName,
      ZipFile: newZipBuffer
    })

    const response = await client.send(updateCommand)
    return { success: true, ...response }
  } catch (err: any) {
    return { error: `Failed to patch and update function code: ${err.message}` }
  }
}

export async function createFunction(
  functionName: string,
  roleArn: string,
  zipFilePath: string | null,
  handler: string = 'index.handler',
  runtime: string = 'nodejs18.x',
  description?: string,
  timeout: number = 3,
  memorySize: number = 128,
  s3Config?: { bucket: string, key: string },
  envVars?: Record<string, string>,
  inlineCode?: string | null
) {
  const codeConfig: any = {}
  
  console.log(`[LAMBDA_CREATE] name: ${functionName}, inlineCodeType: ${typeof inlineCode}, zipFilePathType: ${typeof zipFilePath}, isZipTruthy: ${!!zipFilePath}, s3ConfigType: ${typeof s3Config}`);
  console.log(`[LAMBDA_CREATE] zipFilePath:`, zipFilePath, 'inlineCode:', inlineCode ? 'PRESENT' : 'NULL');

  if (inlineCode) {
    const zip = new AdmZip()
    // determine file extension from runtime (simple heuristic)
    const ext = runtime.startsWith('python') ? 'py' : runtime.startsWith('go') ? 'go' : runtime.startsWith('java') ? 'java' : 'js'
    const fileName = ext === 'java' ? 'Handler.java' : `index.${ext}`
    zip.addFile(fileName, Buffer.from(inlineCode, 'utf8'))
    codeConfig.ZipFile = zip.toBuffer()
  } else if (zipFilePath !== null && zipFilePath !== undefined && zipFilePath !== '') {
    if (typeof zipFilePath !== 'string') {
      throw new Error(`CRITICAL: zipFilePath is truthy but its type is ${typeof zipFilePath}. Value: ${JSON.stringify(zipFilePath)}`)
    }
    codeConfig.ZipFile = fs.readFileSync(zipFilePath)
  } else if (s3Config) {
    codeConfig.S3Bucket = s3Config.bucket
    codeConfig.S3Key = s3Config.key
  } else {
    throw new Error('No deployment code configuration provided (inlineCode, zipFilePath, s3Config are all missing)');
  }

  const command = new CreateFunctionCommand({
    FunctionName: functionName,
    Role: roleArn,
    Handler: handler,
    Runtime: runtime as any,
    Code: codeConfig,
    Description: description,
    Timeout: timeout,
    MemorySize: memorySize,
    ...(envVars && Object.keys(envVars).length > 0 ? { Environment: { Variables: envVars } } : {})
  })
  const response = await client.send(command)
  return response
}

export async function deleteFunction(functionName: string) {
  const command = new DeleteFunctionCommand({ FunctionName: functionName })
  await client.send(command)
}

export async function invokeFunction(functionName: string, payload: string) {
  const command = new InvokeCommand({
    FunctionName: functionName,
    Payload: Buffer.from(payload),
    LogType: 'Tail',
  })
  const response = await client.send(command)
  const resultStr = response.Payload ? Buffer.from(response.Payload).toString('utf-8') : ''
  const logStr = response.LogResult ? Buffer.from(response.LogResult, 'base64').toString('utf-8') : ''
  
  return {
    StatusCode: response.StatusCode,
    FunctionError: response.FunctionError,
    LogResult: logStr,
    Payload: resultStr
  }
}
