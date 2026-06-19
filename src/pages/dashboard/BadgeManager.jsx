import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import toastr from "toastr";
import { PageHeader, Card, Button, Modal, EmptyState, SkeletonCard } from "../../components/ui";

const inputClass =
  "w-full px-3.5 py-2.5 border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-muted bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent";

const ICON_CHOICES = ["fa-medal", "fa-trophy", "fa-award", "fa-star", "fa-crown", "fa-fire", "fa-bolt", "fa-gem", "fa-graduation-cap", "fa-certificate"];
const COLOR_CHOICES = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899", "#F97316"];

const CRITERIA_LABELS = {
  courses_completed: "Complete N courses",
  quizzes_passed: "Pass N quizzes",
  perfect_quiz: "Score 100% on any quiz",
  specific_course: "Complete a specific course",
};

const emptyForm = {
  name: "",
  description: "",
  icon: "fa-medal",
  color: "#10B981",
  criteriaType: "courses_completed",
  count: 1,
  courseId: "",
};

export default function BadgeManager() {
  const navigate = useNavigate();
  const [badges, setBadges] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [defRes, courseRes] = await Promise.all([
        api.get("/badges/definitions"),
        api.get("/courses").catch(() => ({ data: { courses: [] } })),
      ]);
      setBadges(defRes.data.badges || []);
      setCourses(courseRes.data.courses || []);
    } catch {
      toastr.error("Failed to load badges");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (b) => {
    setEditingId(b.id);
    setForm({
      name: b.name,
      description: b.description || "",
      icon: b.icon || "fa-medal",
      color: b.color || "#10B981",
      criteriaType: b.criteria?.type || "courses_completed",
      count: b.criteria?.count || 1,
      courseId: b.criteria?.courseId || "",
    });
    setModalOpen(true);
  };

  const buildCriteria = () => {
    if (form.criteriaType === "courses_completed" || form.criteriaType === "quizzes_passed") {
      return { type: form.criteriaType, count: Number(form.count) };
    }
    if (form.criteriaType === "specific_course") {
      return { type: "specific_course", courseId: form.courseId };
    }
    return { type: "perfect_quiz" };
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toastr.warning("Badge name is required");
    if (form.criteriaType === "specific_course" && !form.courseId) return toastr.warning("Select a course");
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      icon: form.icon,
      color: form.color,
      criteria: buildCriteria(),
    };
    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/badges/definitions/${editingId}`, payload);
        toastr.success("Badge updated");
      } else {
        await api.post("/badges/definitions", payload);
        toastr.success("Badge created");
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      toastr.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (b) => {
    const earned = b.awardedCount || 0;
    const warn = earned > 0
      ? `Delete the "${b.name}" badge?\n\n⚠ ${earned} learner${earned > 1 ? "s" : ""} earned this — deleting removes it from their walls permanently.`
      : `Delete the "${b.name}" badge?`;
    if (!window.confirm(warn)) return;
    try {
      await api.delete(`/badges/definitions/${b.id}`);
      toastr.success("Badge deleted");
      await load();
    } catch (err) {
      toastr.error(err.response?.data?.message || "Delete failed");
    }
  };

  const toggleSystemBadge = async (b) => {
    const nextActive = !b.active;
    try {
      await api.put(`/badges/system/${b.key}/state`, { active: nextActive });
      toastr.success(nextActive ? "Badge enabled" : "Badge disabled");
      await load();
    } catch (err) {
      toastr.error(err.response?.data?.message || "Update failed");
    }
  };

  const criteriaText = (b) => {
    const c = b.criteria || {};
    if (c.type === "courses_completed") return `Complete ${c.count} course${c.count > 1 ? "s" : ""}`;
    if (c.type === "quizzes_passed") return `Pass ${c.count} quiz${c.count > 1 ? "zes" : ""}`;
    if (c.type === "perfect_quiz") return "Score 100% on any quiz";
    if (c.type === "specific_course") {
      const course = courses.find((co) => co._id === String(c.courseId));
      return `Complete: ${course?.title || "a course"}`;
    }
    return "";
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Manage Badges" subtitle="Built-in achievements plus your own custom badges">
        <Button
          variant="ghost"
          size="sm"
          className="!text-white !border-white/20 hover:!bg-white/10"
          leadingIcon={<i className="fa-solid fa-arrow-left text-xs" />}
          onClick={() => navigate("/dashboard/badges")}
        >
          Back
        </Button>
      </PageHeader>

      <div className="flex justify-end">
        <Button variant="primary" size="sm" leadingIcon={<i className="fa-solid fa-plus text-xs" />} onClick={openCreate}>
          New Badge
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : badges.length === 0 ? (
        <Card padded={false}>
          <EmptyState icon={<i className="fa-solid fa-medal" />} title="No badges" description="Create your first custom badge." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((b) => (
            <Card key={b.key} className={`flex items-start gap-4 ${b.active ? "" : "opacity-55"}`}>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl"
                style={{ backgroundColor: `${b.color}1A`, color: b.color }}
              >
                <i className={`fa-solid ${b.icon}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-body font-semibold text-brand-text truncate">{b.name}</h4>
                  {b.isSystem && (
                    <span className="text-[10px] font-bold uppercase text-brand-muted bg-canvas border border-brand-border rounded px-1.5 py-0.5">Built-in</span>
                  )}
                  {!b.active && (
                    <span className="text-[10px] font-bold uppercase text-brand-danger bg-brand-danger/10 border border-brand-danger/30 rounded px-1.5 py-0.5">Disabled</span>
                  )}
                </div>
                <p className="text-caption text-brand-muted">{b.description}</p>
                <p className="text-[11px] text-emerald font-medium mt-1">
                  <i className="fa-solid fa-bullseye mr-1" />{criteriaText(b)}
                </p>
                {b.awardedCount > 0 && (
                  <p className="text-[11px] text-brand-muted mt-0.5">
                    <i className="fa-solid fa-user-check mr-1" />Earned by {b.awardedCount}
                  </p>
                )}
                <div className="flex gap-3 mt-2">
                  {b.isSystem ? (
                    <button
                      className={`text-xs font-semibold ${b.active ? "text-brand-danger hover:underline" : "text-emerald hover:underline"}`}
                      onClick={() => toggleSystemBadge(b)}
                    >
                      <i className={`fa-solid ${b.active ? "fa-ban" : "fa-circle-check"} mr-1 text-[10px]`} />
                      {b.active ? "Disable" : "Enable"}
                    </button>
                  ) : (
                    <>
                      <button className="text-xs font-semibold text-brand-text hover:text-emerald" onClick={() => openEdit(b)}>
                        <i className="fa-solid fa-pen mr-1 text-[10px]" />Edit
                      </button>
                      <button className="text-xs font-semibold text-brand-danger hover:underline" onClick={() => handleDelete(b)}>
                        <i className="fa-solid fa-trash mr-1 text-[10px]" />Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Badge" : "New Badge"} maxWidth="max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Name</label>
            <input className={inputClass} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Safety Champion" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Description</label>
            <input className={inputClass} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Short description learners will see" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Icon</label>
              <div className="flex flex-wrap gap-1.5">
                {ICON_CHOICES.map((ic) => (
                  <button key={ic} type="button" onClick={() => setForm((p) => ({ ...p, icon: ic }))}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center border ${form.icon === ic ? "border-emerald bg-emerald/10 text-emerald" : "border-brand-border text-brand-muted"}`}>
                    <i className={`fa-solid ${ic}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Color</label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_CHOICES.map((co) => (
                  <button key={co} type="button" onClick={() => setForm((p) => ({ ...p, color: co }))}
                    className={`w-9 h-9 rounded-lg border-2 ${form.color === co ? "border-brand-text" : "border-transparent"}`}
                    style={{ backgroundColor: co }} />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Awarded when</label>
            <select className={inputClass} value={form.criteriaType} onChange={(e) => setForm((p) => ({ ...p, criteriaType: e.target.value }))}>
              {Object.entries(CRITERIA_LABELS).map(([v, label]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
          </div>

          {(form.criteriaType === "courses_completed" || form.criteriaType === "quizzes_passed") && (
            <div>
              <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">How many?</label>
              <input type="number" min="1" className={inputClass} value={form.count} onChange={(e) => setForm((p) => ({ ...p, count: e.target.value }))} />
            </div>
          )}
          {form.criteriaType === "specific_course" && (
            <div>
              <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">Course</label>
              <select className={inputClass} value={form.courseId} onChange={(e) => setForm((p) => ({ ...p, courseId: e.target.value }))}>
                <option value="">Select a course…</option>
                {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>{editingId ? "Save" : "Create"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
