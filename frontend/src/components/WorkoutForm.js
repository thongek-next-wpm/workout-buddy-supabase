import { useState } from "react";
import { useWorkoutContext } from "../hooks/useWorkoutContext";
import { useAuthContext } from "../hooks/useAuthContext";
import { authorizedFetch } from "../utils/api";
import { CheckIcon, PlusIcon, SparklesIcon } from "./Icons";

export const WORKOUT_CATEGORIES = [
  "Strength",
  "Hypertrophy",
  "Cardio",
  "Bodyweight",
  "Mobility",
];

const QUICK_PRESETS = [
  { title: "Bench Press", category: "Strength", load: 60, sets: 3, reps: 8 },
  { title: "Back Squat", category: "Strength", load: 80, sets: 4, reps: 6 },
  { title: "Deadlift", category: "Strength", load: 100, sets: 3, reps: 5 },
  { title: "Pull-ups", category: "Bodyweight", load: 0, sets: 3, reps: 10 },
];

const WorkoutForm = () => {
  const { user, dispatch: authDispatch } = useAuthContext();
  const { dispatch } = useWorkoutContext();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Strength");
  const [load, setLoad] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState(null);
  const [emptyFields, setEmptyFields] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const applyPreset = (preset) => {
    setTitle(preset.title);
    setCategory(preset.category);
    setLoad(String(preset.load));
    setSets(String(preset.sets));
    setReps(String(preset.reps));
    setError(null);
    setEmptyFields([]);
  };

  const previewVolume =
    load !== "" && reps !== "" && sets !== ""
      ? Math.round((Number(load) || 0) * (Number(sets) || 1) * (Number(reps) || 0))
      : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg("");

    try {
      const workout = {
        title,
        category,
        load: load === "" ? "" : Number(load),
        sets: sets === "" ? "" : Number(sets),
        reps: reps === "" ? "" : Number(reps),
        notes,
      };

      const response = await authorizedFetch(
        "/api/workouts",
        {
          method: "POST",
          body: JSON.stringify(workout),
        },
        user,
        authDispatch
      );

      const json = await response.json();

      if (!response.ok) {
        setError(json.error || "Could not add workout");
        setEmptyFields(json.emptyFields || []);
        setIsSubmitting(false);
        return;
      }

      setTitle("");
      setCategory("Strength");
      setLoad("");
      setSets("3");
      setReps("");
      setNotes("");
      setError(null);
      setEmptyFields([]);
      dispatch({ type: "CREATE_WORKOUT", payload: json });
      setSuccessMsg(`Saved "${json.title}"`);
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch {
      setError("Network error while saving workout");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside className="form-panel">
      <form className="workout-form card" onSubmit={handleSubmit}>
        <div className="form-header">
          <div>
            <h3>Log New Workout</h3>
            <p className="muted-text">
              Synced directly to your Supabase PostgreSQL table
            </p>
          </div>
          <span className="pill pill-accent">
            <SparklesIcon width={14} height={14} />
            Quick Log
          </span>
        </div>

        <div className="presets-block">
          <span className="field-label">Quick Presets</span>
          <div className="preset-chips">
            {QUICK_PRESETS.map((preset) => (
              <button
                key={preset.title}
                type="button"
                className="preset-chip"
                onClick={() => applyPreset(preset)}
              >
                + {preset.title}
              </button>
            ))}
          </div>
        </div>

        <div className="field-group">
          <label htmlFor="workout-title">Exercise Title</label>
          <input
            id="workout-title"
            type="text"
            placeholder="e.g. Incline Dumbbell Press"
            onChange={(e) => setTitle(e.target.value)}
            value={title}
            className={emptyFields.includes("title") ? "input-error" : ""}
          />
        </div>

        <div className="field-group">
          <label htmlFor="workout-category">Category</label>
          <div className="category-selector" role="group" aria-label="Category">
            {WORKOUT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`cat-btn ${category === cat ? "selected" : ""}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="form-metrics-row">
          <div className="field-group">
            <label htmlFor="workout-load">
              Load (kg) <span className="hint-inline">0 = BW</span>
            </label>
            <input
              id="workout-load"
              type="number"
              min="0"
              step="0.5"
              placeholder="60"
              onChange={(e) => setLoad(e.target.value)}
              value={load}
              className={emptyFields.includes("load") ? "input-error" : ""}
            />
          </div>

          <div className="field-group">
            <label htmlFor="workout-sets">Sets</label>
            <input
              id="workout-sets"
              type="number"
              min="1"
              step="1"
              placeholder="3"
              onChange={(e) => setSets(e.target.value)}
              value={sets}
              className={emptyFields.includes("sets") ? "input-error" : ""}
            />
          </div>

          <div className="field-group">
            <label htmlFor="workout-reps">Reps</label>
            <input
              id="workout-reps"
              type="number"
              min="1"
              step="1"
              placeholder="10"
              onChange={(e) => setReps(e.target.value)}
              value={reps}
              className={emptyFields.includes("reps") ? "input-error" : ""}
            />
          </div>
        </div>

        <div className="field-group">
          <label htmlFor="workout-notes">Notes (optional)</label>
          <textarea
            id="workout-notes"
            rows={2}
            placeholder="RPE, tempo, or form cues..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {previewVolume !== null && (
          <div className="volume-preview">
            <span>Estimated Volume</span>
            <strong className="mono">{previewVolume.toLocaleString()} kg</strong>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={isSubmitting}
        >
          <PlusIcon width={18} height={18} />
          <span>{isSubmitting ? "Saving..." : "Add Workout"}</span>
        </button>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="alert alert-success" role="status">
            <CheckIcon width={16} height={16} />
            <span>{successMsg}</span>
          </div>
        )}
      </form>
    </aside>
  );
};

export default WorkoutForm;
