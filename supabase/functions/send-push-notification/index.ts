// Example Supabase Edge Function to send push notifications
// This is triggered when a notification is created in the database

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as webpush from 'https://deno.land/x/webpush@0.0.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPBASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPBASE_SERVICE_ROLE_KEY')!;
    const vapidPrivateKey = Deno.env.get('SUPBASE_VAPID_PRIVATE_KEY')!;
    const vapidPublicKey = Deno.env.get('VITE_VAPID_PUBLIC_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get the notification from the request body
    const { notification } = await req.json();

    if (!notification || !notification.user_id) {
      return new Response(
        JSON.stringify({ error: 'Notification and user_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', notification.user_id);

    if (subError || !subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No push subscriptions found for user' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send push notification to all user's devices
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        const payload = JSON.stringify({
          title: 'Home Hub Manager',
          body: notification.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: notification.id,
          data: {
            url: notification.related_type 
              ? `/${notification.related_type}s/${notification.related_id}`
              : '/notifications',
            notificationId: notification.id,
          },
        });

        await webpush.sendNotification(
          pushSubscription,
          payload,
          {
            vapidDetails: {
              subject: 'mailto:your-email@example.com', // Change this to your email
              publicKey: vapidPublicKey,
              privateKey: vapidPrivateKey,
            },
          }
        );
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return new Response(
      JSON.stringify({
        success: true,
        sent: successful,
        failed,
        total: subscriptions.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error sending push notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

