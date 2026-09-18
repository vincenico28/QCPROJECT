import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
function getEnv(key) {
  const m = envContent.match(new RegExp(`${key}=["']?([^"'\\r\\n]+)`));
  return m ? m[1].trim() : '';
}

const supabaseUrl = getEnv('SUPABASE_URL') || 'https://wcprajgotifqgwdjnpss.supabase.co';
const supabaseKey = getEnv('SUPABASE_PUBLISHABLE_KEY') || 'sb_publishable_Xw_6U8zHYrNcuU--0tbbmQ_QTDbsQew';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Fetching latest email_logs from Supabase...');
const { data: emails, error: emailErr } = await supabase
  .from('email_logs')
  .select('*')
  .order('sent_at', { ascending: false })
  .limit(10);

if (emailErr) console.error('Email logs error:', emailErr);
else console.log('Latest 10 email_logs:\n', JSON.stringify(emails, null, 2));

console.log('\nFetching latest audit_logs from Supabase...');
const { data: audits, error: auditErr } = await supabase
  .from('audit_logs')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10);

if (auditErr) console.error('Audit logs error:', auditErr);
else console.log('Latest 10 audit_logs:\n', JSON.stringify(audits, null, 2));
