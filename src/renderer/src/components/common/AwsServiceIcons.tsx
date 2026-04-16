import type { Service } from '../../types'

// Official AWS service category colors (2023 flat icon palette)
const AWS_BG: Record<Service, string> = {
  sqs:            '#FF4F8B',
  s3:             '#3F8624',
  secretsmanager: '#BF0816',
  dynamodb:       '#2E73B8',
  cloudformation: '#E7157B',
  ssm:            '#E7157B',
  sns:            '#FF4F8B',
  eventbridge:    '#E7157B',
  scheduler:      '#E7157B',
  ses:            '#FF4F8B',
  kms:            '#BF0816',
  iam:            '#BF0816',
  sts:            '#BF0816',
  apigw:          '#8C4FFF',
  firehose:       '#8C4FFF',
  lambda:         '#FF9900',
  cloudwatch:     '#E7157B',
  redshift:       '#8C4FFF',
  kinesis:        '#8C4FFF',
  opensearch:     '#005EB8',
  ec2:            '#FF9900',
  transcribe:     '#01A88D',
  route53:        '#8C4FFF',
  acm:            '#BF0816',
  swf:            '#E7157B',
  sfn:            '#E7157B',
  support:        '#005EB8',
  r53resolver:    '#8C4FFF',
  awsconfig:      '#E7157B',
  s3control:      '#3F8624',
  resourcegroups: '#E7157B',
}

// White SVG icon paths for each service (viewBox 0 0 24 24, stroke=white fill=none unless noted)
const AWS_ICON_PATH: Record<Service, React.ReactElement> = {
  sqs: (
    <>
      <rect x="3" y="5" width="18" height="4" rx="1.5" fill="white"/>
      <rect x="3" y="10" width="18" height="4" rx="1.5" fill="white"/>
      <rect x="3" y="15" width="18" height="4" rx="1.5" fill="white"/>
    </>
  ),
  s3: (
    <>
      <ellipse cx="12" cy="8" rx="7" ry="3" stroke="white" strokeWidth="1.8" fill="none"/>
      <path d="M5 8 L5 16 Q5 19 12 19 Q19 19 19 16 L19 8" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <line x1="5" y1="12" x2="19" y2="12" stroke="white" strokeWidth="1.4" strokeDasharray="2 1.5"/>
    </>
  ),
  secretsmanager: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="white" strokeWidth="1.8" fill="none"/>
      <path d="M8 11 V7.5 Q8 4 12 4 Q16 4 16 7.5 V11" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <circle cx="12" cy="15.5" r="2" fill="white"/>
    </>
  ),
  dynamodb: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="2.5" stroke="white" strokeWidth="1.8" fill="none"/>
      <path d="M5 6 V12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M19 6 V12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <ellipse cx="12" cy="12" rx="7" ry="2.5" stroke="white" strokeWidth="1.8" fill="none"/>
      <path d="M5 12 V18" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M19 12 V18" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <ellipse cx="12" cy="18" rx="7" ry="2.5" stroke="white" strokeWidth="1.8" fill="none"/>
    </>
  ),
  cloudformation: (
    <>
      <rect x="4" y="4" width="16" height="5" rx="1.5" stroke="white" strokeWidth="1.8" fill="none"/>
      <rect x="4" y="10" width="16" height="4" rx="1.5" stroke="white" strokeWidth="1.8" fill="none"/>
      <rect x="4" y="15.5" width="16" height="4.5" rx="1.5" stroke="white" strokeWidth="1.8" fill="none"/>
    </>
  ),
  ssm: (
    <>
      <line x1="4" y1="7" x2="20" y2="7" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="9" cy="7" r="2.5" fill="white"/>
      <line x1="4" y1="12" x2="20" y2="12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="15" cy="12" r="2.5" fill="white"/>
      <line x1="4" y1="17" x2="20" y2="17" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="10" cy="17" r="2.5" fill="white"/>
    </>
  ),
  sns: (
    <>
      <path d="M12 3 Q8 7 4 8 L4 16 Q8 17 12 21 Q16 17 20 16 L20 8 Q16 7 12 3Z" stroke="white" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
      <line x1="12" y1="3" x2="12" y2="21" stroke="white" strokeWidth="1.4" strokeDasharray="2 1.5"/>
      <line x1="4" y1="8" x2="20" y2="8" stroke="white" strokeWidth="1.4" strokeDasharray="2 1.5"/>
      <line x1="4" y1="16" x2="20" y2="16" stroke="white" strokeWidth="1.4" strokeDasharray="2 1.5"/>
    </>
  ),
  eventbridge: (
    <>
      <circle cx="5" cy="12" r="2.5" stroke="white" strokeWidth="1.8" fill="none"/>
      <circle cx="12" cy="5" r="2.5" stroke="white" strokeWidth="1.8" fill="none"/>
      <circle cx="12" cy="19" r="2.5" stroke="white" strokeWidth="1.8" fill="none"/>
      <circle cx="19" cy="12" r="2.5" stroke="white" strokeWidth="1.8" fill="none"/>
      <line x1="7.5" y1="12" x2="16.5" y2="12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="12" y1="7.5" x2="12" y2="16.5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
    </>
  ),
  scheduler: (
    <>
      <circle cx="12" cy="12" r="8.5" stroke="white" strokeWidth="1.8" fill="none"/>
      <line x1="12" y1="6" x2="12" y2="12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="12" y1="12" x2="16" y2="15" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="1.2" fill="white"/>
    </>
  ),
  ses: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2" stroke="white" strokeWidth="1.8" fill="none"/>
      <path d="M3 8 L12 14 L21 8" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  kms: (
    <>
      <circle cx="8.5" cy="10" r="4" stroke="white" strokeWidth="1.8" fill="none"/>
      <path d="M12 12.5 L20 20" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="17" y1="17" x2="20" y2="14" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="14.5" y1="19.5" x2="17.5" y2="16.5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
    </>
  ),
  iam: (
    <>
      <circle cx="12" cy="7.5" r="3.5" stroke="white" strokeWidth="1.8" fill="none"/>
      <path d="M5 21 Q5 15 12 15 Q19 15 19 21" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M16 11 L17.5 12.5 L21 9" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  sts: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="white" strokeWidth="1.8" fill="none"/>
      <line x1="8" y1="10" x2="16" y2="10" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="8" y1="13.5" x2="13" y2="13.5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="8" cy="7.5" r="1" fill="white"/>
      <circle cx="11" cy="7.5" r="1" fill="white"/>
    </>
  ),
  apigw: (
    <>
      <rect x="3" y="9" width="5" height="6" rx="1.5" stroke="white" strokeWidth="1.8" fill="none"/>
      <rect x="16" y="9" width="5" height="6" rx="1.5" stroke="white" strokeWidth="1.8" fill="none"/>
      <line x1="8" y1="12" x2="16" y2="12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M13.5 9.5 L16 12 L13.5 14.5" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  firehose: (
    <>
      <path d="M5 4 L5 16 Q5 20 12 20 Q19 20 19 16 L19 4" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 4 Q9 8 12 8 Q15 8 15 4" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <line x1="5" y1="12" x2="19" y2="12" stroke="white" strokeWidth="1.4" strokeDasharray="2 1.5"/>
    </>
  ),
  lambda: (
    <>
      <path d="M6 20 L10 12 L8 8 L11 4" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 4 L18 20" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <line x1="14.5" y1="14" x2="19" y2="14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </>
  ),
  cloudwatch: (
    <>
      <circle cx="12" cy="12" r="8.5" stroke="white" strokeWidth="1.8" fill="none"/>
      <path d="M5 14 Q7.5 9 10 12 Q11.5 14 13 10 Q14.5 6 17 11 L19 9" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  redshift: (
    <>
      <ellipse cx="12" cy="5.5" rx="7" ry="2.5" stroke="white" strokeWidth="1.8" fill="none"/>
      <path d="M5 5.5 L5 12.5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M19 5.5 L19 12.5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <ellipse cx="12" cy="12.5" rx="7" ry="2.5" stroke="white" strokeWidth="1.8" fill="none"/>
      <path d="M7 18.5 Q7 20.5 12 20.5 Q17 20.5 17 18.5 L17 15.5 Q17 14 12 14 Q7 14 7 15.5Z" stroke="white" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
    </>
  ),
  kinesis: (
    <>
      <path d="M4 8 Q8 8 8 12 Q8 16 12 16 Q16 16 16 12 Q16 8 20 8" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M4 12 Q8 12 8 16 Q8 20 12 20" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeOpacity="0.7"/>
      <path d="M4 4 Q8 4 8 8 Q8 12 12 12 Q16 12 16 8 Q16 4 20 4" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeOpacity="0.7"/>
    </>
  ),
  opensearch: (
    <>
      <circle cx="11" cy="10.5" r="6.5" stroke="white" strokeWidth="1.8" fill="none"/>
      <line x1="15.5" y1="15.5" x2="21" y2="21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="8" y1="10.5" x2="14" y2="10.5" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="11" y1="7.5" x2="11" y2="13.5" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
    </>
  ),
  ec2: (
    <>
      <rect x="5" y="5" width="14" height="14" rx="2" stroke="white" strokeWidth="1.8" fill="none"/>
      <rect x="9" y="9" width="6" height="6" rx="1" fill="white"/>
      <line x1="9" y1="3" x2="9" y2="5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="15" y1="3" x2="15" y2="5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="9" y1="19" x2="9" y2="21" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="15" y1="19" x2="15" y2="21" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="3" y1="9" x2="5" y2="9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="3" y1="15" x2="5" y2="15" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="19" y1="9" x2="21" y2="9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="19" y1="15" x2="21" y2="15" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
    </>
  ),
  transcribe: (
    <>
      <rect x="9" y="2" width="6" height="12" rx="3" stroke="white" strokeWidth="1.8" fill="none"/>
      <path d="M5 11 Q5 17 12 17 Q19 17 19 11" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <line x1="12" y1="17" x2="12" y2="21" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="8" y1="21" x2="16" y2="21" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
    </>
  ),
  route53: (
    <>
      <circle cx="12" cy="12" r="8.5" stroke="white" strokeWidth="1.8" fill="none"/>
      <path d="M12 3.5 Q9 7 9 12 Q9 17 12 20.5" stroke="white" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      <path d="M12 3.5 Q15 7 15 12 Q15 17 12 20.5" stroke="white" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      <line x1="3.5" y1="12" x2="20.5" y2="12" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
    </>
  ),
  acm: (
    <>
      <path d="M12 3 L4 7 L4 13 Q4 18.5 12 21 Q20 18.5 20 13 L20 7Z" stroke="white" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
      <path d="M9 12 L11 14 L15 10" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  swf: (
    <>
      <circle cx="5" cy="5" r="2" stroke="white" strokeWidth="1.8" fill="none"/>
      <circle cx="19" cy="5" r="2" stroke="white" strokeWidth="1.8" fill="none"/>
      <circle cx="12" cy="12" r="2" stroke="white" strokeWidth="1.8" fill="none"/>
      <circle cx="5" cy="19" r="2" stroke="white" strokeWidth="1.8" fill="none"/>
      <circle cx="19" cy="19" r="2" stroke="white" strokeWidth="1.8" fill="none"/>
      <line x1="7" y1="5" x2="17" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="6.5" y1="6.5" x2="11" y2="11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="13" y1="13" x2="17.5" y2="17.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="6.5" y1="17.5" x2="11" y2="13" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </>
  ),
  sfn: (
    <>
      <rect x="9" y="3" width="6" height="4" rx="1" stroke="white" strokeWidth="1.6" fill="none"/>
      <rect x="9" y="10" width="6" height="4" rx="1" stroke="white" strokeWidth="1.6" fill="none"/>
      <rect x="9" y="17" width="6" height="4" rx="1" stroke="white" strokeWidth="1.6" fill="none"/>
      <line x1="12" y1="7" x2="12" y2="10" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="12" y1="14" x2="12" y2="17" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M15 5 Q20 5 20 12 Q20 19 15 19" stroke="white" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeOpacity="0.8"/>
    </>
  ),
  support: (
    <>
      <circle cx="12" cy="12" r="8.5" stroke="white" strokeWidth="1.8" fill="none"/>
      <circle cx="12" cy="12" r="3.5" stroke="white" strokeWidth="1.8" fill="none"/>
      <line x1="4.5" y1="9" x2="8.5" y2="10.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="4.5" y1="15" x2="8.5" y2="13.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="19.5" y1="9" x2="15.5" y2="10.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="19.5" y1="15" x2="15.5" y2="13.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </>
  ),
  r53resolver: (
    <>
      <circle cx="12" cy="12" r="8.5" stroke="white" strokeWidth="1.8" fill="none"/>
      <path d="M12 3.5 Q9 7 9 12 Q9 17 12 20.5" stroke="white" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      <path d="M12 3.5 Q15 7 15 12 Q15 17 12 20.5" stroke="white" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      <line x1="3.5" y1="12" x2="20.5" y2="12" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M17 8 L20 5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M18.5 5 L20 5 L20 6.5" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  awsconfig: (
    <>
      <line x1="4" y1="7" x2="20" y2="7" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M8 7 L8 4" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
      <line x1="4" y1="12" x2="20" y2="12" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M14 12 L14 9" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
      <line x1="4" y1="17" x2="20" y2="17" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M10 17 L10 14" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
    </>
  ),
  s3control: (
    <>
      <ellipse cx="12" cy="8" rx="7" ry="3" stroke="white" strokeWidth="1.8" fill="none"/>
      <path d="M5 8 L5 14 Q5 17 12 17 Q19 17 19 14 L19 8" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <rect x="9" y="14" width="6" height="7" rx="1.5" fill="white" fillOpacity="0.9"/>
      <circle cx="12" cy="17" r="1.2" fill="rgb(61 134 36)"/>
      <line x1="12" y1="18.2" x2="12" y2="19.5" stroke="rgb(61 134 36)" strokeWidth="1.2" strokeLinecap="round"/>
    </>
  ),
  resourcegroups: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="white" strokeWidth="1.7" fill="none"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="white" strokeWidth="1.7" fill="none"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="white" strokeWidth="1.7" fill="none"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="white" strokeWidth="1.7" fill="none"/>
    </>
  ),
}

export function AwsServiceIcon({ service, size = 24 }: { service: Service; size?: number }) {
  const bg = AWS_BG[service]
  const iconPaths = AWS_ICON_PATH[service]
  const padding = size * 0.18
  const inner = size - padding * 2
  const radius = size * 0.22

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="0" y="0" width={size} height={size} rx={radius} fill={bg} />
      <svg
        x={padding}
        y={padding}
        width={inner}
        height={inner}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {iconPaths}
      </svg>
    </svg>
  )
}
