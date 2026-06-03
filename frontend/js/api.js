import { supabase } from "./supabaseClient.js";

function requireClient() {
  if (!supabase) {
    throw new Error("Brakuje konfiguracji Supabase w frontend/js/config.js.");
  }
  return supabase;
}

async function requireUser() {
  const client = requireClient();
  const { data: userData, error: userError } = await client.auth.getUser();

  if (userError || !userData.user) {
    throw userError ?? new Error("Brak aktywnej sesji.");
  }

  return userData.user;
}

export async function loadChildren() {
  const client = requireClient();
  const { data, error } = await client
    .from("children")
    .select("*")
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createChild(payload) {
  const client = requireClient();
  const user = await requireUser();
  const { error } = await client
    .from("children")
    .insert({
      ...payload,
      owner_user_id: user.id,
    });

  if (error) {
    throw error;
  }

  const { data, error: loadError } = await client
    .from("children")
    .select("*")
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (loadError) {
    throw loadError;
  }

  return data;
}

export async function updateChild(childId, payload) {
  const client = requireClient();
  const { data, error } = await client
    .from("children")
    .update(payload)
    .eq("id", childId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function archiveChild(childId) {
  return updateChild(childId, { archived_at: new Date().toISOString() });
}

export async function loadObservations(childId) {
  const client = requireClient();
  const { data, error } = await client
    .from("observations")
    .select("*")
    .eq("child_id", childId)
    .order("day_number", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function saveObservation(childId, dayNumber, payload) {
  const client = requireClient();
  const user = await requireUser();

  const row = {
    ...payload,
    user_id: user.id,
    child_id: childId,
    day_number: dayNumber,
  };

  const { data, error } = await client
    .from("observations")
    .upsert(row, { onConflict: "child_id,day_number" })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function loadSummaryAnswers(childId) {
  const client = requireClient();
  const { data, error } = await client
    .from("summary_answers")
    .select("*")
    .eq("child_id", childId)
    .order("question_key", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function saveSummaryAnswer(childId, questionKey, payload) {
  const client = requireClient();
  const user = await requireUser();

  const { data, error } = await client
    .from("summary_answers")
    .upsert(
      {
        ...payload,
        user_id: user.id,
        child_id: childId,
        question_key: questionKey,
      },
      { onConflict: "child_id,question_key" },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
