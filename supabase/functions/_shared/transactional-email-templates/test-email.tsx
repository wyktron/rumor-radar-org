/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Rumor Radar'

interface Props {
  message?: string
}

const TestEmail = ({ message }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Test email from {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>📡 {SITE_NAME}</Heading>
        <Text style={text}>
          This is a test email from {SITE_NAME} to verify that the email infrastructure
          (DNS, SPF, DKIM, sender domain <strong>notify.rumorradar.org</strong>) is
          working end-to-end.
        </Text>
        {message && (
          <Section style={messageBox}>
            <Text style={messageText}>{message}</Text>
          </Section>
        )}
        <Text style={text}>
          If you are reading this in your inbox, deliverability is working.
        </Text>
        <Text style={footer}>— The {SITE_NAME} team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TestEmail,
  subject: 'Test email from Rumor Radar',
  displayName: 'Test email',
  previewData: { message: 'Hello from Rumor Radar!' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const messageBox = { backgroundColor: '#f1f5f9', borderRadius: '6px', padding: '12px 16px', margin: '16px 0' }
const messageText = { fontSize: '14px', color: '#0f172a', margin: 0, fontFamily: 'monospace' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '24px 0 0' }
