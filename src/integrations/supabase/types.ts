export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          contact_email: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          monthly_request_limit: number
          organization: string | null
          tier: Database["public"]["Enums"]["api_key_tier"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          contact_email: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          monthly_request_limit?: number
          organization?: string | null
          tier?: Database["public"]["Enums"]["api_key_tier"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          contact_email?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          monthly_request_limit?: number
          organization?: string | null
          tier?: Database["public"]["Enums"]["api_key_tier"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      api_usage: {
        Row: {
          api_key_id: string
          created_at: string
          endpoint: string
          id: number
          ip_address: string | null
          response_ms: number | null
          status_code: number | null
        }
        Insert: {
          api_key_id: string
          created_at?: string
          endpoint: string
          id?: number
          ip_address?: string | null
          response_ms?: number | null
          status_code?: number | null
        }
        Update: {
          api_key_id?: string
          created_at?: string
          endpoint?: string
          id?: number
          ip_address?: string | null
          response_ms?: number | null
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      cso_documents: {
        Row: {
          doc_type: string
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          request_id: string
          size_bytes: number | null
          uploaded_at: string
        }
        Insert: {
          doc_type: string
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          request_id: string
          size_bytes?: number | null
          uploaded_at?: string
        }
        Update: {
          doc_type?: string
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          request_id?: string
          size_bytes?: number | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cso_documents_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "cso_verification_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      cso_members: {
        Row: {
          created_at: string
          cso_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cso_id: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cso_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cso_members_cso_id_fkey"
            columns: ["cso_id"]
            isOneToOne: false
            referencedRelation: "csos"
            referencedColumns: ["id"]
          },
        ]
      }
      cso_verification_requests: {
        Row: {
          contact_email: string
          contact_name: string
          contact_phone: string | null
          country: string
          country_code: string | null
          created_at: string
          description: string
          id: string
          ifcn_signatory: boolean | null
          legal_name: string | null
          mission_statement: string | null
          organization_name: string
          provisioned_cso_id: string | null
          provisioned_user_id: string | null
          registration_number: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          staff_count: number | null
          status: Database["public"]["Enums"]["cso_request_status"]
          submitted_at: string
          updated_at: string
          website: string | null
          years_active: number | null
        }
        Insert: {
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          country: string
          country_code?: string | null
          created_at?: string
          description: string
          id?: string
          ifcn_signatory?: boolean | null
          legal_name?: string | null
          mission_statement?: string | null
          organization_name: string
          provisioned_cso_id?: string | null
          provisioned_user_id?: string | null
          registration_number?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          staff_count?: number | null
          status?: Database["public"]["Enums"]["cso_request_status"]
          submitted_at?: string
          updated_at?: string
          website?: string | null
          years_active?: number | null
        }
        Update: {
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          country?: string
          country_code?: string | null
          created_at?: string
          description?: string
          id?: string
          ifcn_signatory?: boolean | null
          legal_name?: string | null
          mission_statement?: string | null
          organization_name?: string
          provisioned_cso_id?: string | null
          provisioned_user_id?: string | null
          registration_number?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          staff_count?: number | null
          status?: Database["public"]["Enums"]["cso_request_status"]
          submitted_at?: string
          updated_at?: string
          website?: string | null
          years_active?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cso_verification_requests_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "cso_verification_requests_provisioned_cso_id_fkey"
            columns: ["provisioned_cso_id"]
            isOneToOne: false
            referencedRelation: "csos"
            referencedColumns: ["id"]
          },
        ]
      }
      csos: {
        Row: {
          contact_email: string
          country: string
          country_code: string | null
          created_at: string
          date_joined: string
          description: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          updated_at: string
          verified: boolean
          website: string | null
        }
        Insert: {
          contact_email: string
          country: string
          country_code?: string | null
          created_at?: string
          date_joined?: string
          description: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          updated_at?: string
          verified?: boolean
          website?: string | null
        }
        Update: {
          contact_email?: string
          country?: string
          country_code?: string | null
          created_at?: string
          date_joined?: string
          description?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          updated_at?: string
          verified?: boolean
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "csos_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["code"]
          },
        ]
      }
      debunk_submissions: {
        Row: {
          content: string
          created_at: string
          cso_id: string
          cso_name: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          rumor_id: string
          sources: string[]
          status: Database["public"]["Enums"]["submission_status"]
          submission_type: string
          submitted_at: string
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          cso_id: string
          cso_name: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          rumor_id: string
          sources?: string[]
          status?: Database["public"]["Enums"]["submission_status"]
          submission_type: string
          submitted_at?: string
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          cso_id?: string
          cso_name?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          rumor_id?: string
          sources?: string[]
          status?: Database["public"]["Enums"]["submission_status"]
          submission_type?: string
          submitted_at?: string
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "debunk_submissions_cso_id_fkey"
            columns: ["cso_id"]
            isOneToOne: false
            referencedRelation: "csos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debunk_submissions_rumor_id_fkey"
            columns: ["rumor_id"]
            isOneToOne: false
            referencedRelation: "rumors"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          donor_email: string | null
          donor_name: string | null
          id: string
          is_anonymous: boolean
          message: string | null
          provider: Database["public"]["Enums"]["donation_provider"]
          provider_payment_id: string | null
          raw_payload: Json | null
          status: Database["public"]["Enums"]["donation_status"]
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          donor_email?: string | null
          donor_name?: string | null
          id?: string
          is_anonymous?: boolean
          message?: string | null
          provider: Database["public"]["Enums"]["donation_provider"]
          provider_payment_id?: string | null
          raw_payload?: Json | null
          status?: Database["public"]["Enums"]["donation_status"]
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          donor_email?: string | null
          donor_name?: string | null
          id?: string
          is_anonymous?: boolean
          message?: string | null
          provider?: Database["public"]["Enums"]["donation_provider"]
          provider_payment_id?: string | null
          raw_payload?: Json | null
          status?: Database["public"]["Enums"]["donation_status"]
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      loved_one_submissions: {
        Row: {
          best_time_to_call: string | null
          contact_method: Database["public"]["Enums"]["contact_method"]
          contact_value: string
          contacted_at: string | null
          country: string
          country_code: string | null
          created_at: string
          id: string
          ip_address: string | null
          notes: string
          relationship: string
          staff_notes: string | null
          status: Database["public"]["Enums"]["loved_one_status"]
          submitted_at: string
          submitter_email: string | null
          updated_at: string
        }
        Insert: {
          best_time_to_call?: string | null
          contact_method: Database["public"]["Enums"]["contact_method"]
          contact_value: string
          contacted_at?: string | null
          country: string
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          notes: string
          relationship: string
          staff_notes?: string | null
          status?: Database["public"]["Enums"]["loved_one_status"]
          submitted_at?: string
          submitter_email?: string | null
          updated_at?: string
        }
        Update: {
          best_time_to_call?: string | null
          contact_method?: Database["public"]["Enums"]["contact_method"]
          contact_value?: string
          contacted_at?: string | null
          country?: string
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          notes?: string
          relationship?: string
          staff_notes?: string | null
          status?: Database["public"]["Enums"]["loved_one_status"]
          submitted_at?: string
          submitter_email?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loved_one_submissions_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["code"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          preferred_language: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          preferred_language?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          preferred_language?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      regions: {
        Row: {
          code: string
          created_at: string
          display_order: number | null
          iso_alpha2: string | null
          latitude: number | null
          longitude: number | null
          name: string
          notes: string | null
          parent_code: string | null
          phone_prefix: string | null
          short_name: string | null
          status: Database["public"]["Enums"]["region_status"]
        }
        Insert: {
          code: string
          created_at?: string
          display_order?: number | null
          iso_alpha2?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          notes?: string | null
          parent_code?: string | null
          phone_prefix?: string | null
          short_name?: string | null
          status?: Database["public"]["Enums"]["region_status"]
        }
        Update: {
          code?: string
          created_at?: string
          display_order?: number | null
          iso_alpha2?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          notes?: string | null
          parent_code?: string | null
          phone_prefix?: string | null
          short_name?: string | null
          status?: Database["public"]["Enums"]["region_status"]
        }
        Relationships: [
          {
            foreignKeyName: "regions_parent_code_fkey"
            columns: ["parent_code"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["code"]
          },
        ]
      }
      rumor_invites: {
        Row: {
          created_at: string
          created_by: string | null
          email_sent_at: string | null
          id: string
          invitee_email: string
          invitee_name: string
          invitee_role: string | null
          ip_address: string | null
          kind: Database["public"]["Enums"]["invite_kind"]
          message: string | null
          party_type: string | null
          responded_at: string | null
          rumor_id: string | null
          rumor_submission_id: string | null
          status: Database["public"]["Enums"]["invite_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email_sent_at?: string | null
          id?: string
          invitee_email: string
          invitee_name: string
          invitee_role?: string | null
          ip_address?: string | null
          kind: Database["public"]["Enums"]["invite_kind"]
          message?: string | null
          party_type?: string | null
          responded_at?: string | null
          rumor_id?: string | null
          rumor_submission_id?: string | null
          status?: Database["public"]["Enums"]["invite_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email_sent_at?: string | null
          id?: string
          invitee_email?: string
          invitee_name?: string
          invitee_role?: string | null
          ip_address?: string | null
          kind?: Database["public"]["Enums"]["invite_kind"]
          message?: string | null
          party_type?: string | null
          responded_at?: string | null
          rumor_id?: string | null
          rumor_submission_id?: string | null
          status?: Database["public"]["Enums"]["invite_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rumor_invites_rumor_id_fkey"
            columns: ["rumor_id"]
            isOneToOne: false
            referencedRelation: "rumors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rumor_invites_rumor_submission_id_fkey"
            columns: ["rumor_submission_id"]
            isOneToOne: false
            referencedRelation: "rumor_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      rumor_submissions: {
        Row: {
          claim: string
          created_at: string
          description: string | null
          id: string
          origin_country: string
          origin_country_code: string | null
          origin_latitude: number | null
          origin_longitude: number | null
          resulting_rumor_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          source: string | null
          source_language: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["submission_status"]
          subject_country: string | null
          submitted_at: string
          submitted_by: string | null
          submitter_email: string | null
          topic: string
          updated_at: string
        }
        Insert: {
          claim: string
          created_at?: string
          description?: string | null
          id?: string
          origin_country: string
          origin_country_code?: string | null
          origin_latitude?: number | null
          origin_longitude?: number | null
          resulting_rumor_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          source?: string | null
          source_language?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          subject_country?: string | null
          submitted_at?: string
          submitted_by?: string | null
          submitter_email?: string | null
          topic: string
          updated_at?: string
        }
        Update: {
          claim?: string
          created_at?: string
          description?: string | null
          id?: string
          origin_country?: string
          origin_country_code?: string | null
          origin_latitude?: number | null
          origin_longitude?: number | null
          resulting_rumor_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          source?: string | null
          source_language?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          subject_country?: string | null
          submitted_at?: string
          submitted_by?: string | null
          submitter_email?: string | null
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rumor_submissions_origin_country_code_fkey"
            columns: ["origin_country_code"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "rumor_submissions_resulting_rumor_id_fkey"
            columns: ["resulting_rumor_id"]
            isOneToOne: false
            referencedRelation: "rumors"
            referencedColumns: ["id"]
          },
        ]
      }
      rumor_translations: {
        Row: {
          debunk_content: string | null
          description: string
          id: string
          is_machine_translated: boolean
          language: string
          rumor_id: string
          title: string
          translated_at: string
          verification_content: string | null
        }
        Insert: {
          debunk_content?: string | null
          description: string
          id?: string
          is_machine_translated?: boolean
          language: string
          rumor_id: string
          title: string
          translated_at?: string
          verification_content?: string | null
        }
        Update: {
          debunk_content?: string | null
          description?: string
          id?: string
          is_machine_translated?: boolean
          language?: string
          rumor_id?: string
          title?: string
          translated_at?: string
          verification_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rumor_translations_rumor_id_fkey"
            columns: ["rumor_id"]
            isOneToOne: false
            referencedRelation: "rumors"
            referencedColumns: ["id"]
          },
        ]
      }
      rumors: {
        Row: {
          created_at: string
          debunk_content: string | null
          debunk_sources: string[] | null
          debunked_at: string | null
          debunked_by: string | null
          debunked_by_cso_id: string | null
          description: string
          id: string
          intensity: number
          latitude: number
          longitude: number
          origin_country: string
          origin_country_code: string | null
          scraped_from_id: string | null
          source_language: string
          source_url: string | null
          status: Database["public"]["Enums"]["rumor_status"]
          subject_country: string | null
          subject_country_code: string | null
          submitted_at: string
          submitted_by: string | null
          title: string
          topic: string
          updated_at: string
          verification_content: string | null
          verification_sources: string[] | null
          verified_at: string | null
          verified_by: string | null
          verified_by_cso_id: string | null
        }
        Insert: {
          created_at?: string
          debunk_content?: string | null
          debunk_sources?: string[] | null
          debunked_at?: string | null
          debunked_by?: string | null
          debunked_by_cso_id?: string | null
          description: string
          id?: string
          intensity?: number
          latitude: number
          longitude: number
          origin_country: string
          origin_country_code?: string | null
          scraped_from_id?: string | null
          source_language?: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["rumor_status"]
          subject_country?: string | null
          subject_country_code?: string | null
          submitted_at?: string
          submitted_by?: string | null
          title: string
          topic: string
          updated_at?: string
          verification_content?: string | null
          verification_sources?: string[] | null
          verified_at?: string | null
          verified_by?: string | null
          verified_by_cso_id?: string | null
        }
        Update: {
          created_at?: string
          debunk_content?: string | null
          debunk_sources?: string[] | null
          debunked_at?: string | null
          debunked_by?: string | null
          debunked_by_cso_id?: string | null
          description?: string
          id?: string
          intensity?: number
          latitude?: number
          longitude?: number
          origin_country?: string
          origin_country_code?: string | null
          scraped_from_id?: string | null
          source_language?: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["rumor_status"]
          subject_country?: string | null
          subject_country_code?: string | null
          submitted_at?: string
          submitted_by?: string | null
          title?: string
          topic?: string
          updated_at?: string
          verification_content?: string | null
          verification_sources?: string[] | null
          verified_at?: string | null
          verified_by?: string | null
          verified_by_cso_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rumors_debunked_by_cso_id_fkey"
            columns: ["debunked_by_cso_id"]
            isOneToOne: false
            referencedRelation: "csos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rumors_origin_country_code_fkey"
            columns: ["origin_country_code"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "rumors_subject_country_code_fkey"
            columns: ["subject_country_code"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "rumors_verified_by_cso_id_fkey"
            columns: ["verified_by_cso_id"]
            isOneToOne: false
            referencedRelation: "csos"
            referencedColumns: ["id"]
          },
        ]
      }
      scraped_rumors: {
        Row: {
          ai_confidence: number | null
          ai_summary: string | null
          created_at: string
          description: string | null
          detected_country: string | null
          detected_country_code: string | null
          duplicate_of: string | null
          id: string
          latitude: number | null
          longitude: number | null
          promoted_to_rumor_id: string | null
          raw_text: string
          reviewed_at: string | null
          reviewed_by: string | null
          scraped_at: string
          source: Database["public"]["Enums"]["scraper_source"]
          source_language: string | null
          source_url: string
          status: Database["public"]["Enums"]["scraped_rumor_status"]
          title: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_summary?: string | null
          created_at?: string
          description?: string | null
          detected_country?: string | null
          detected_country_code?: string | null
          duplicate_of?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          promoted_to_rumor_id?: string | null
          raw_text: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          scraped_at?: string
          source: Database["public"]["Enums"]["scraper_source"]
          source_language?: string | null
          source_url: string
          status?: Database["public"]["Enums"]["scraped_rumor_status"]
          title: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          ai_confidence?: number | null
          ai_summary?: string | null
          created_at?: string
          description?: string | null
          detected_country?: string | null
          detected_country_code?: string | null
          duplicate_of?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          promoted_to_rumor_id?: string | null
          raw_text?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          scraped_at?: string
          source?: Database["public"]["Enums"]["scraper_source"]
          source_language?: string | null
          source_url?: string
          status?: Database["public"]["Enums"]["scraped_rumor_status"]
          title?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scraped_rumors_detected_country_code_fkey"
            columns: ["detected_country_code"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "scraped_rumors_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "rumors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scraped_rumors_promoted_to_rumor_id_fkey"
            columns: ["promoted_to_rumor_id"]
            isOneToOne: false
            referencedRelation: "rumors"
            referencedColumns: ["id"]
          },
        ]
      }
      scraper_runs: {
        Row: {
          created_at: string
          error: string | null
          finished_at: string | null
          id: string
          items_found: number
          items_kept: number
          source: Database["public"]["Enums"]["scraper_source"]
          started_at: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          items_found?: number
          items_kept?: number
          source: Database["public"]["Enums"]["scraper_source"]
          started_at?: string
        }
        Update: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          items_found?: number
          items_kept?: number
          source?: Database["public"]["Enums"]["scraper_source"]
          started_at?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          confirm_token: string
          confirmed_at: string | null
          consented_privacy: boolean
          consented_terms: boolean
          countries: string[]
          created_at: string
          email: string
          id: string
          ip_address: string | null
          notify_confirmations: boolean
          notify_debunks: boolean
          preferred_language: string | null
          status: Database["public"]["Enums"]["subscriber_status"]
          unsubscribe_token: string
          unsubscribed_at: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          confirm_token?: string
          confirmed_at?: string | null
          consented_privacy?: boolean
          consented_terms?: boolean
          countries?: string[]
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
          notify_confirmations?: boolean
          notify_debunks?: boolean
          preferred_language?: string | null
          status?: Database["public"]["Enums"]["subscriber_status"]
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          confirm_token?: string
          confirmed_at?: string | null
          consented_privacy?: boolean
          consented_terms?: boolean
          countries?: string[]
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          notify_confirmations?: boolean
          notify_debunks?: boolean
          preferred_language?: string | null
          status?: Database["public"]["Enums"]["subscriber_status"]
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_cso_request: {
        Args: { _notes?: string; _request_id: string }
        Returns: string
      }
      cso_document_signed_url: {
        Args: { _document_id: string; _expires_seconds?: number }
        Returns: string
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      reject_cso_request: {
        Args: { _notes?: string; _request_id: string }
        Returns: boolean
      }
    }
    Enums: {
      api_key_tier: "free" | "starter" | "pro" | "enterprise"
      app_role: "admin" | "moderator" | "cso_member" | "user"
      contact_method: "phone" | "sms" | "email"
      cso_request_status:
        | "pending"
        | "under_review"
        | "approved"
        | "rejected"
        | "changes_requested"
      donation_provider: "stripe" | "paypal" | "btc" | "manual"
      donation_status: "pending" | "completed" | "failed" | "refunded"
      invite_kind:
        | "cso_debunk"
        | "person_respond"
        | "institution_respond"
        | "organization_respond"
      invite_status: "pending" | "sent" | "accepted" | "declined" | "expired"
      loved_one_status:
        | "pending"
        | "contacted"
        | "completed"
        | "unable_to_reach"
      region_status:
        | "sovereign"
        | "partially_recognized"
        | "disputed_territory"
        | "non_self_governing"
        | "autonomous_region"
        | "special_administrative_region"
      rumor_status:
        | "pending"
        | "approved"
        | "debunked"
        | "verified-true"
        | "rejected"
      scraped_rumor_status:
        | "new"
        | "reviewing"
        | "approved"
        | "rejected"
        | "duplicate"
      scraper_source:
        | "reddit"
        | "telegram"
        | "twitter"
        | "web"
        | "rss"
        | "other"
      submission_status: "pending" | "approved" | "rejected"
      subscriber_status: "pending" | "confirmed" | "unsubscribed" | "bounced"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      api_key_tier: ["free", "starter", "pro", "enterprise"],
      app_role: ["admin", "moderator", "cso_member", "user"],
      contact_method: ["phone", "sms", "email"],
      cso_request_status: [
        "pending",
        "under_review",
        "approved",
        "rejected",
        "changes_requested",
      ],
      donation_provider: ["stripe", "paypal", "btc", "manual"],
      donation_status: ["pending", "completed", "failed", "refunded"],
      invite_kind: [
        "cso_debunk",
        "person_respond",
        "institution_respond",
        "organization_respond",
      ],
      invite_status: ["pending", "sent", "accepted", "declined", "expired"],
      loved_one_status: [
        "pending",
        "contacted",
        "completed",
        "unable_to_reach",
      ],
      region_status: [
        "sovereign",
        "partially_recognized",
        "disputed_territory",
        "non_self_governing",
        "autonomous_region",
        "special_administrative_region",
      ],
      rumor_status: [
        "pending",
        "approved",
        "debunked",
        "verified-true",
        "rejected",
      ],
      scraped_rumor_status: [
        "new",
        "reviewing",
        "approved",
        "rejected",
        "duplicate",
      ],
      scraper_source: ["reddit", "telegram", "twitter", "web", "rss", "other"],
      submission_status: ["pending", "approved", "rejected"],
      subscriber_status: ["pending", "confirmed", "unsubscribed", "bounced"],
    },
  },
} as const
