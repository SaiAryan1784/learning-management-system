import { toast } from "sonner";

// Drop-in replacement for toastr API (success/error/warning/info).
// Some callers pass (message, title) — sonner wants (title, { description }).
function resolve(msg, title) {
  if (title) return { label: title, description: msg };
  return { label: msg, description: undefined };
}

const toastr = {
  success: (msg, title) => {
    const { label, description } = resolve(msg, title);
    return toast.success(label, description ? { description } : undefined);
  },
  error: (msg, title) => {
    const { label, description } = resolve(msg, title);
    return toast.error(label, description ? { description } : undefined);
  },
  warning: (msg, title) => {
    const { label, description } = resolve(msg, title);
    return toast.warning(label, description ? { description } : undefined);
  },
  info: (msg, title) => {
    const { label, description } = resolve(msg, title);
    return toast.info(label, description ? { description } : undefined);
  },
};

export default toastr;
