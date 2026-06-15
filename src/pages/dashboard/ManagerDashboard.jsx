import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import api from "../../api/api";
import {
  PageHeader, StatCard, Card, Badge, Button, SkeletonCard, EmptyState, ProgressBar,
} from "../../components/ui";

const EMERALD = "#10B981";
const EMERALD_MUTED = "#6EE7B7";

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const lastFetchRef = useRef(0);

  const [overview, setOverview] = useState(null);
  const [staffData, setStaffData] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [ovRes, staffRes] = await Promise.all([
        api.get("/progress/org/overview"),
        api.get(`/progress/staff?page=${page}&limit=10`),
      ]);
      setOverview(ovRes.data);
      setStaffData(staffRes.data.staffProgress || []);
      setPagination(staffRes.data.pagination || {});
      lastFetchRef.current = Date.now();
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

  return (
    <div className="space-y-8">
      <PageHeader title="Owner Dashboard" subtitle="Organization-wide learning performance">
        {overview && (
          <span className="text-3xl font-bold text-white tabular-nums">
            {overview.summary.totalUsers}
            <span className="text-sm font-normal text-white/60 ml-1">users</span>
          </span>
        )}
      </PageHeader>

      {/* ── Org-wide stat cards ──────────────────────── */}
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
            { icon: "fa-users", label: "Total Users", value: overview.summary.totalUsers },
            { icon: "fa-circle-dot", label: "Logged In Today", value: overview.summary.usersLoggedInToday },
            { icon: "fa-book-open", label: "Total Courses", value: overview.summary.totalCourses },
            { icon: "fa-circle-check", label: "Completions", value: overview.summary.coursesCompleted },
          ].map((s) => (
            <motion.div key={s.label} variants={fadeUp} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
              <StatCard {...s} />
            </motion.div>
          ))}
        </motion.div>
      ) : null}

      {/* ── Charts row ───────────────────────────────── */}
      {overview && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Top 10 Enrollments */}
          <Card padded>
            <p className="text-sm font-bold text-brand-text mb-4">Top 10 Course Enrollments</p>
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
            <p className="text-sm font-bold text-brand-text mb-4">Popular Courses — Avg Progress</p>
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
      )}

      {/* ── Staff grid ───────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-subheading text-brand-text">Staff & Their Progress</h2>
          {!loading && <span className="text-caption text-brand-muted">{avgProgress}% avg completion</span>}
        </div>

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
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div className="min-w-0">
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
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
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
    </div>
  );
}
