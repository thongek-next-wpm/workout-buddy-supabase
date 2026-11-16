import { ActivityIcon, FlameIcon, RepeatIcon, TrophyIcon } from "./Icons";

const WorkoutStats = ({ workouts = [] }) => {
  const list = Array.isArray(workouts) ? workouts : [];

  const totalSessions = list.length;
  const totalVolume = list.reduce((sum, item) => {
    const load = Number(item.load) || 0;
    const reps = Number(item.reps) || 0;
    const sets = Number(item.sets) || 1;
    return sum + load * reps * sets;
  }, 0);

  const totalReps = list.reduce((sum, item) => {
    const reps = Number(item.reps) || 0;
    const sets = Number(item.sets) || 1;
    return sum + reps * sets;
  }, 0);

  const peakLoad = list.reduce(
    (max, item) => Math.max(max, Number(item.load) || 0),
    0
  );

  const stats = [
    {
      label: "Workouts Logged",
      value: totalSessions.toLocaleString(),
      subtext: totalSessions === 1 ? "Active entry" : "Total entries",
      icon: ActivityIcon,
      tone: "emerald",
    },
    {
      label: "Total Volume",
      value: `${Math.round(totalVolume).toLocaleString()} kg`,
      subtext: "Load × Sets × Reps",
      icon: FlameIcon,
      tone: "cyan",
    },
    {
      label: "Total Reps",
      value: totalReps.toLocaleString(),
      subtext: "Across all sets",
      icon: RepeatIcon,
      tone: "violet",
    },
    {
      label: "Peak Load",
      value:
        totalSessions === 0
          ? "—"
          : peakLoad === 0
          ? "Bodyweight"
          : `${peakLoad} kg`,
      subtext: "Heaviest lift recorded",
      icon: TrophyIcon,
      tone: "amber",
    },
  ];

  return (
    <section className="stats-grid" aria-label="Workout statistics">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <article key={stat.label} className={`stat-card stat-${stat.tone}`}>
            <div className="stat-header">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-icon">
                <Icon width={18} height={18} />
              </span>
            </div>
            <div className="stat-value mono">{stat.value}</div>
            <div className="stat-subtext">{stat.subtext}</div>
          </article>
        );
      })}
    </section>
  );
};

export default WorkoutStats;
