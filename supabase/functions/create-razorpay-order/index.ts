// @ts-nocheck — runs in Deno (Supabase Edge Function), not Node. VS Code TS false-positives are expected.
//
// Runs with the service role key, so it bypasses RLS — that's intentional
// and safe here because THIS function is the only place order rows get
// created. All pricing is re-derived from the database; nothing sent by
// the browser is trusted except product IDs, sizes, and quantities.
//
// Deploy:   supabase functions deploy create-razorpay-order
// Secrets:  supabase secrets set RAZORPAY_KEY_ID=xxx RAZORPAY_KEY_SECRET=xxx
// (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.)

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CartItemInput {
    product_id: string;
    size: string;
    quantity: number;
}

interface RequestBody {
    items: CartItemInput[];
    shipping_address: Record<string, unknown>;
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

        // Client bound to the caller's JWT — used ONLY to identify who is
        // asking. It respects RLS, so this can't be used to read other users' data.
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
        if (!body.items || body.items.length === 0) {
            return json({ error: 'Cart is empty' }, 400);
        }
        if (!body.shipping_address) {
            return json({ error: 'Shipping address is required' }, 400);
        }

        // Service-role client — bypasses RLS. Only used for trusted server logic below.
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        // --- Re-fetch REAL product prices/stock from the DB. Ignore any price the client sent. ---
        const productIds = [...new Set(body.items.map((i) => i.product_id))];
        const { data: products, error: productsError } = await supabaseAdmin
            .from('products')
            .select('id, price, stock, is_active')
            .in('id', productIds);

        if (productsError) throw productsError;

        const productMap = new Map((products ?? []).map((p) => [p.id, p]));
        let subtotal = 0;
        const orderItemsToInsert: {
            product_id: string;
            quantity: number;
            price: number;
            size: string;
        }[] = [];

        for (const item of body.items) {
            const product = productMap.get(item.product_id);
            if (!product) {
                return json({ error: `Product ${item.product_id} not found` }, 400);
            }
            if (!product.is_active) {
                return json({ error: `Product ${item.product_id} is not available` }, 400);
            }
            const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
            if (quantity > product.stock) {
                return json(
                    { error: `Not enough stock for product ${item.product_id}` },
                    400
                );
            }
            const realPrice = Number(product.price);
            subtotal += realPrice * quantity;
            orderItemsToInsert.push({
                product_id: item.product_id,
                quantity,
                price: realPrice, // <-- authoritative price, never the client's
                size: item.size,
            });
        }

        // --- Fetch store settings for shipping/tax/discount rules ---
        const { data: settings } = await supabaseAdmin
            .from('store_settings')
            .select('*')
            .limit(1)
            .maybeSingle();

        const shippingFee = Number(settings?.shipping_fee ?? 50);
        const freeShippingThreshold = Number(settings?.free_shipping_threshold ?? 999);
        const freeShippingEnabled = settings?.free_shipping_enabled ?? true;
        const taxEnabled = settings?.tax_enabled ?? false;
        const taxPercentage = Number(settings?.tax_percentage ?? 0);
        const globalOfferEnabled = settings?.global_offer_enabled ?? false;
        const globalOfferPct = Number(settings?.default_offer_percentage ?? 0);
        const currencyCode = (settings?.currency_code as string || 'INR').toUpperCase();

        const discountAmount = globalOfferEnabled
            ? +(subtotal * (globalOfferPct / 100)).toFixed(2)
            : 0;
        const discountedSubtotal = subtotal - discountAmount;

        const shippingAmount =
            freeShippingEnabled && subtotal >= freeShippingThreshold ? 0 : shippingFee;

        const taxAmount = taxEnabled
            ? +(discountedSubtotal * (taxPercentage / 100)).toFixed(2)
            : 0;

        const total = +(discountedSubtotal + shippingAmount + taxAmount).toFixed(2);

        if (total <= 0) {
            return json({ error: 'Invalid order total' }, 400);
        }

        // --- Create the order row (pending, unpaid) ---
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                user_id: user.id,
                status: 'pending',
                payment_status: 'created',
                subtotal,
                shipping_amount: shippingAmount,
                tax_amount: taxAmount,
                discount_amount: discountAmount,
                total,
                shipping_address: body.shipping_address,
                payment_method: 'razorpay',
            })
            .select()
            .single();

        if (orderError) throw orderError;

        const { error: itemsError } = await supabaseAdmin.from('order_items').insert(
            orderItemsToInsert.map((i) => ({ ...i, order_id: order.id }))
        );

        if (itemsError) throw itemsError;

        // --- Create the Razorpay order server-side using the SECRET key ---
        const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
        const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

        if (!razorpayKeyId || !razorpayKeySecret) {
            // Clean up the partially created order
            await supabaseAdmin.from('orders').delete().eq('id', order.id);
            return json({ error: 'Razorpay credentials not configured on server' }, 500);
        }

        const basicAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);

        const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${basicAuth}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: Math.round(total * 100), // smallest currency unit (e.g. paise for INR)
                currency: currencyCode,
                receipt: order.id,
                notes: { db_order_id: order.id },
            }),
        });

        const rzpOrder = await rzpRes.json();
        if (!rzpRes.ok) {
            // Roll back the DB order so it doesn't sit around as a phantom order
            await supabaseAdmin.from('orders').delete().eq('id', order.id);
            return json({ error: 'Failed to create Razorpay order', details: rzpOrder }, 502);
        }

        await supabaseAdmin
            .from('orders')
            .update({ razorpay_order_id: rzpOrder.id })
            .eq('id', order.id);

        return json({
            db_order_id: order.id,
            razorpay_order_id: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            key_id: razorpayKeyId,
        });
    } catch (err) {
        console.error(err);
        return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
    }
});

function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}
