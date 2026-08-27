import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {

    const body = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let rows = Array.isArray(body) ? body : [body];


    // Remove duplicate cluster_name inside the payload
    // Keeps the LAST occurrence
    const uniqueRows = [
      ...new Map(
        rows.map(row => [
          row.cluster_name,
          row
        ])
      ).values()
    ];


    const { error } = await supabase
      .from("clusters")
      .upsert(uniqueRows, {
        onConflict: "cluster_name",
        ignoreDuplicates: false,
      });


    if (error) {

      return new Response(
        JSON.stringify(error),
        {
          status: 500,
          headers:{
            "Content-Type":"application/json"
          }
        }
      );

    }


    return new Response(
      JSON.stringify({
        success:true,
        received:rows.length,
        processed:uniqueRows.length,
        duplicatesRemoved:
          rows.length - uniqueRows.length
      }),
      {
        headers:{
          "Content-Type":"application/json"
        }
      }
    );


  } catch(err){

    return new Response(
      JSON.stringify({
        error:String(err)
      }),
      {
        status:500
      }
    );

  }
});