import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TWILIO_MOCK = true;

serve(async (req) => {
  try {
    const payload = await req.json();
    const { type, record } = payload;
    
    // We only care about new citations
    if (type !== 'INSERT' || !record) {
      return new Response("Not an insert event", { status: 200 });
    }

    const { citation_number, plate_number, amount, status } = record;

    if (status !== 'pending') {
      return new Response("Citation is not pending", { status: 200 });
    }

    // Mock logic to lookup owner's phone number based on plate_number
    // In production this would query LTO (Land Transportation Office) API
    const ownerPhone = "+639171234567"; // Mock number
    
    const message = `QC LGU Notice: Vehicle ${plate_number} has been cited for a traffic violation. Amount due: PHP ${amount}. Reference: ${citation_number}. Pay or contest online at https://qc-flow-guardian.local/lookup`;
    
    if (TWILIO_MOCK) {
      console.log(`[MOCK SMS] To: ${ownerPhone} | Message: ${message}`);
    } else {
      // Production Twilio Integration
      // const twilioRes = await fetch("https://api.twilio.com/2010-04-01/Accounts/.../Messages.json", { ... })
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notification queued", delivered_to: ownerPhone }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
