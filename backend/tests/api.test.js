const test = require("node:test");
const assert = require("node:assert/strict");

const {
  validateWorkoutPayload,
  createWorkout,
  getWorkouts,
  updateWorkout,
  deleteWorkout,
} = require("../controllers/workoutController");
const { createRequireAuth } = require("../middleware/requireAuth");
const { createUserController } = require("../controllers/userController");

const createMockRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
};

test("validateWorkoutPayload accepts bodyweight workouts with load = 0", () => {
  const result = validateWorkoutPayload({
    title: "  Pull-ups ",
    load: 0,
    reps: 12,
    sets: 3,
    category: "Bodyweight",
    notes: "Strict form",
  });

  assert.deepEqual(result.emptyFields, []);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.data, {
    title: "Pull-ups",
    load: 0,
    reps: 12,
    sets: 3,
    category: "Bodyweight",
    notes: "Strict form",
  });
});

test("validateWorkoutPayload flags missing required fields", () => {
  const result = validateWorkoutPayload({ title: "", load: "", reps: "" });
  assert.deepEqual(result.emptyFields, ["title", "load", "reps"]);
});

test("validateWorkoutPayload validates numeric constraints and category", () => {
  const result = validateWorkoutPayload({
    title: "Squat",
    load: -10,
    reps: 0,
    category: "Unknown",
  });
  assert.equal(result.errors.length, 3);
});

test("createWorkout inserts into Supabase with user_id", async () => {
  let insertedRow = null;
  const mockSupabase = {
    from(table) {
      assert.equal(table, "workouts");
      return {
        insert(row) {
          insertedRow = row;
          return {
            select() {
              return {
                async single() {
                  return {
                    data: { id: "11111111-1111-4111-8111-111111111111", ...row },
                    error: null,
                  };
                },
              };
            },
          };
        },
      };
    },
  };

  const req = {
    user: { id: "user-123" },
    supabase: mockSupabase,
    body: { title: "Bench Press", load: 80, reps: 8, sets: 4 },
  };
  const res = createMockRes();

  await createWorkout(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(insertedRow.user_id, "user-123");
  assert.equal(insertedRow.sets, 4);
  assert.equal(insertedRow.category, "Strength");
  assert.equal(res.body.title, "Bench Press");
});

test("getWorkouts orders by created_at descending for current user", async () => {
  const sampleRows = [
    { id: "11111111-1111-4111-8111-111111111111", title: "Deadlift", load: 120, reps: 5 },
  ];
  const mockSupabase = {
    from() {
      return {
        select() {
          return {
            eq(col, val) {
              assert.equal(col, "user_id");
              assert.equal(val, "user-123");
              return {
                async order(colName, opts) {
                  assert.equal(colName, "created_at");
                  assert.equal(opts.ascending, false);
                  return { data: sampleRows, error: null };
                },
              };
            },
          };
        },
      };
    },
  };

  const req = { user: { id: "user-123" }, supabase: mockSupabase };
  const res = createMockRes();

  await getWorkouts(req, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, sampleRows);
});

test("updateWorkout rejects invalid UUID", async () => {
  const req = {
    params: { id: "not-a-uuid" },
    user: { id: "user-123" },
    supabase: {},
    body: { load: 90 },
  };
  const res = createMockRes();

  await updateWorkout(req, res);
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.error, "No such workout");
});

test("deleteWorkout deletes matching user workout", async () => {
  const workoutId = "22222222-2222-4222-8222-222222222222";
  const mockSupabase = {
    from() {
      return {
        delete() {
          return {
            eq(col1, val1) {
              assert.equal(col1, "id");
              assert.equal(val1, workoutId);
              return {
                eq(col2, val2) {
                  assert.equal(col2, "user_id");
                  assert.equal(val2, "user-123");
                  return {
                    select() {
                      return {
                        async maybeSingle() {
                          return { data: { id: workoutId, title: "Row" }, error: null };
                        },
                      };
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  };

  const req = {
    params: { id: workoutId },
    user: { id: "user-123" },
    supabase: mockSupabase,
  };
  const res = createMockRes();

  await deleteWorkout(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.id, workoutId);
});

test("requireAuth validates Bearer token via Supabase auth.getUser", async () => {
  const middleware = createRequireAuth({
    isSupabaseConfigured: () => true,
    getSupabaseClient: () => ({
      auth: {
        async getUser(token) {
          if (token === "valid-jwt") {
            return { data: { user: { id: "user-abc", email: "a@b.com" } }, error: null };
          }
          return { data: { user: null }, error: { message: "Invalid JWT" } };
        },
      },
    }),
    createSupabaseUserClient: (token) => ({ scopedToken: token }),
  });

  const missingReq = { headers: {} };
  const missingRes = createMockRes();
  await middleware(missingReq, missingRes, () => {});
  assert.equal(missingRes.statusCode, 401);

  const validReq = { headers: { authorization: "Bearer valid-jwt" } };
  const validRes = createMockRes();
  let nextCalled = false;
  await middleware(validReq, validRes, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
  assert.equal(validReq.user.id, "user-abc");
  assert.equal(validReq.supabase.scopedToken, "valid-jwt");
});

test("userController validates signup email and password before calling Supabase", async () => {
  const controller = createUserController({
    isSupabaseConfigured: () => true,
    getSupabaseClient: () => {
      throw new Error("Should not call Supabase on invalid input");
    },
    getSupabaseAdminClient: () => null,
  });

  const badEmailRes = createMockRes();
  await controller.signupUser(
    { body: { email: "bad-email", password: "Password1" } },
    badEmailRes
  );
  assert.equal(badEmailRes.statusCode, 400);
  assert.equal(badEmailRes.body.error, "Email is not valid");

  const weakPassRes = createMockRes();
  await controller.signupUser(
    { body: { email: "fit@example.com", password: "weak" } },
    weakPassRes
  );
  assert.equal(weakPassRes.statusCode, 400);
  assert.match(weakPassRes.body.error, /at least 8 characters/i);
});

test("userController getPublicConfig returns only public URL and anon key", async () => {
  const controller = createUserController({
    isSupabaseConfigured: () => true,
    getSupabaseConfig: () => ({
      url: "https://example.supabase.co",
      anonKey: "sb_publishable_demo",
      serviceRoleKey: "sb_secret_should_never_leak",
    }),
  });

  const res = createMockRes();
  await controller.getPublicConfig({}, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    supabaseUrl: "https://example.supabase.co",
    supabaseAnonKey: "sb_publishable_demo",
  });
  assert.equal("serviceRoleKey" in res.body, false);
});

test("userController getMe extracts Google OAuth displayName and avatarUrl", async () => {
  const controller = createUserController();
  const res = createMockRes();

  await controller.getMe(
    {
      user: {
        id: "user-google-1",
        email: "athlete@gmail.com",
        app_metadata: { provider: "google" },
        user_metadata: {
          full_name: "Alex Runner",
          avatar_url: "https://lh3.googleusercontent.com/avatar.jpg",
        },
      },
    },
    res
  );

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    id: "user-google-1",
    email: "athlete@gmail.com",
    displayName: "Alex Runner",
    avatarUrl: "https://lh3.googleusercontent.com/avatar.jpg",
    provider: "google",
  });
});
