import { useEffect, useState } from "react";
import api from "../../api/api";
import toastr from "toastr";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

const inputClass =
  "w-full px-3 py-2 border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-muted bg-white focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent transition-colors";

/**
 * Create or rename a Path. `path` present = edit mode.
 * A path is just a container, so this stays a modal rather than a full page —
 * the ordered lesson list behind it stays visible while naming.
 */
export default function PathFormModal({ isOpen, onClose, courseId, path, onSaved }) {
  const editing = Boolean(path?._id);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sequentialUnlock, setSequentialUnlock] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTitle(path?.title || "");
    setDescription(path?.description || "");
    setSequentialUnlock(path?.sequentialUnlock === true);
  }, [isOpen, path]);

  const handleSave = async () => {
    if (!title.trim()) {
      toastr.error("Path title is required");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        title: title.trim(),
        description: description.trim(),
        sequentialUnlock,
      };
      if (editing) {
        await api.put(`/courses/${courseId}/paths/${path._id}`, payload);
        toastr.success("Path updated");
      } else {
        await api.post(`/courses/${courseId}/paths`, payload);
        toastr.success("Path created");
      }
      onSaved?.();
      onClose?.();
    } catch (err) {
      toastr.error(err.response?.data?.error || "Failed to save path");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? "Edit Path" : "Add Path"}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>
            {editing ? "Save changes" : "Create path"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-brand-text mb-1">
            Title<span className="text-brand-danger ml-1">*</span>
          </label>
          <input
            type="text"
            value={title}
            placeholder="e.g. Week 1 — Onboarding Basics"
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className={inputClass}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-brand-text mb-1">
            Description
          </label>
          <textarea
            rows={3}
            value={description}
            placeholder="What this group of lessons covers (optional)"
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </div>

        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={sequentialUnlock}
            onChange={(e) => setSequentialUnlock(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-brand-border accent-emerald cursor-pointer"
          />
          <span>
            <span className="block text-sm font-medium text-brand-text">
              Unlock lessons in order
            </span>
            <span className="block text-xs text-brand-muted">
              Learners must finish each required lesson before the next one opens.
            </span>
          </span>
        </label>
      </div>
    </Modal>
  );
}
