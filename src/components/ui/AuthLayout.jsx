import { Link } from "react-router-dom";

const FEATURES = [
  { icon: "fa-book-open", text: "Manage courses & compliance training" },
  { icon: "fa-chart-line", text: "Track staff progress in real-time" },
  { icon: "fa-certificate", text: "Automated certification & renewals" },
];

function BrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center bg-emerald">
      {/* Decorative circles */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-10%", right: "-8%",
          width: 420, height: 420,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.12)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "-12%", left: "-6%",
          width: 320, height: 320,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: "40%", left: "8%",
          width: 160, height: 160,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
        }}
      />

      {/* Dot grid */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-16 py-12 max-w-lg">
        <h2 className="text-3xl font-bold text-white leading-tight mb-4">
          Your workforce<br />learning platform
        </h2>
        <p className="text-white/70 text-sm mb-10 leading-relaxed">
          Build a culture of continuous learning. Onboard, train, and certify your team — all in one place.
        </p>

        <ul className="space-y-4 w-full text-left">
          {FEATURES.map((f) => (
            <li key={f.icon} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                <i className={`fa-solid ${f.icon} text-white text-xs`} />
              </div>
              <span className="text-white/90 text-sm font-medium">{f.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex">
      {/* Left — form panel */}
      <div className="flex-1 lg:max-w-[50%] flex flex-col bg-surface">
        {/* Logo strip */}
        <div className="px-10 lg:px-16 pt-8 pb-0">
          <Link to="/" className="inline-flex items-center gap-2.5 no-underline">
            <img
              src="/images/lms-logo.png"
              className="h-14 object-contain"
              alt="Brand Logo"
            />
          </Link>
        </div>

        {/* Form — vertically centered */}
        <div className="flex-1 flex flex-col justify-center px-10 lg:px-16 py-6">
          <div className="w-full max-w-md mx-auto lg:mx-0">
            {children}
          </div>
        </div>
      </div>

      {/* Right — brand panel */}
      <BrandPanel />
    </div>
  );
}
