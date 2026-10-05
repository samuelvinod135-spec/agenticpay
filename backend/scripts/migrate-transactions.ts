#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

const sqlPath = path.resolve(__dirname, '../supabase/migrations/20261005_transactions_table.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

console.log('\n=============================================================');
console.log('  📊 AGENTICPAY: TRANSACTIONS TABLE MIGRATION SQL');
console.log('=============================================================\n');
console.log('Run the following SQL in your Supabase SQL Editor:');
console.log('👉 https://supabase.com/dashboard/project/bntkarcdxpzyiowufzso/sql\n');
console.log('-------------------------------------------------------------');
console.log(sql);
console.log('-------------------------------------------------------------\n');
