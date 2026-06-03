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
  const user = await requireUser();
  const { data, error } = await client
    .from("children")
    .select("*")
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  const childIds = (data ?? []).map((child) => child.id);
  if (!childIds.length) {
    return [];
  }

  const { data: memberships, error: membershipError } = await client
    .from("child_members")
    .select("child_id, role")
    .eq("user_id", user.id)
    .in("child_id", childIds);

  if (membershipError) {
    throw membershipError;
  }

  const roleByChildId = new Map((memberships ?? []).map((membership) => [membership.child_id, membership.role]));

  return (data ?? [])
    .filter((child) => roleByChildId.has(child.id))
    .map((child) => ({
      ...child,
      member_role: roleByChildId.get(child.id),
    }));
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

export async function loadChildMembers(childId) {
  const client = requireClient();
  const { data, error } = await client
    .from("child_members")
    .select("child_id,user_id,role,member_email,member_display_name,created_at,updated_at")
    .eq("child_id", childId)
    .order("role", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function loadChildInvitations(childId) {
  const client = requireClient();
  const { data, error } = await client
    .from("child_invitations")
    .select("id,child_id,email,role,status,created_at,updated_at")
    .eq("child_id", childId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function loadMyInvitations() {
  const client = requireClient();
  const { data, error } = await client
    .from("child_invitations")
    .select("id,child_id,email,role,status,created_at,children(display_name,avatar_color,avatar_image,birth_month,age_band)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function inviteChildMember(childId, email, role) {
  const client = requireClient();
  const { data, error } = await client
    .rpc("invite_child_member", {
      p_child_id: childId,
      p_email: email,
      p_role: role,
    });

  if (error) {
    throw error;
  }

  return data;
}

export async function acceptChildInvitation(invitationId) {
  const client = requireClient();
  const { data, error } = await client
    .rpc("accept_child_invitation", {
      p_invitation_id: invitationId,
    });

  if (error) {
    throw error;
  }

  return data;
}

export async function declineChildInvitation(invitationId) {
  const client = requireClient();
  const { data, error } = await client
    .rpc("decline_child_invitation", {
      p_invitation_id: invitationId,
    });

  if (error) {
    throw error;
  }

  return data;
}

export async function cancelChildInvitation(invitationId) {
  const client = requireClient();
  const { data, error } = await client
    .rpc("cancel_child_invitation", {
      p_invitation_id: invitationId,
    });

  if (error) {
    throw error;
  }

  return data;
}

export async function updateChildMemberRole(childId, userId, role) {
  const client = requireClient();
  const { data, error } = await client
    .rpc("update_child_member_role", {
      p_child_id: childId,
      p_user_id: userId,
      p_role: role,
    });

  if (error) {
    throw error;
  }

  return data;
}

export async function removeChildMember(childId, userId) {
  const client = requireClient();
  const { data, error } = await client
    .rpc("remove_child_member", {
      p_child_id: childId,
      p_user_id: userId,
    });

  if (error) {
    throw error;
  }

  return data;
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
