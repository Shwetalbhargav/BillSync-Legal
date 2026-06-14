import { Award, BriefcaseBusiness, GraduationCap, LogOut, Mail, MapPin, Phone, RefreshCw, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../api/admin";
import { associateProfilesApi, internProfilesApi, lawyerProfilesApi, partnerProfilesApi } from "../api/profiles";
import { useAuth } from "../auth/AuthProvider";
import { Button } from "../components/common/Button";
import { Card, CardBody, CardHeader } from "../components/common/Card";
import { SkeletonBlock } from "../components/common/Skeleton";
import { StateCard } from "../components/common/StateCard";
import { StatusBadge } from "../components/common/StatusBadge";

const profileApis = {
  admin: adminApi,
  associate: associateProfilesApi,
  intern: internProfilesApi,
  lawyer: lawyerProfilesApi,
  partner: partnerProfilesApi,
};

function Detail({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-panel p-4 shadow-sm">
      <dt className="text-xs font-bold uppercase text-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-ink">{value || "Not added yet"}</dd>
    </div>
  );
}

function ContactPill({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur">
      <Icon className="h-4 w-4 shrink-0 text-accent" />
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-white/65">{label}</p>
        <p className="truncate text-sm font-semibold">{value || "Not added yet"}</p>
      </div>
    </div>
  );
}

function formatMoney(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return "";
  return amount.toLocaleString("en-IN", { currency: "INR", maximumFractionDigits: 0, style: "currency" });
}

function profileFromResponse(response) {
  return response?.profile || response?.admin || response?.data?.profile || null;
}

function userFromProfile(profile) {
  return profile?.userId && typeof profile.userId === "object" ? profile.userId : null;
}

function formatQualification(item) {
  if (!item) return "";
  if (typeof item === "string") return item;
  return [item.degree, item.university, item.year].filter(Boolean).join(" - ");
}

function personName(person) {
  if (!person) return "";
  if (typeof person === "string") return person;
  return person.name || [person.firstName, person.lastName].filter(Boolean).join(" ") || person.email || "";
}

function ListSection({ emptyText = "Not added yet", items = [], renderItem, title, icon: Icon = BriefcaseBusiness }) {
  return (
    <Card>
      <CardHeader
        title={title}
        action={
          <div className="rounded-lg bg-blueSoft p-2 text-primary">
            <Icon className="h-4 w-4" />
          </div>
        }
      />
      <CardBody>
        {items.length ? (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div className="rounded-lg border border-border p-3" key={item?._id || item?.id || item?.title || item?.caseTitle || index}>
                {renderItem(item)}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">{emptyText}</div>
        )}
      </CardBody>
    </Card>
  );
}

export function ProfilePage() {
  const { user, refreshCurrentUser, logout } = useAuth();
  const [message, setMessage] = useState("");
  const [profileState, setProfileState] = useState({ status: "idle", profile: null, message: "" });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const navigate = useNavigate();

  async function loadRoleProfile(currentUser = user) {
    if (!currentUser) return;
    const api = profileApis[currentUser.role];
    if (!api?.me) {
      setProfileState({ status: "empty", profile: null, message: "Role profile endpoint is not configured yet." });
      return;
    }

    setProfileState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const response = await api.me();
      setProfileState({ status: "ready", profile: profileFromResponse(response), message: "" });
    } catch (error) {
      const missing = error?.status === 404;
      setProfileState({
        status: missing ? "empty" : "error",
        profile: null,
        message: missing ? "Role profile has not been completed yet." : error?.userMessage || "We could not refresh the role profile.",
      });
    }
  }

  useEffect(() => {
    loadRoleProfile();
  }, [user?.id, user?.role]);

  async function handleRefresh() {
    setIsRefreshing(true);
    setMessage("");
    const latestUser = await refreshCurrentUser();
    await loadRoleProfile(latestUser || user);
    setMessage(latestUser ? "Profile refreshed." : "Please sign in again to view your profile.");
    setIsRefreshing(false);
  }

  async function handleLogout() {
    setIsSigningOut(true);
    await logout();
    navigate("/login", { replace: true });
  }

  if (!user) {
    return <StateCard state="permission" title="Sign in needed" message="Please sign in to view your profile." />;
  }

  const profile = profileState.profile || {};
  const populatedUser = userFromProfile(profile);
  const fullUser = { ...user, ...(populatedUser || {}) };
  const photoUrl = profile.photoUrl || fullUser.avatarUrl || fullUser.photoUrl || fullUser.raw?.photoUrl || "";
  const qualifications = fullUser.qualifications || [];
  const specialization = profile.specialization || [];
  const landmarkCases = profile.landmarkCases || [];
  const achievements = profile.achievements || [];
  const publications = profile.publications || [];
  const billingRate = formatMoney(profile.billingRate);
  const roleDetails = [
    profile.title ? { label: "Title", value: profile.title } : null,
    profile.experienceYears != null ? { label: "Experience", value: `${profile.experienceYears} years` } : null,
    profile.lawSchool ? { label: "Law school", value: profile.lawSchool } : null,
    profile.graduationYear ? { label: "Graduation year", value: profile.graduationYear } : null,
    profile.internshipFocus ? { label: "Internship focus", value: profile.internshipFocus } : null,
    profile.mentor ? { label: "Mentor", value: personName(profile.mentor) } : null,
    billingRate ? { label: "Billing rate", value: `${billingRate} / hr` } : null,
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-border bg-nav shadow-soft">
        <div className="relative p-6 md:p-8">
          <div className="absolute right-0 top-0 h-36 w-36 rounded-bl-full bg-accent/20" />
          <div className="absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-white/5" />
          <div className="relative flex min-w-0 flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-white/70 bg-blueSoft text-primary shadow-soft">
              {photoUrl ? <img alt={fullUser.name} className="h-full w-full object-cover" src={photoUrl} /> : <UserRound className="m-auto h-7 w-7" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-wide text-accent">My Profile</p>
              <h1 className="mt-1 break-words text-2xl font-bold text-white md:text-3xl">{fullUser.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge tone="success">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                  Signed in
                </StatusBadge>
                <StatusBadge>{fullUser.role}</StatusBadge>
                {profileState.status === "ready" ? <StatusBadge tone="success">profile loaded</StatusBadge> : null}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="bg-white text-primary hover:bg-blueSoft" isLoading={isRefreshing} onClick={handleRefresh} type="button" variant="secondary">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button isLoading={isSigningOut} onClick={handleLogout} type="button" variant="danger">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
          </div>
          <div className="relative mt-6 grid gap-3 md:grid-cols-3">
            <ContactPill icon={Phone} label="Mobile" value={fullUser.mobile} />
            <ContactPill icon={Mail} label="Work email" value={fullUser.email} />
            <ContactPill icon={MapPin} label="Address" value={fullUser.address} />
          </div>
        </div>
      </section>

      {message ? <StateCard state={message.includes("refreshed") ? "success" : "permission"} title="Profile status" message={message} /> : null}
      {profileState.status === "loading" ? <SkeletonBlock /> : null}
      {profileState.status === "empty" ? <StateCard state="empty" title="Role profile not completed" message={profileState.message} /> : null}
      {profileState.status === "error" ? <StateCard state="error" title="Role profile unavailable" message={profileState.message} actionLabel="Try again" onAction={() => loadRoleProfile()} /> : null}

      <Card>
        <CardHeader
          eyebrow="Overview"
          title="Professional profile"
          description="Core identity, role details, and firm-facing profile information."
          action={
            <div className="rounded-lg bg-blueSoft p-2 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
          }
        />
        <CardBody>
          <dl className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Detail label="Name" value={fullUser.name} />
            <Detail label="Role" value={fullUser.role} />
            {roleDetails.map((item) => <Detail key={item.label} label={item.label} value={item.value} />)}
          </dl>
        </CardBody>
      </Card>

      <section className="grid gap-6 xl:grid-cols-2">
        <ListSection
          icon={GraduationCap}
          items={qualifications}
          renderItem={(item) => <p className="text-sm font-semibold text-ink">{formatQualification(item) || "Qualification not added yet"}</p>}
          title="Qualifications"
        />
        <ListSection
          items={specialization}
          renderItem={(item) => <p className="text-sm font-semibold text-ink">{item}</p>}
          title="Specialization"
        />
      </section>

      {["partner", "lawyer"].includes(fullUser.role) ? (
        <ListSection
          emptyText="No landmark cases have been added yet."
          icon={MapPin}
          items={landmarkCases}
          renderItem={(item) => (
            <div>
              <p className="text-sm font-bold text-ink">{item.caseTitle || "Untitled case"}{item.year ? ` (${item.year})` : ""}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{item.description || "No description added yet."}</p>
            </div>
          )}
          title="Landmark cases"
        />
      ) : null}

      <section className="grid gap-6 xl:grid-cols-2">
        <ListSection
          emptyText="No achievements have been added yet."
          icon={Award}
          items={achievements}
          renderItem={(item) => (
            <div>
              <p className="text-sm font-bold text-ink">{item.title || "Achievement"}{item.year ? ` (${item.year})` : ""}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{item.description || "No description added yet."}</p>
            </div>
          )}
          title="Achievements"
        />
        {fullUser.role === "partner" ? (
          <ListSection
            emptyText="No publications have been added yet."
            items={publications}
            renderItem={(item) => (
              <div>
                <p className="text-sm font-bold text-ink">{item.title || "Publication"}{item.year ? ` (${item.year})` : ""}</p>
                <p className="mt-1 break-words text-sm leading-6 text-muted">{item.link || "No link added yet."}</p>
              </div>
            )}
            title="Publications"
          />
        ) : null}
      </section>
    </div>
  );
}
