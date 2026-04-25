/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Rumor Radar'

const LovedOneReceived = () => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your outreach request was received</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>We received your outreach request</Heading>
        <Text style={text}>
          Thank you for reaching out on behalf of someone you care about. Our team has
          received your request and will contact them with verified, fact-checked
          information using the contact method you provided.
        </Text>
        <Text style={text}>
          We treat these requests with care: outreach is respectful, evidence-based, and
          their information is never shared with third parties.
        </Text>
        <Text style={footer}>— The {SITE_NAME} team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: LovedOneReceived,
  subject: 'We received your outreach request',
  displayName: 'Loved-one outreach received',
  previewData: {},
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '24px 0 0' }
