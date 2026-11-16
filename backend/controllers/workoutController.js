const validator = require("validator");

const ALLOWED_CATEGORIES = [
  "Strength",
  "Hypertrophy",
  "Cardio",
  "Bodyweight",
  "Mobility",
];

/**
 * Validates and normalizes workout payload fields for both create and update operations.
 */
const validateWorkoutPayload = (body = {}, { isPartial = false } = {}) => {
  const emptyFields = [];
  const errors = [];
  const data = {};

  const hasTitle = Object.prototype.hasOwnProperty.call(body, "title");
  if (!isPartial || hasTitle) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      emptyFields.push("title");
    } else {
      data.title = title;
    }
  }

  const hasLoad = Object.prototype.hasOwnProperty.call(body, "load");
  if (!isPartial || hasLoad) {
    const rawLoad = body.load;
    if (rawLoad === undefined || rawLoad === null || rawLoad === "") {
      emptyFields.push("load");
    } else {
      const numericLoad = Number(rawLoad);
      if (!Number.isFinite(numericLoad) || numericLoad < 0) {
        errors.push("Load must be a non-negative number");
      } else {
        data.load = numericLoad;
      }
    }
  }

  const hasReps = Object.prototype.hasOwnProperty.call(body, "reps");
  if (!isPartial || hasReps) {
    const rawReps = body.reps;
    if (rawReps === undefined || rawReps === null || rawReps === "") {
      emptyFields.push("reps");
    } else {
      const numericReps = Number(rawReps);
      if (!Number.isInteger(numericReps) || numericReps <= 0) {
        errors.push("Reps must be a whole number greater than 0");
      } else {
        data.reps = numericReps;
      }
    }
  }

  const hasSets = Object.prototype.hasOwnProperty.call(body, "sets");
  if (!isPartial || hasSets) {
    const rawSets = body.sets;
    if (rawSets === undefined || rawSets === null || rawSets === "") {
      if (!isPartial) {
        data.sets = 1;
      } else {
        emptyFields.push("sets");
      }
    } else {
      const numericSets = Number(rawSets);
      if (!Number.isInteger(numericSets) || numericSets <= 0) {
        errors.push("Sets must be a whole number greater than 0");
      } else {
        data.sets = numericSets;
      }
    }
  }

  const hasCategory = Object.prototype.hasOwnProperty.call(body, "category");
  if (!isPartial || hasCategory) {
    const category =
      typeof body.category === "string" && body.category.trim()
        ? body.category.trim()
        : "Strength";
    if (!ALLOWED_CATEGORIES.includes(category)) {
      errors.push(
        `Category must be one of: ${ALLOWED_CATEGORIES.join(", ")}`
      );
    } else {
      data.category = category;
    }
  }

  const hasNotes = Object.prototype.hasOwnProperty.call(body, "notes");
  if (!isPartial || hasNotes) {
    data.notes = typeof body.notes === "string" ? body.notes.trim() : "";
  }

  return { data, emptyFields, errors };
};

// Get all workouts for the authenticated user
const getWorkouts = async (req, res) => {
  const { data, error } = await req.supabase
    .from("workouts")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json(data || []);
};

// Get a single workout by UUID
const getWorkout = async (req, res) => {
  const { id } = req.params;

  if (!validator.isUUID(id)) {
    return res.status(404).json({ error: "No such workout" });
  }

  const { data, error } = await req.supabase
    .from("workouts")
    .select("*")
    .eq("id", id)
    .eq("user_id", req.user.id)
    .maybeSingle();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  if (!data) {
    return res.status(404).json({ error: "No such workout" });
  }

  return res.status(200).json(data);
};

// Create a new workout
const createWorkout = async (req, res) => {
  const { data: payload, emptyFields, errors } = validateWorkoutPayload(
    req.body,
    { isPartial: false }
  );

  if (emptyFields.length > 0) {
    return res.status(400).json({
      error: "Please fill in all required fields",
      emptyFields,
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0], emptyFields: [] });
  }

  const { data, error } = await req.supabase
    .from("workouts")
    .insert({
      ...payload,
      user_id: req.user.id,
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(201).json(data);
};

// Delete a workout by UUID
const deleteWorkout = async (req, res) => {
  const { id } = req.params;

  if (!validator.isUUID(id)) {
    return res.status(404).json({ error: "No such workout" });
  }

  const { data, error } = await req.supabase
    .from("workouts")
    .delete()
    .eq("id", id)
    .eq("user_id", req.user.id)
    .select()
    .maybeSingle();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  if (!data) {
    return res.status(404).json({ error: "No such workout" });
  }

  return res.status(200).json(data);
};

// Update a workout by UUID
const updateWorkout = async (req, res) => {
  const { id } = req.params;

  if (!validator.isUUID(id)) {
    return res.status(404).json({ error: "No such workout" });
  }

  const { data: updates, emptyFields, errors } = validateWorkoutPayload(
    req.body,
    { isPartial: true }
  );

  if (emptyFields.length > 0) {
    return res.status(400).json({
      error: "Fields cannot be empty",
      emptyFields,
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0], emptyFields: [] });
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No valid fields provided to update" });
  }

  const { data, error } = await req.supabase
    .from("workouts")
    .update(updates)
    .eq("id", id)
    .eq("user_id", req.user.id)
    .select()
    .maybeSingle();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  if (!data) {
    return res.status(404).json({ error: "No such workout" });
  }

  return res.status(200).json(data);
};

module.exports = {
  ALLOWED_CATEGORIES,
  validateWorkoutPayload,
  getWorkouts,
  getWorkout,
  createWorkout,
  deleteWorkout,
  updateWorkout,
};
