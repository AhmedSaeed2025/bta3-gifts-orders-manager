-- Add new status values for printing workflow
-- Update existing orders that might need the new status
-- No table structure changes needed, just ensuring the status field can accept new values

-- The status field already exists as text, so we can use any string value
-- This is just a comment to document the new status values being used:
-- 'sent_to_printing' - Order sent to printing service
-- 'printing_received' - Order received back from printing service

-- No actual SQL changes needed since status is already a text field