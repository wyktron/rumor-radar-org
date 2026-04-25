/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Rumor Radar'

interface Props {
  organizationName?: string
  loginEmail?: string
  temporaryPassword?: string
  loginUrl?: string
}

const CsoApproved = ({ organizationName, loginEmail, temporaryPassword, loginUrl }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your CSO verification was approved</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>✅ You are verified</Heading>
        <Text style={text}>
          Congratulations — <strong>{organizationName || 'your organization'}</strong> has been
          approved as a verified Civil Society Organization on {SITE_NAME}.
        </Text>
        <Text style={text}>
          Below are your credentials to access the moderator console where you can submit
          debunks and verifications:
        </Text>
        <Section style={credBox}>
          <Text style={credLine}><strong>Email:</strong> {loginEmail || '—'}</Text>
          <Text style={credLine}><strong>Temporary password:</strong> {temporaryPassword || '—'}</Text>
        </Section>
        <Text style={text}>
          Please sign in and change your password immediately.
        </Text>
        {loginUrl && (
          <Button href={loginUrl} style={button}>Sign in to console</Button>
        )}
        <Text style={footer}>— The {SITE_NAME} team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CsoApproved,
  subject: 'Your Rumor Radar CSO verification was approved',
  displayName: 'CSO approved + credentials',
  previewData: {
    organizationName: 'Example Fact-Checkers',
    loginEmail: 'contact@example.org',
    temporaryPassword: 'TempPass123!',
    loginUrl: 'https://rumorradar.org/login',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const credBox = { backgroundColor: '#f1f5f9', borderRadius: '6px', padding: '12px 16px', margin: '16px 0' }
const credLine = { fontSize: '14px', color: '#0f172a', margin: '4px 0', fontFamily: 'monospace' }
const button = { backgroundColor: '#0ea5e9', color: '#ffffff', padding: '12px 20px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold', display: 'inline-block' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '24px 0 0' }
