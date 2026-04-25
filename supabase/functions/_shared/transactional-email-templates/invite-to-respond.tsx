/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Rumor Radar'

interface Props {
  inviteeName?: string
  rumorTitle?: string
  inviteUrl?: string
  message?: string
  kind?: 'cso_debunk' | 'person_respond' | 'institution_respond' | 'organization_respond'
}

const InviteToRespond = ({ inviteeName, rumorTitle, inviteUrl, message, kind }: Props) => {
  const isCso = kind === 'cso_debunk'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>You have been invited to respond on {SITE_NAME}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            {isCso ? 'Invitation to debunk a rumor' : 'Invitation to respond to a claim'}
          </Heading>
          <Text style={text}>Hi {inviteeName || 'there'},</Text>
          <Text style={text}>
            You have been invited on {SITE_NAME} to {isCso ? 'provide a debunk for' : 'respond to'}
            {' '}the following rumor:
          </Text>
          {rumorTitle && (
            <Text style={quote}>"{rumorTitle}"</Text>
          )}
          {message && (
            <Text style={text}><em>"{message}"</em></Text>
          )}
          {inviteUrl && (
            <Button href={inviteUrl} style={button}>Open invitation</Button>
          )}
          <Text style={small}>
            If you believe this invitation was sent in error, you can safely ignore this email.
          </Text>
          <Text style={footer}>— The {SITE_NAME} team</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: InviteToRespond,
  subject: (d) => d.kind === 'cso_debunk'
    ? `Invitation to debunk: ${d.rumorTitle ?? 'a rumor'}`
    : `Invitation to respond: ${d.rumorTitle ?? 'a claim'}`,
  displayName: 'Invite to respond',
  previewData: {
    inviteeName: 'Jane',
    rumorTitle: 'False claim about election results',
    inviteUrl: 'https://rumorradar.org/invite/xyz',
    kind: 'cso_debunk',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const quote = { fontSize: '14px', color: '#0f172a', borderLeft: '3px solid #0ea5e9', paddingLeft: '12px', margin: '16px 0', fontStyle: 'italic' as const }
const button = { backgroundColor: '#0ea5e9', color: '#ffffff', padding: '12px 20px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold', display: 'inline-block' }
const small = { fontSize: '12px', color: '#64748b', lineHeight: '1.5', margin: '24px 0 0' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '16px 0 0' }
