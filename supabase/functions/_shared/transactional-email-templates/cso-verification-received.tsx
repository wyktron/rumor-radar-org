/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Rumor Radar'

interface Props {
  organizationName?: string
}

const CsoReceived = ({ organizationName }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>We received your CSO verification request</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your verification request was received</Heading>
        <Text style={text}>
          Thank you for submitting <strong>{organizationName || 'your organization'}</strong> for
          verification on {SITE_NAME}. Our team will review your application and supporting
          documents within <strong>5–10 business days</strong>.
        </Text>
        <Text style={text}>
          We follow a process similar to Google for Nonprofits and Canva for Nonprofits — we verify
          legal status, mission alignment, and operational track record. We may reach out for
          clarification or additional documents.
        </Text>
        <Text style={text}>
          You will receive another email once a decision is made. If approved, the email will
          include credentials to access the moderator console.
        </Text>
        <Text style={footer}>— The {SITE_NAME} verification team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CsoReceived,
  subject: (d) => `Verification request received — ${d.organizationName ?? 'your organization'}`,
  displayName: 'CSO verification received',
  previewData: { organizationName: 'Example Fact-Checkers' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '24px 0 0' }
