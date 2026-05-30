import { supabase } from "./supabaseClient.js";

function requireClient() {
  if (!supabase) {
    throw new Error("Brakuje konfiguracji Supabase w frontend/js/config.js.");
  }
  return supabase;
}

export async function loadObservations() {
  const client = requireClient();
  const { data, error } = await client
    .from("observations")
    .select("*")
    .order("day_number", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function saveObservation(dayNumber, payload) {
  const client = requireClient();
  const { data: userData, error: userError } = await client.auth.getUser();

  if (userError || !userData.user) {
    throw userError ?? new Error("Brak aktywnej sesji.");
  }

  const row = {
    ...payload,
    user_id: userData.user.id,
    day_number: dayNumber,
  };

  const { data, error } = await client
    .from("observations")
    .upsert(row, { onConflict: "user_id,day_number" })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function loadSummaryAnswers() {
  const client = requireClient();
  const { data, error } = await client
    .from("summary_answers")
    .select("*")
    .order("question_key", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function saveSummaryAnswer(questionKey, payload) {
  const client = requireClient();
  const { data: userData, error: userError } = await client.auth.getUser();

  if (userError || !userData.user) {
    throw userError ?? new Error("Brak aktywnej sesji.");
  }

  const { data, error } = await client
    .from("summary_answers")
    .upsert(
      {
        ...payload,
        user_id: userData.user.id,
        question_key: questionKey,
      },
      { onConflict: "user_id,question_key" },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

