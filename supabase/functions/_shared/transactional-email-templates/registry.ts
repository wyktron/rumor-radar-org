/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as testEmail } from './test-email.tsx'
import { template as subscribeConfirm } from './subscribe-confirm.tsx'
import { template as csoVerificationReceived } from './cso-verification-received.tsx'
import { template as csoVerificationApproved } from './cso-verification-approved.tsx'
import { template as rumorSubmissionReceived } from './rumor-submission-received.tsx'
import { template as inviteToRespond } from './invite-to-respond.tsx'
import { template as lovedOneReceived } from './loved-one-received.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'test-email': testEmail,
  'subscribe-confirm': subscribeConfirm,
  'cso-verification-received': csoVerificationReceived,
  'cso-verification-approved': csoVerificationApproved,
  'rumor-submission-received': rumorSubmissionReceived,
  'invite-to-respond': inviteToRespond,
  'loved-one-received': lovedOneReceived,
}
