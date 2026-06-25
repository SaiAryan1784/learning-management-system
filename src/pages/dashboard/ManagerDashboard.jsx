import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import api from "../../api/api";
import { useAuth } from "../../auth/AuthContext";
import {
  Card, Badge, Button, SkeletonCard, EmptyState, ProgressBar,
} from "../../components/ui";
import RingStatCard from "../../components/dashboard/RingStatCard";

// Reference-screenshot card colours: deep maroon, golden yellow, teal-green, dark teal.
const RING_COLORS = ["#9B2C4E", "#D69A1F", "#1AA179", "#13525B"];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatToday() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

const EMERALD = "#10B981";
const EMERALD_MUTED = "#6EE7B7";

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return ((parts[0][0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

// Brand-colored radial gauge. The arc uses `currentColor` via text-emerald, so it
// renders in the org's brand colour automatically (no hardcoded green).
function RadialProgress({ value = 0, size = 128, stroke = 11, children }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="text-white/10" stroke="currentColor" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
          className="text-emerald" stroke="currentColor"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">{children}</div>
    </div>
  );
}

// Eyebrow section heading with a soft brand icon chip, for vertical rhythm.
function SectionHeading({ icon, title, right }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="w-7 h-7 rounded-lg bg-emerald-muted flex items-center justify-center flex-shrink-0">
          <i className={`fa-solid ${icon} text-emerald text-xs`} />
        </span>
        <h2 className="text-subheading text-brand-text">{title}</h2>
      </div>
      {right ? <span className="text-caption text-brand-muted">{right}</span> : null}
    </div>
  );
}

const QUICK_ACTIONS = [
  { label: "Add Course", icon: "fa-plus", to: "/dashboard/course-add" },
  { label: "Invite Staff", icon: "fa-user-plus", to: "/dashboard/staff" },
  { label: "View Reports", icon: "fa-chart-line", to: "/dashboard/reports/compliance" },
];

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const lastFetchRef = useRef(0);

  const [overview, setOverview] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [staffData, setStaffData] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [ovRes, staffRes] = await Promise.all([
        api.get("/progress/org/overview"),
        api.get(`/progress/staff?page=${page}&limit=9`),
      ]);
      setOverview(ovRes.data);
      setStaffData(staffRes.data.staffProgress || []);
      setPagination(staffRes.data.pagination || {});
      lastFetchRef.current = Date.now();
      // Compliance summary is a bonus — never let it block the dashboard.
      api.get("/reports/compliance/overview")
        .then((r) => setCompliance(r.data.summary))
        .catch(() => {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [page]);

  const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
  const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } };

  const avgProgress = staffData.length > 0
    ? Math.round(staffData.reduce((a, s) => a + s.avgProgressPercent, 0) / staffData.length)
    : 0;

  const firstName = user?.name?.split(" ")[0] || "there";

  // Readiness = org compliance rate when available, else avg learner progress.
  const readiness = compliance ? Math.round(compliance.completionRate || 0) : avgProgress;
  const overdue = compliance
    ? compliance.overdueAssignments || 0
    : staffData.reduce((a, s) => a + (s.overdueCourses || 0), 0);

  // A brand-new org has no compliance data and no tracked staff yet — show a welcoming
  // empty state instead of an alarming "0% / Needs attention".
  const hasActivity = !!compliance || staffData.length > 0;

  const statusLine = !hasActivity
    ? "Get started — add a course and assign it to your team."
    : overdue > 0
    ? `${overdue} training${overdue > 1 ? "s" : ""} overdue across your team — worth a look.`
    : "Your team is on track — nothing overdue right now.";
  const readinessHint = !hasActivity
    ? "No training assigned yet."
    : readiness >= 85
    ? "Strong compliance. Keep it up."
    : readiness >= 60
    ? "Getting there — a few learners to nudge."
    : "Needs attention — assign or remind staff.";

  return (
    <div className="space-y-6 pb-24">
      {/* ── Hero ──────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-charcoal text-white px-6 py-6 sm:px-8 sm:py-7">
        <div className="absolute -right-12 -top-12 w-60 h-60 rounded-full bg-emerald/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-20 w-56 h-56 rounded-full bg-emerald/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-7">
          <div className="min-w-0">
            <p className="text-sm text-white/55">{formatToday()}</p>
            <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-white">
              {getGreeting()}, <span className="text-[#db767c]">{firstName}</span>
            </h1>
            <p className="text-sm text-white/70 mt-2 max-w-md">{statusLine}</p>
            <div className="flex flex-wrap gap-2 mt-5">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => navigate(a.to)}
                  className="inline-flex items-center gap-2 rounded-lg bg-white/15 border border-white/10 hover:bg-white/20 px-3.5 py-2 text-sm font-medium text-white transition-colors outline-none focus:outline-none"
                >
                  <i className={`fa-solid ${a.icon} text-emerald text-xs`} /> {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Readiness gauge */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <RadialProgress value={readiness}>
              <span className="text-[28px] font-extrabold tabular-nums">{hasActivity ? `${readiness}%` : "—"}</span>
              <span className="text-[10px] uppercase tracking-widest text-white/55 mt-1">Compliant</span>
            </RadialProgress>
            <div className="hidden sm:block max-w-[170px]">
              <p className="text-sm font-semibold">Team readiness</p>
              <p className="text-xs text-white/60 mt-1 leading-relaxed">{readinessHint}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Overview KPIs ─────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeading icon="fa-gauge-high" title="Overview" />
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : overview ? (
          <motion.div
            initial="hidden" animate="visible" variants={stagger}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {[
              { label: "Total Users",            value: overview.summary.totalUsers },
              { label: "Users Logged In Today",  value: overview.summary.usersLoggedInToday ?? 0 },
              { label: "Total Courses",          value: overview.summary.totalCourses },
              { label: "Courses Completed",      value: overview.summary.coursesCompleted },
            ].map((s, i) => (
              <motion.div key={s.label} variants={fadeUp} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
                <RingStatCard label={s.label} value={s.value} color={RING_COLORS[i]} />
              </motion.div>
            ))}
          </motion.div>
        ) : null}
      </section>

      {/* ── Insights ──────────────────────────────────── */}
      {overview && (
        <section className="space-y-4">
          <SectionHeading icon="fa-chart-simple" title="Insights" />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* Top 10 Enrollments */}
            <Card padded>
              <p className="text-sm font-bold text-brand-text mb-4 uppercase tracking-wide">Top 10 Course Enrollments</p>
              {overview.topEnrollments.length === 0 ? (
                <p className="text-xs text-brand-muted py-8 text-center">No enrollment data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={overview.topEnrollments} layout="vertical" margin={{ left: 4, right: 24, top: 0, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis
                      type="category" dataKey="title" width={120}
                      tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => v.length > 18 ? v.slice(0, 17) + "…" : v}
                    />
                    <Tooltip
                      contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-brand-border)", borderRadius: 10, fontSize: 12 }}
                      formatter={(v) => [v, "Enrollments"]}
                    />
                    <Bar dataKey="enrollments" radius={[0, 6, 6, 0]}>
                      {overview.topEnrollments.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? EMERALD : EMERALD_MUTED} fillOpacity={1 - i * 0.06} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Popular Courses (avg progress) */}
            <Card padded>
              <p className="text-sm font-bold text-brand-text mb-4 uppercase tracking-wide">Popular Courses</p>
              {overview.popularCourses.length === 0 ? (
                <p className="text-xs text-brand-muted py-8 text-center">No progress data yet.</p>
              ) : (
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin", scrollbarColor: "#E5E7EB transparent" }}>
                  {overview.popularCourses.map((c) => (
                    <div key={c.courseId}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-brand-text truncate max-w-[70%]">{c.title}</span>
                        <span className="text-xs text-brand-muted tabular-nums flex-shrink-0">{c.enrolled} enrolled · {c.avgProgress}%</span>
                      </div>
                      <ProgressBar percent={c.avgProgress} size="xs" />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </section>
      )}

      {/* ── Team pulse ────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeading
          icon="fa-user-group"
          title="Team Pulse"
          right={!loading ? `${avgProgress}% avg completion` : null}
        />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : staffData.length === 0 ? (
          <Card padded={false}>
            <EmptyState
              icon={<i className="fa-solid fa-user-group" />}
              title="No staff to show"
              description="Once staff are added and tracked, they will appear here."
            />
          </Card>
        ) : (
          <motion.div
            initial="hidden" animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {staffData.map((staff) => (
              <motion.div
                key={staff.staffId}
                variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card interactive onClick={() => navigate(`/dashboard/staff-progress/${staff.staffId}`)}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-10 h-10 rounded-full bg-emerald-muted text-emerald font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {initials(staff.staffName)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-body font-semibold text-brand-text leading-tight truncate">{staff.staffName}</p>
                      <p className="text-caption text-brand-muted truncate">{staff.staffEmail}</p>
                    </div>
                    <span className="text-body font-bold text-emerald flex-shrink-0 tabular-nums">{staff.avgProgressPercent}%</span>
                  </div>

                  <div className="mb-3">
                    <ProgressBar percent={staff.avgProgressPercent} size="sm" />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge tone="neutral" size="sm">{staff.trackedCourses} courses</Badge>
                    {staff.overdueCourses > 0 && (
                      <Badge tone="danger" dot size="sm">{staff.overdueCourses} overdue</Badge>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination — only when there's more than one page */}
        {pagination.total > pagination.limit && (
          <div className="flex items-center justify-between pt-1">
            <Button variant="secondary" size="sm" disabled={page === 1}
              leadingIcon={<i className="fa-solid fa-arrow-left text-xs" />}
              onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-caption text-brand-muted">Page {pagination.page || 1}</span>
            <Button variant="secondary" size="sm"
              disabled={pagination.total ? page * pagination.limit >= pagination.total : true}
              trailingIcon={<i className="fa-solid fa-arrow-right text-xs" />}
              onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
