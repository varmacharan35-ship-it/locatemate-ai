import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const PredictInput = z.object({ caseId: z.string().uuid() });

type PredictedLocation = {
  name: string;
  radius_km?: number;
  confidence: number;
  reasoning: string;
};

export const generatePrediction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PredictInput.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured for this project.");

    const { supabase, userId } = context;

    const { data: caseRow, error: caseError } = await supabase
      .from("cases")
      .select("*")
      .eq("id", data.caseId)
      .maybeSingle();
    if (caseError) throw new Error(caseError.message);
    if (!caseRow) throw new Error("Case not found.");

    const { data: sightings } = await supabase
      .from("sightings")
      .select("location, occurred_at, reported_by, confidence, notes")
      .eq("case_id", data.caseId)
      .order("occurred_at", { ascending: false });

    const dossier = {
      name: caseRow.full_name,
      age: caseRow.age,
      gender: caseRow.gender,
      height_cm: caseRow.height_cm,
      last_seen_location: caseRow.last_seen_location,
      last_seen_at: caseRow.last_seen_at,
      clothing: caseRow.clothing,
      vehicle: caseRow.vehicle,
      medical_notes: caseRow.medical_notes,
      description: caseRow.description,
      investigator_notes: caseRow.investigator_notes,
      priority: caseRow.priority,
      sightings: sightings ?? [],
    };

    const model = "google/gemini-3.8-flash";
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are an investigative analyst supporting licensed missing-person investigators. " +
              "From the case dossier, infer the most probable search areas using travel patterns, last known position, reported sightings, vulnerability factors and time elapsed. " +
              "Be specific about place types and directions of travel, state uncertainty honestly, and never fabricate exact addresses or personal data. " +
              "Respond ONLY with JSON matching: {\"summary\": string, \"risk_level\": \"low\"|\"moderate\"|\"high\"|\"critical\", \"locations\": [{\"name\": string, \"radius_km\": number, \"confidence\": number, \"reasoning\": string}], \"next_steps\": [string]}. " +
              "Give 3-5 locations, confidence as a 0-100 number, and 4-6 concrete next steps.",
          },
          { role: "user", content: JSON.stringify(dossier) },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("AI is busy right now — try again in a moment.");
      if (res.status === 402)
        throw new Error("AI credits are exhausted. Add credits to keep generating analyses.");
      throw new Error(`AI analysis failed (${res.status}): ${body.slice(0, 300)}`);
    }

    const payload = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = payload.choices?.[0]?.message?.content ?? "";
    let parsed: {
      summary?: string;
      risk_level?: string;
      locations?: PredictedLocation[];
      next_steps?: string[];
    };
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("The AI returned an unreadable analysis. Try again.");
      parsed = JSON.parse(match[0]);
    }

    const { data: inserted, error: insertError } = await supabase
      .from("predictions")
      .insert({
        case_id: data.caseId,
        user_id: userId,
        summary: parsed.summary ?? "No summary produced.",
        risk_level: parsed.risk_level ?? null,
        locations: (parsed.locations ?? []).slice(0, 6),
        next_steps: (parsed.next_steps ?? []).slice(0, 8),
        model,
      })
      .select()
      .single();
    if (insertError) throw new Error(insertError.message);

    return inserted;
  });
