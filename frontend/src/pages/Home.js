import { useCallback, useEffect, useMemo, useState } from "react";
import { useWorkoutContext } from "../hooks/useWorkoutContext";
import { useAuthContext } from "../hooks/useAuthContext";
import { authorizedFetch } from "../utils/api";
import WorkoutCard from "../components/WorkoutCard";
import WorkoutForm, { WORKOUT_CATEGORIES } from "../components/WorkoutForm";
import WorkoutStats from "../components/WorkoutStats";
import { DumbbellIcon, SearchIcon } from "../components/Icons";

const Home = () => {
  const { workouts, dispatch } = useWorkoutContext();
  const { user, dispatch: authDispatch } = useAuthContext();

  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  const fetchWorkouts = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setFetchError(null);

    try {
      const response = await authorizedFetch(
        "/api/workouts",
        {},
        user,
        authDispatch
      );
      const json = await response.json();

      if (!response.ok) {
        setFetchError(json.error || "Failed to load workouts");
        setIsLoading(false);
        return;
      }

      dispatch({ type: "SET_WORKOUTS", payload: json });
    } catch {
      setFetchError(
        "Unable to connect to the server. Make sure the backend is running."
      );
    } finally {
      setIsLoading(false);
    }
  }, [user, dispatch, authDispatch]);

  useEffect(() => {
    if (user) {
      fetchWorkouts();
    }
  }, [user, fetchWorkouts]);

  const filteredWorkouts = useMemo(() => {
    const list = Array.isArray(workouts) ? [...workouts] : [];
    const q = searchQuery.trim().toLowerCase();

    const filtered = list.filter((item) => {
      const catMatch =
        activeCategory === "All" ||
        (item.category || "Strength") === activeCategory;
      const textMatch =
        !q ||
        (item.title || "").toLowerCase().includes(q) ||
        (item.notes || "").toLowerCase().includes(q);
      return catMatch && textMatch;
    });

    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
      const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
      const volA =
        (Number(a.load) || 0) * (Number(a.reps) || 0) * (Number(a.sets) || 1);
      const volB =
        (Number(b.load) || 0) * (Number(b.reps) || 0) * (Number(b.sets) || 1);

      switch (sortBy) {
        case "oldest":
          return dateA - dateB;
        case "heaviest":
          return (Number(b.load) || 0) - (Number(a.load) || 0);
        case "volume":
          return volB - volA;
        case "newest":
        default:
          return dateB - dateA;
      }
    });

    return filtered;
  }, [workouts, searchQuery, activeCategory, sortBy]);

  const greetingName =
    user?.displayName || user?.email?.split("@")[0] || "Athlete";

  return (
    <div className="dashboard">
      <div className="dashboard-hero">
        <div>
          <span className="eyebrow">Training Dashboard</span>
          <h2>Welcome back, {greetingName}</h2>
          <p className="muted-text">
            Track sets, progressive overload, and total volume stored securely in
            Supabase.
          </p>
        </div>
      </div>

      <WorkoutStats workouts={workouts || []} />

      <div className="workspace-grid">
        <section className="workouts-section" aria-label="Workout history">
          <div className="toolbar card">
            <div className="search-box">
              <SearchIcon width={17} height={17} className="search-icon" />
              <input
                type="search"
                placeholder="Search exercises or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search workouts"
              />
            </div>

            <div className="toolbar-right">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort workouts"
                className="sort-select"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="heaviest">Heaviest load</option>
                <option value="volume">Highest volume</option>
              </select>
            </div>
          </div>

          <div
            className="filter-pills"
            role="tablist"
            aria-label="Filter by category"
          >
            {["All", ...WORKOUT_CATEGORIES].map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={activeCategory === cat}
                className={`filter-pill ${
                  activeCategory === cat ? "active" : ""
                }`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {fetchError && (
            <div className="alert alert-error fetch-error" role="alert">
              <span>{fetchError}</span>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={fetchWorkouts}
              >
                Retry
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="workouts-grid" aria-busy="true">
              {[1, 2, 3].map((n) => (
                <div key={n} className="card skeleton-card">
                  <div className="skeleton-line w-40" />
                  <div className="skeleton-line w-70" />
                  <div className="skeleton-row">
                    <div className="skeleton-box" />
                    <div className="skeleton-box" />
                    <div className="skeleton-box" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredWorkouts.length > 0 ? (
            <div className="workouts-grid">
              {filteredWorkouts.map((workout) => (
                <WorkoutCard
                  key={workout.id || workout._id}
                  workout={workout}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state card">
              <div className="empty-icon">
                <DumbbellIcon width={28} height={28} />
              </div>
              <h3>
                {(workouts || []).length === 0
                  ? "No workouts logged yet"
                  : "No matching workouts"}
              </h3>
              <p className="muted-text">
                {(workouts || []).length === 0
                  ? "Use the quick presets or fill out the form on the right to log your first session."
                  : "Try clearing your search text or selecting a different category filter."}
              </p>
              {(searchQuery || activeCategory !== "All") && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("All");
                  }}
                >
                  Reset filters
                </button>
              )}
            </div>
          )}
        </section>

        <WorkoutForm />
      </div>
    </div>
  );
};

export default Home;
