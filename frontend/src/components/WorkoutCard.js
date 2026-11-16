import { useState } from "react";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import { useWorkoutContext } from "../hooks/useWorkoutContext";
import { useAuthContext } from "../hooks/useAuthContext";
import { authorizedFetch } from "../utils/api";
import { WORKOUT_CATEGORIES } from "./WorkoutForm";
import { CheckIcon, CloseIcon, EditIcon, TrashIcon } from "./Icons";

const WorkoutCard = ({ workout }) => {
  const { user, dispatch: authDispatch } = useAuthContext();
  const { dispatch } = useWorkoutContext();

  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [cardError, setCardError] = useState(null);

  const [editTitle, setEditTitle] = useState(workout.title || "");
  const [editCategory, setEditCategory] = useState(
    workout.category || "Strength"
  );
  const [editLoad, setEditLoad] = useState(String(workout.load ?? 0));
  const [editSets, setEditSets] = useState(String(workout.sets ?? 1));
  const [editReps, setEditReps] = useState(String(workout.reps ?? 1));
  const [editNotes, setEditNotes] = useState(workout.notes || "");

  const workoutId = workout.id || workout._id;
  const createdDate = workout.created_at || workout.createdAt;
  const sets = Number(workout.sets) || 1;
  const reps = Number(workout.reps) || 0;
  const load = Number(workout.load) || 0;
  const totalVolume = Math.round(load * sets * reps);
  const category = workout.category || "Strength";

  const startEditing = () => {
    setEditTitle(workout.title || "");
    setEditCategory(workout.category || "Strength");
    setEditLoad(String(workout.load ?? 0));
    setEditSets(String(workout.sets ?? 1));
    setEditReps(String(workout.reps ?? 1));
    setEditNotes(workout.notes || "");
    setCardError(null);
    setConfirmDelete(false);
    setIsEditing(true);
  };

  const handleDelete = async () => {
    if (!user) return;
    setIsBusy(true);
    setCardError(null);

    try {
      const response = await authorizedFetch(
        `/api/workouts/${workoutId}`,
        { method: "DELETE" },
        user,
        authDispatch
      );
      const json = await response.json();

      if (!response.ok) {
        setCardError(json.error || "Failed to delete workout");
        setIsBusy(false);
        return;
      }

      dispatch({ type: "DELETE_WORKOUT", payload: json });
    } catch {
      setCardError("Network error while deleting");
      setIsBusy(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsBusy(true);
    setCardError(null);

    try {
      const response = await authorizedFetch(
        `/api/workouts/${workoutId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title: editTitle,
            category: editCategory,
            load: Number(editLoad),
            sets: Number(editSets),
            reps: Number(editReps),
            notes: editNotes,
          }),
        },
        user,
        authDispatch
      );

      const json = await response.json();

      if (!response.ok) {
        setCardError(json.error || "Failed to update workout");
        setIsBusy(false);
        return;
      }

      dispatch({ type: "UPDATE_WORKOUT", payload: json });
      setIsEditing(false);
      setIsBusy(false);
    } catch {
      setCardError("Network error while updating");
      setIsBusy(false);
    }
  };

  if (isEditing) {
    return (
      <article className="workout-card card editing">
        <form onSubmit={handleUpdate} className="inline-edit-form">
          <div className="inline-edit-header">
            <span className="pill pill-accent">Editing Workout</span>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setIsEditing(false)}
              aria-label="Cancel edit"
            >
              <CloseIcon width={16} height={16} />
            </button>
          </div>

          <div className="field-group">
            <label>Title</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
            />
          </div>

          <div className="inline-edit-grid">
            <div className="field-group">
              <label>Category</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
              >
                {WORKOUT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label>Load (kg)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={editLoad}
                onChange={(e) => setEditLoad(e.target.value)}
                required
              />
            </div>
            <div className="field-group">
              <label>Sets</label>
              <input
                type="number"
                min="1"
                step="1"
                value={editSets}
                onChange={(e) => setEditSets(e.target.value)}
                required
              />
            </div>
            <div className="field-group">
              <label>Reps</label>
              <input
                type="number"
                min="1"
                step="1"
                value={editReps}
                onChange={(e) => setEditReps(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field-group">
            <label>Notes</label>
            <textarea
              rows={2}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Optional session notes..."
            />
          </div>

          {cardError && (
            <div className="alert alert-error" role="alert">
              {cardError}
            </div>
          )}

          <div className="inline-edit-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setIsEditing(false)}
              disabled={isBusy}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isBusy}
            >
              <CheckIcon width={16} height={16} />
              <span>{isBusy ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </article>
    );
  }

  return (
    <article className="workout-card card">
      <div className="workout-card-top">
        <div className="workout-title-wrap">
          <span className={`category-badge cat-${category.toLowerCase()}`}>
            {category}
          </span>
          <h4 className="workout-title">{workout.title}</h4>
          {createdDate && (
            <time
              className="workout-time"
              dateTime={createdDate}
              title={new Date(createdDate).toLocaleString()}
            >
              {formatDistanceToNow(new Date(createdDate), { addSuffix: true })}
            </time>
          )}
        </div>

        <div className="card-actions">
          {confirmDelete ? (
            <div className="confirm-delete-group">
              <button
                type="button"
                className="btn btn-danger btn-xs"
                onClick={handleDelete}
                disabled={isBusy}
              >
                {isBusy ? "..." : "Delete"}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => setConfirmDelete(false)}
                disabled={isBusy}
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="icon-btn"
                onClick={startEditing}
                aria-label={`Edit ${workout.title}`}
                title="Edit workout"
              >
                <EditIcon width={16} height={16} />
              </button>
              <button
                type="button"
                className="icon-btn danger"
                onClick={() => setConfirmDelete(true)}
                aria-label={`Delete ${workout.title}`}
                title="Delete workout"
              >
                <TrashIcon width={16} height={16} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="workout-metrics">
        <div className="metric-box">
          <span className="metric-label">Load</span>
          <strong className="metric-val mono">
            {load === 0 ? "Bodyweight" : `${load} kg`}
          </strong>
        </div>
        <div className="metric-box">
          <span className="metric-label">Sets × Reps</span>
          <strong className="metric-val mono">
            {sets} × {reps}
          </strong>
        </div>
        <div className="metric-box">
          <span className="metric-label">Volume</span>
          <strong className="metric-val mono">
            {totalVolume.toLocaleString()} kg
          </strong>
        </div>
      </div>

      {workout.notes && <p className="workout-notes">{workout.notes}</p>}

      {cardError && (
        <div className="alert alert-error" role="alert">
          {cardError}
        </div>
      )}
    </article>
  );
};

export default WorkoutCard;
