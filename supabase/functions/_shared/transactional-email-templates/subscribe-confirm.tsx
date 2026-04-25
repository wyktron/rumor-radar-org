/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Rumor Radar'

interface Props {
  confirmUrl?: string
}

const SubscribeConfirm = ({ confirmUrl }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your {SITE_NAME} subscription</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Confirm your subscription</Heading>
        <Text style={text}>
          You requested to receive alerts from {SITE_NAME} about debunked rumors and
          verified information. Click the button below to confirm your email and
          activate your subscription.
        </Text>
        {confirmUrl && (
          <Button href={confirmUrl} style={button}>
            Confirm subscription
          </Button>
        )}
        <Text style={small}>
          If you did not request this, you can safely ignore this email — no
          subscription will be created.
        </Text>
        <Text style={footer}>— The {SITE_NAME} team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SubscribeConfirm,
  subject: 'Confirm your Rumor Radar subscription',
  displayName: 'Subscribe confirmation',
  previewData: { confirmUrl: 'https://rumorradar.org/subscribe/confirm?token=xyz' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 20px' }
const button = { backgroundColor: '#0ea5e9', color: '#ffffff', padding: '12px 20px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold', display: 'inline-block' }
const small = { fontSize: '12px', color: '#64748b', lineHeight: '1.5', margin: '24px 0 0' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '24px 0 0' }
