/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Rumor Radar'

interface Props {
  topic?: string
  submissionId?: string
}

const RumorReceived = ({ topic, submissionId }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Thanks for submitting a rumor to {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Submission received</Heading>
        <Text style={text}>
          Thank you for submitting a rumor to {SITE_NAME}. Our verification team and our
          partner CSOs will review it shortly.
        </Text>
        {topic && (
          <Text style={text}>
            <strong>Topic:</strong> {topic}
          </Text>
        )}
        {submissionId && (
          <Text style={text}>
            <strong>Submission ID:</strong> <code>{submissionId}</code>
          </Text>
        )}
        <Text style={text}>
          You will be notified once the rumor is reviewed and either debunked, verified, or
          rejected as out of scope.
        </Text>
        <Text style={footer}>— The {SITE_NAME} team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: RumorReceived,
  subject: 'We received your rumor submission',
  displayName: 'Rumor submission received',
  previewData: { topic: 'Public Health', submissionId: 'abc123' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '24px 0 0' }
