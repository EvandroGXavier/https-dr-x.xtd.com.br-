-- ============================================================================
-- WhatsApp Read Receipts & Delivery Status System
-- ============================================================================

-- 1. Create trigger function to log status changes in wa_messages
CREATE OR REPLACE FUNCTION log_wa_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log status changes to audit log
  INSERT INTO public.security_audit_log (
    user_id,
    event_type,
    event_description,
    metadata
  ) VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    'wa_status_change',
    format('WhatsApp message status changed from %s to %s', OLD.status, NEW.status),
    jsonb_build_object(
      'message_id', NEW.id,
      'wa_message_id', NEW.wa_message_id,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'sent_at', NEW.sent_at,
      'delivered_at', NEW.delivered_at,
      'read_at', NEW.read_at,
      'timestamp', now()
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Create trigger for wa_messages status changes
DROP TRIGGER IF EXISTS trg_audit_wa_status ON public.wa_messages;
CREATE TRIGGER trg_audit_wa_status
  AFTER UPDATE OF status ON public.wa_messages
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_wa_status_change();

-- 3. Create index on wa_message_id for faster webhook lookups
CREATE INDEX IF NOT EXISTS idx_wa_messages_wa_message_id 
  ON public.wa_messages(wa_message_id);

-- 4. Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_wa_messages_status 
  ON public.wa_messages(status);

COMMENT ON FUNCTION log_wa_status_change() IS 'Logs WhatsApp message status changes to security_audit_log';
COMMENT ON TRIGGER trg_audit_wa_status ON public.wa_messages IS 'Audits status changes in WhatsApp messages';