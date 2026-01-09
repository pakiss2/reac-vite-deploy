import { createClient } from '@supabase/supabase-js';
import { MOCK_CLIENTS, MOCK_BILLS } from './src/lib/mockData.js';
import dotenv from 'dotenv';
dotenv.config();

// Note: Vite uses import.meta.env, but this node script needs process.env
// So we need to read from .env manually or hardcode for this script if .env isn't parsed by Node comfortably.
// We'll rely on the user having the variables in .env and using dotenv

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are missing from .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log('Starting migration...');

    // 1. Migrate Clients
    console.log(`Migrating ${MOCK_CLIENTS.length} clients...`);
    const { data: clients, error: clientError } = await supabase
        .from('clients')
        .insert(MOCK_CLIENTS.map(c => ({
            id: c.id, // Keep ID to maintain relationships if possible, else let DB generate
            meter_no: c.meterNo,
            name: c.name,
            type: c.type,
            address: c.address,
            status: c.status
        })))
        .select();

    if (clientError) {
        console.error('Error inserting clients:', clientError);
        return;
    }
    console.log('Clients inserted successfully!');

    // 2. Migrate Bills
    console.log(`Migrating ${MOCK_BILLS.length} bills...`);
    // Need to map legacy mock fields to new schema
    const billsPayload = MOCK_BILLS.map(b => ({
        // id: b.id, // Let's skip string IDs 'B-1001' and let DB generate new int IDs
        client_id: b.clientId,
        month: b.date, // Using date for month for now
        due_date: b.dueDate,
        consumption: b.consumption,
        amount: b.amount,
        status: b.status,
        paid_date: b.paidDate
    }));

    const { error: billError } = await supabase
        .from('bills')
        .insert(billsPayload);

    if (billError) {
        console.error('Error inserting bills:', billError);
        return;
    }
    console.log('Bills inserted successfully!');
    console.log('Migration complete.');
}

migrate();
