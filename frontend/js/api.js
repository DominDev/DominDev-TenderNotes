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

function isMissingAvatarImageColumn(error) {
  return error?.code === "PGRST204" && error.message?.includes("avatar_image");
}

function withoutAvatarImage(payload) {
  const nextPayload = { ...payload };
  delete nextPayload.avatar_image;
  return nextPayload;
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
  const row = {
    ...payload,
    owner_user_id: user.id,
  };
  const { error } = await client
    .from("children")
    .insert(row);

  if (error) {
    if (!isMissingAvatarImageColumn(error)) {
      throw error;
    }

    const { error: retryError } = await client
      .from("children")
      .insert(withoutAvatarImage(row));

    if (retryError) {
      throw retryError;
    }
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
  let response = await client
    .from("children")
    .update(payload)
    .eq("id", childId)
    .select()
    .single();

  if (isMissingAvatarImageColumn(response.error)) {
    response = await client
      .from("children")
      .update(withoutAvatarImage(payload))
      .eq("id", childId)
      .select()
      .single();
  }

  if (response.error) {
    throw response.error;
  }

  return response.data;
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
