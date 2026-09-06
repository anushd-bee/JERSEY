// @ts-nocheck — runs in Deno (Supabase Edge Function), not Node. VS Code TS false-positives are expected.
//
// Verifies the HMAC-SHA256 signature Razorpay returns after a successful
// checkout, using your secret key. Only marks an order paid/confirmed if
// the signature actually matches — the client's word alone is never enough.
//
// Deploy:   supabase functions deploy verify-razorpay-payment
// Secrets:  supabase secrets set RAZORPAY_KEY_SECRET=xxx

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestBody {
    db_order_id: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return json({ error: 'Missing Authorization header' }, 401);
        }

        const supabaseUser = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            { global: { headers: { Authorization: authHeader } } }
        );

        const {
            data: { user },
            error: userError,
        } = await supabaseUser.auth.getUser();

        if (userError || !user) {
            return json({ error: 'Not authenticated' }, 401);
        }

        const body: RequestBody = await req.json();
        const {
            db_order_id,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = body;

        if (!db_order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return json({ error: 'Missing verification fields' }, 400);
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        // Confirm this order actually belongs to the caller and matches
        // the Razorpay order id we created earlier
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('id, user_id, razorpay_order_id, payment_status')
            .eq('id', db_order_id)
            .single();

        if (orderError || !order) {
            return json({ error: 'Order not found' }, 404);
        }
        if (order.user_id !== user.id) {
            return json({ error: 'Order does not belong to this user' }, 403);
        }
        if (order.razorpay_order_id !== razorpay_order_id) {
            return json({ error: 'Razorpay order mismatch' }, 400);
        }
        if (order.payment_status === 'paid') {
            // Already verified earlier (e.g. duplicate webhook/click) — treat as success
            return json({ success: true, already_verified: true });
        }

        // --- The actual security check: recompute the expected signature ourselves ---
        const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
        if (!keySecret) {
            return json({ error: 'Razorpay secret not configured on server' }, 500);
        }

        const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = await hmacSha256Hex(keySecret, payload);

        const isValid = timingSafeEqual(expectedSignature, razorpay_signature);

        if (!isValid) {
            await supabaseAdmin
                .from('orders')
                .update({ payment_status: 'failed' })
                .eq('id', db_order_id);
            return json({ error: 'Invalid payment signature' }, 400);
        }

        const { data: updatedOrder, error: updateError } = await supabaseAdmin
            .from('orders')
            .update({
                payment_status: 'paid',
                status: 'confirmed',
                razorpay_payment_id,
            })
            .eq('id', db_order_id)
            .select()
            .single();

        if (updateError) throw updateError;

        // --- Safe Stock Reduction (Idempotent because we checked payment_status === 'paid' earlier) ---
        const { data: orderItems } = await supabaseAdmin
            .from('order_items')
            .select('product_id, quantity, products(stock)')
            .eq('order_id', db_order_id);

        if (orderItems && orderItems.length > 0) {
            for (const item of orderItems) {
                // Defensive calculation without atomic RPC
                const currentStock = item.products?.stock || 0;
                const newStock = Math.max(0, currentStock - item.quantity);
                await supabaseAdmin
                    .from('products')
                    .update({ stock: newStock })
                    .eq('id', item.product_id);
            }
        }

        return json({ success: true, order: updatedOrder });
    } catch (err) {
        console.error(err);
        return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
    }
});

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(message));
    return [...new Uint8Array(signatureBuffer)]
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}
