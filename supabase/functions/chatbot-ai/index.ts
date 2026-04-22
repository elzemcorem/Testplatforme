import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MCP_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_available_vehicles",
      description: "Récupère la liste des véhicules disponibles dans la plateforme",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["available", "unavailable", "all"],
            description: "Filtrer par statut",
          },
          limit: {
            type: "number",
            description: "Nombre max de résultats",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_user_reservations",
      description: "Récupère les réservations de l'utilisateur connecté",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["confirmed", "pending", "cancelled", "all"],
            description: "Filtrer par statut",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_user_profile",
      description: "Récupère le profil de l'utilisateur connecté",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_platform_stats",
      description: "Récupère des statistiques globales de la plateforme",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_chat_history",
      description: "Récupère l'historique des conversations du chatbot pour l'utilisateur",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Nombre de messages à récupérer" },
        },
        required: [],
      },
    },
  },
];

async function executeMcpTool(
  toolName: string,
  args: Record<string, unknown>,
  userId: string,
  supabase: ReturnType<typeof createClient>,
) {
  switch (toolName) {
    case "get_available_vehicles": {
      const status = (args.status as string) || "available";
      const limit = (args.limit as number) || 10;
      let query = supabase.from("vehicles").select("id, name, type, status").limit(limit);
      if (status !== "all") query = query.eq("status", status);
      const { data, error } = await query;
      if (error) return { error: error.message };
      return { vehicles: data || [], count: (data || []).length };
    }

    case "get_user_reservations": {
      const status = (args.status as string) || "confirmed";
      let query = supabase
        .from("reservations")
        .select("id, date, status, vehicles(name, type)")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(10);
      if (status !== "all") query = query.eq("status", status);
      const { data, error } = await query;
      if (error) return { error: error.message };
      return { reservations: data || [], count: (data || []).length };
    }

    case "get_user_profile": {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) return { error: error.message };
      return { profile: data };
    }

    case "get_platform_stats": {
      const [vehicles, reservations] = await Promise.all([
        supabase.from("vehicles").select("id, status"),
        supabase.from("reservations").select("id, status").eq("user_id", userId),
      ]);
      return {
        total_vehicles: vehicles.data?.length || 0,
        available_vehicles:
          vehicles.data?.filter((v: { status: string }) => v.status === "available").length || 0,
        my_reservations: reservations.data?.length || 0,
        my_active_reservations:
          reservations.data?.filter((r: { status: string }) => r.status === "confirmed").length || 0,
      };
    }

    case "get_chat_history": {
      const limit = (args.limit as number) || 20;
      const { data, error } = await supabase
        .from("chat_history")
        .select("role, content, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) return { error: error.message };
      return { history: (data || []).reverse() };
    }

    default:
      return { error: `Outil inconnu: ${toolName}` };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENROUTER_API_KEY) {
      return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY manquante" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { message, conversationHistory = [] } = await req.json();
    if (!message) {
      return new Response(JSON.stringify({ error: "Message requis" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    await supabase.from("chat_history").insert({
      user_id: user.id,
      role: "user",
      content: message,
      model: DEFAULT_MODEL,
    });

    const messages = [
      {
        role: "system",
        content:
          `Tu es un assistant intelligent pour une plateforme de gestion de réservations de véhicules. Tu parles français. Tu aides pour les réservations, les véhicules disponibles, les statistiques, les rapports, le profil utilisateur et la navigation dans l'application. Tu as accès à des outils MCP reliés à la base Supabase en temps réel. Utilise les outils quand c'est utile pour donner des réponses exactes, courtes, utiles et professionnelles. L'utilisateur actuel a l'ID: ${user.id}`,
      },
      ...conversationHistory.slice(-10),
      { role: "user", content: message },
    ];

    let openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://testplatforme.app",
        "X-Title": "TestPlatforme Chatbot",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages,
        tools: MCP_TOOLS,
        tool_choice: "auto",
        max_tokens: 1024,
      }),
    });

    let llmData = await openRouterResponse.json();

    if (llmData.choices?.[0]?.message?.tool_calls?.length > 0) {
      const toolCalls = llmData.choices[0].message.tool_calls;
      const toolCallMessages = [...messages, llmData.choices[0].message];

      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments || "{}");
        const toolResult = await executeMcpTool(toolName, toolArgs, user.id, supabase);

        toolCallMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult),
        });
      }

      openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://testplatforme.app",
          "X-Title": "TestPlatforme Chatbot",
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages: toolCallMessages,
          max_tokens: 1024,
        }),
      });

      llmData = await openRouterResponse.json();
    }

    const assistantMessage =
      llmData.choices?.[0]?.message?.content || "Désolé, je n'ai pas pu générer une réponse.";

    await supabase.from("chat_history").insert({
      user_id: user.id,
      role: "assistant",
      content: assistantMessage,
      model: llmData.model || DEFAULT_MODEL,
    });

    return new Response(
      JSON.stringify({
        response: assistantMessage,
        model: llmData.model || DEFAULT_MODEL,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  } catch (err) {
    console.error("Chatbot error:", err);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur", details: String(err) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
});
