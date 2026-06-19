import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../api/api";
import toastr from "toastr";
import { useAuth } from "../../auth/AuthContext";
import {
  PageHeader,
  Button,
  Card,
  EmptyState,
  SkeletonCard,
  ProgressBar,
} from "../../components/ui";

export default function StaffBadges() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const roleName = user?.role?.name?.trim().toLowerCase();
  const isAdmin = roleName === "owner" || roleName === "admin";

  const [badges, setBadges] = useState([]);
  const [earnedCount, setEarnedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/badges/me");
        setBadges(res.data.badges || []);
        setEarnedCount(res.data.earnedCount || 0);
        setTotalCount(res.data.totalCount || 0);
      } catch {
        toastr.error("Failed to load badges");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const percent = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-5">
      <PageHeader title="My Badges" subtitle="Achievements you earn as you learn">
        {isAdmin && (
          <Button
            variant="ghost"
            size="sm"
            className="!text-white !border-white/20 hover:!bg-white/10"
            leadingIcon={<i className="fa-solid fa-gear text-xs" />}
            onClick={() => navigate("/dashboard/badges/manage")}
          >
            Manage
          </Button>
        )}
      </PageHeader>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : badges.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon={<i className="fa-solid fa-medal" />}
            title="No badges available"
            description="Badges will appear here as you complete courses and quizzes."
          />
        </Card>
      ) : (
        <>
          {/* Progress summary */}
          <Card>
            <div className="flex items-center justify-between mb-2">
              <p className="text-body font-semibold text-brand-text">
                {earnedCount} of {totalCount} badges earned
              </p>
              <span className="text-caption text-brand-muted">{percent}%</span>
            </div>
            <ProgressBar percent={percent} size="sm" />
          </Card>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {badges.map((badge) => (
              <motion.div
                key={badge.key}
                variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className={`flex items-start gap-4 h-full ${badge.earned ? "" : "opacity-60"}`}>
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
                    style={
                      badge.earned
                        ? { backgroundColor: `${badge.color}1A`, color: badge.color }
                        : { backgroundColor: "#F3F4F6", color: "#9CA3AF" }
                    }
                  >
                    <i className={`fa-solid ${badge.earned ? badge.icon : "fa-lock"}`} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-body font-semibold text-brand-text">{badge.name}</h4>
                    <p className="text-caption text-brand-muted">{badge.description}</p>
                    {badge.earned ? (
                      <p className="text-[11px] text-emerald font-semibold mt-1">
                        <i className="fa-solid fa-circle-check mr-1" />
                        Earned {badge.awardedAt ? new Date(badge.awardedAt).toLocaleDateString() : ""}
                      </p>
                    ) : (
                      <p className="text-[11px] text-brand-muted mt-1">
                        <i className="fa-solid fa-lock mr-1" />
                        Locked
                      </p>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}
