import { Award, BriefcaseBusiness, GraduationCap, LogOut, Mail, MapPin, Phone, Plus, RefreshCw, Save, ShieldCheck, Sparkles, Trash2, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../api/admin";
import { associateProfilesApi, internProfilesApi, lawyerProfilesApi, partnerProfilesApi } from "../api/profiles";
import { usersApi } from "../api/users";
import { useAuth } from "../auth/AuthProvider";
import { Button } from "../components/common/Button";
import { Card, CardBody, CardHeader } from "../components/common/Card";
import { SkeletonBlock } from "../components/common/Skeleton";
import { StateCard } from "../components/common/StateCard";
import { StatusBadge } from "../components/common/StatusBadge";
import { Field } from "../components/forms/Field";
import { TextareaField } from "../components/forms/TextareaField";

const profileApis = {
  admin: adminApi,
  associate: associateProfilesApi,
  intern: internProfilesApi,
  lawyer: lawyerProfilesApi,
  partner: partnerProfilesApi,
};

const defaultProfileImage = "/images/default-user.jpg";

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

function normalizeQualificationForForm(item = {}) {
  if (typeof item === "string") return { degree: item, university: "", year: "" };
  return {
    degree: item.degree || "",
    university: item.university || "",
    year: item.year || "",
  };
}

function buildProfileForm(user = {}, profile = {}) {
  const qualifications = Array.isArray(user.qualifications) && user.qualifications.length
    ? user.qualifications.map(normalizeQualificationForForm)
    : [{ degree: "", university: "", year: "" }];
  return {
    name: user.name || "",
    mobile: user.mobile || "",
    address: user.address || "",
    billingRate: profile.billingRate ?? "",
    stateBarCouncil: profile.stateBarCouncil || "",
    enrolmentNo: profile.enrolmentNo || "",
    enrolmentDate: profile.enrolmentDate ? String(profile.enrolmentDate).slice(0, 10) : "",
    pan: profile.pan || "",
    gstin: profile.gstin || "",
    gstRegistrationStatus: profile.gstRegistrationStatus || "not_applicable",
    professionalAddress: profile.professionalAddress || "",
    signatureImageUrl: profile.signatureImageUrl || "",
    qualifications,
  };
}

function cleanQualifications(qualifications = []) {
  return qualifications
    .map((item) => ({
      degree: String(item.degree || "").trim(),
      university: String(item.university || "").trim(),
      year: item.year === "" ? "" : Number(item.year),
    }))
    .filter((item) => item.degree || item.university || item.year);
}

function personName(person) {
  if (!person) return "";
  if (typeof person === "string") return person;
  return person.name || [person.firstName, person.lastName].filter(Boolean).join(" ") || person.email || "";
}

function maskRegistration(value, visibleStart = 2, visibleEnd = 1) {
  if (!value) return "";
  const text = String(value);
  if (text.length <= visibleStart + visibleEnd) return "****";
  return `${text.slice(0, visibleStart)}${"*".repeat(Math.max(4, text.length - visibleStart - visibleEnd))}${text.slice(-visibleEnd)}`;
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
  const [profileForm, setProfileForm] = useState(() => buildProfileForm(user, {}));
  const [formMessage, setFormMessage] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const navigate = useNavigate();

  async function loadRoleProfile(currentUser = user) {
    if (!currentUser) return;
    const api = profileApis[currentUser.role];
    if (!api?.me) {
      setProfileState({ status: "empty", profile: null, message: "This profile setup is not available yet." });
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

  const profile = profileState.profile || {};
  const populatedUser = userFromProfile(profile);
  const fullUser = { ...(user || {}), ...(populatedUser || {}) };

  useEffect(() => {
    setProfileForm(buildProfileForm(fullUser, profile));
  }, [fullUser.id, fullUser.name, fullUser.mobile, fullUser.address, JSON.stringify(fullUser.qualifications || []), profile.billingRate]);

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

  function updateQualification(index, key, value) {
    setProfileForm((current) => ({
      ...current,
      qualifications: current.qualifications.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [key]: value } : item
      )),
    }));
  }

  function addQualification() {
    setProfileForm((current) => ({
      ...current,
      qualifications: [...current.qualifications, { degree: "", university: "", year: "" }],
    }));
  }

  function removeQualification(index) {
    setProfileForm((current) => {
      const next = current.qualifications.filter((_, itemIndex) => itemIndex !== index);
      return {
        ...current,
        qualifications: next.length ? next : [{ degree: "", university: "", year: "" }],
      };
    });
  }

  async function handleProfileSave(event) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setFormMessage("");
    try {
      const response = await usersApi.updateMyProfileCompletion({
        name: profileForm.name,
        mobile: profileForm.mobile,
        address: profileForm.address,
        billingRate: profileForm.billingRate,
        qualifications: cleanQualifications(profileForm.qualifications),
      });
      const latestUser = await refreshCurrentUser();
      const latestProfile = profileFromResponse(response) || response?.profile || profileState.profile;
      const api = profileApis[fullUser.role];
      let savedProfile = latestProfile;
      if (["lawyer", "partner"].includes(fullUser.role) && api?.updateMe) {
        const profileResponse = await api.updateMe({
          billingRate: profileForm.billingRate,
          stateBarCouncil: profileForm.stateBarCouncil,
          enrolmentNo: profileForm.enrolmentNo,
          enrolmentDate: profileForm.enrolmentDate || undefined,
          pan: profileForm.pan,
          gstin: profileForm.gstin,
          gstRegistrationStatus: profileForm.gstRegistrationStatus,
          professionalAddress: profileForm.professionalAddress,
          signatureImageUrl: profileForm.signatureImageUrl,
        });
        savedProfile = profileFromResponse(profileResponse) || savedProfile;
      }
      setProfileState({ status: savedProfile ? "ready" : profileState.status, profile: savedProfile, message: "" });
      setProfileForm(buildProfileForm(latestUser || fullUser, savedProfile || profile));
      setIsEditingProfile(false);
      setFormMessage("Profile updated.");
      setMessage("Profile updated.");
    } catch (error) {
      setFormMessage(error?.userMessage || "We could not save your profile.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!user) {
    return <StateCard state="permission" title="Sign in needed" message="Please sign in to view your profile." />;
  }

  const photoUrl = profile.photoUrl || fullUser.avatarUrl || fullUser.photoUrl || fullUser.raw?.photoUrl || "";
  const qualifications = fullUser.qualifications || [];
  const specialization = profile.specialization || [];
  const landmarkCases = profile.landmarkCases || [];
  const achievements = profile.achievements || [];
  const publications = profile.publications || [];
  const billingRate = formatMoney(profile.billingRate);
  const registrationDetails = [
    { label: "State Bar Council", value: profile.stateBarCouncil },
    { label: "Enrolment No.", value: profile.enrolmentNo },
    { label: "Enrolment Date", value: profile.enrolmentDate ? new Date(profile.enrolmentDate).toLocaleDateString("en-IN") : "" },
    { label: "PAN", value: maskRegistration(profile.pan, 3, 1) },
    { label: "GSTIN", value: maskRegistration(profile.gstin, 2, 2) || "Not applicable" },
    { label: "GST status", value: profile.gstRegistrationStatus },
    { label: "Professional address", value: profile.professionalAddress },
    { label: "Signature", value: profile.signatureImageUrl ? "Signature image linked" : "" },
  ];
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
              {photoUrl ? (
                <img
                  alt={fullUser.name}
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    if (event.currentTarget.src.endsWith(defaultProfileImage)) return;
                    event.currentTarget.src = defaultProfileImage;
                  }}
                  src={photoUrl}
                />
              ) : (
                <UserRound className="m-auto h-7 w-7" />
              )}
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
            isEditingProfile ? (
              <div className="rounded-lg bg-blueSoft p-2 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
            ) : (
              <Button
                onClick={() => {
                  setFormMessage("");
                  setProfileForm(buildProfileForm(fullUser, profile));
                  setIsEditingProfile(true);
                }}
                type="button"
                variant="secondary"
              >
                <UserRound className="h-4 w-4" />
                Complete profile
              </Button>
            )
          }
        />
        <CardBody>
          {isEditingProfile ? (
            <form className="space-y-5" onSubmit={handleProfileSave}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="User name"
                  onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}
                  required
                  value={profileForm.name}
                />
                <Field
                  label="Mobile number"
                  onChange={(event) => setProfileForm((current) => ({ ...current, mobile: event.target.value }))}
                  required
                  value={profileForm.mobile}
                />
                <Field
                  label="Billing rate"
                  min="0"
                  onChange={(event) => setProfileForm((current) => ({ ...current, billingRate: event.target.value }))}
                  placeholder="2500"
                  type="number"
                  value={profileForm.billingRate}
                />
                <TextareaField
                  label="Address"
                  onChange={(event) => setProfileForm((current) => ({ ...current, address: event.target.value }))}
                  value={profileForm.address}
                />
              </div>

              {["lawyer", "partner"].includes(fullUser.role) ? (
                <div className="space-y-3 rounded-lg border border-border bg-panel p-4">
                  <div>
                    <h2 className="text-sm font-bold text-ink">Professional Registration</h2>
                    <p className="text-xs text-muted">Used on invoices and professional documents.</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="State Bar Council" onChange={(event) => setProfileForm((current) => ({ ...current, stateBarCouncil: event.target.value }))} value={profileForm.stateBarCouncil} />
                    <Field label="Enrolment No." onChange={(event) => setProfileForm((current) => ({ ...current, enrolmentNo: event.target.value }))} value={profileForm.enrolmentNo} />
                    <Field label="Enrolment Date" onChange={(event) => setProfileForm((current) => ({ ...current, enrolmentDate: event.target.value }))} type="date" value={profileForm.enrolmentDate} />
                    <Field label="PAN" onChange={(event) => setProfileForm((current) => ({ ...current, pan: event.target.value.toUpperCase() }))} placeholder="ABCDE1234F" value={profileForm.pan} />
                    <Field label="GSTIN" onChange={(event) => setProfileForm((current) => ({ ...current, gstin: event.target.value.toUpperCase() }))} placeholder="22AAAAA0000A1Z5" value={profileForm.gstin} />
                    <label className="block text-sm font-semibold text-ink">
                      GST registration status
                      <select className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => setProfileForm((current) => ({ ...current, gstRegistrationStatus: event.target.value }))} value={profileForm.gstRegistrationStatus}>
                        <option value="registered">Registered</option>
                        <option value="unregistered">Unregistered</option>
                        <option value="not_applicable">Not applicable</option>
                      </select>
                    </label>
                    <TextareaField label="Professional address" onChange={(event) => setProfileForm((current) => ({ ...current, professionalAddress: event.target.value }))} value={profileForm.professionalAddress} />
                    <Field label="Signature image URL" onChange={(event) => setProfileForm((current) => ({ ...current, signatureImageUrl: event.target.value }))} value={profileForm.signatureImageUrl} />
                  </div>
                </div>
              ) : null}

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-ink">Qualifications</h2>
                    <p className="text-xs text-muted">Add degree, university, and year as stored in the user schema.</p>
                  </div>
                  <Button onClick={addQualification} size="sm" type="button" variant="secondary">
                    <Plus className="h-4 w-4" />
                    Add qualification
                  </Button>
                </div>
                <div className="space-y-3">
                  {profileForm.qualifications.map((qualification, index) => (
                    <div className="grid gap-3 rounded-lg border border-border bg-panel p-3 md:grid-cols-[1fr_1fr_8rem_auto]" key={`qualification-${index}`}>
                      <Field
                        label="Degree"
                        onChange={(event) => updateQualification(index, "degree", event.target.value)}
                        placeholder="LLB"
                        value={qualification.degree}
                      />
                      <Field
                        label="University"
                        onChange={(event) => updateQualification(index, "university", event.target.value)}
                        placeholder="University name"
                        value={qualification.university}
                      />
                      <Field
                        label="Year"
                        min="1900"
                        onChange={(event) => updateQualification(index, "year", event.target.value)}
                        placeholder="2024"
                        type="number"
                        value={qualification.year}
                      />
                      <div className="flex items-end">
                        <Button
                          aria-label="Remove qualification"
                          className="w-full"
                          onClick={() => removeQualification(index)}
                          size="icon"
                          type="button"
                          variant="ghost"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {formMessage ? (
                <StateCard state={formMessage.includes("updated") ? "success" : "error"} title="Profile save" message={formMessage} />
              ) : null}

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  onClick={() => {
                    setFormMessage("");
                    setProfileForm(buildProfileForm(fullUser, profile));
                    setIsEditingProfile(false);
                  }}
                  type="button"
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button isLoading={isSaving} type="submit">
                  <Save className="h-4 w-4" />
                  Save profile
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <dl className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Detail label="Name" value={fullUser.name} />
                <Detail label="Role" value={fullUser.role} />
                {roleDetails.map((item) => <Detail key={item.label} label={item.label} value={item.value} />)}
              </dl>
              {["lawyer", "partner"].includes(fullUser.role) ? (
                <div>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm font-bold text-ink">Professional Registration</h2>
                    <StatusBadge>Used on invoices and professional documents.</StatusBadge>
                  </div>
                  <dl className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {registrationDetails.map((item) => <Detail key={item.label} label={item.label} value={item.value} />)}
                  </dl>
                </div>
              ) : null}
            </div>
          )}
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
