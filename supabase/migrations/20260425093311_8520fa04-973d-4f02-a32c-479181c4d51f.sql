alter function public.enqueue_email(text, jsonb) set search_path = public, pgmq;
alter function public.read_email_batch(text, integer, integer) set search_path = public, pgmq;
alter function public.delete_email(text, bigint) set search_path = public, pgmq;
alter function public.move_to_dlq(text, text, bigint, jsonb) set search_path = public, pgmq;