// Supabase Edge Functions run on Deno. The Angular TypeScript server in VS Code
// cannot resolve Deno's npm: imports unless the Deno extension owns this file.
// @ts-ignore
import { createClient } from 'npm:@supabase/supabase-js@2';

declare const Deno: {
  serve(handler: (req: Request) => Response | Promise<Response>): void;
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return json({ ok: true });
  }

  try {
    const { contactId } = await req.json();

    if (!contactId) {
      return json({ error: 'Missing contactId' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: 'Missing Supabase function environment variables' }, 500);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: contact, error: contactError } = await adminClient
      .from('demoDB')
      .select('id, auth_user_id')
      .eq('id', contactId)
      .maybeSingle();

    if (contactError) {
      return json({ error: contactError.message }, 500);
    }

    if (!contact) {
      return json({ error: 'Contact not found' }, 404);
    }

    if (!contact.auth_user_id) {
      const { error: deleteContactError } = await adminClient
        .from('demoDB')
        .delete()
        .eq('id', contact.id);

      if (deleteContactError) {
        return json({ error: deleteContactError.message }, 500);
      }

      return json({ success: true });
    }

    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(contact.auth_user_id);

    if (deleteUserError) {
      return json({ error: deleteUserError.message }, 500);
    }

    await adminClient.from('demoDB').delete().eq('id', contact.id);

    return json({ success: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}
