"use client";

import { useActionState, useEffect, useState } from "react";
import { Combobox } from "@/app/_components/combobox";
import { PhotoPicker } from "@/app/_components/photo-picker";
import { indiaCityStates } from "@/lib/locations";
import { useRef } from "react";

export type TrainerFormState = {
  message: string;
  success: boolean;
};

/** Subset of Trainer fields the form pre-fills when editing. */
export type TrainerDefaults = {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  linkedin?: string | null;
  insta?: string | null;
  primaryRole?: string | null;
  totalTrainingExperience?: number | null;
  industryExperience?: number | null;
  expectedChargesPerDay?: string | null;
  languages?: string | null;
  detailedExpertise?: string | null;
  areasOfExpertise?: string[];
  trainingTypesDelivered?: string[];
  availability?: string[];
  resumeUrl?: string | null;
  photoUrl?: string | null;
};

type Action = (
  state: TrainerFormState,
  formData: FormData,
) => Promise<TrainerFormState>;

const initialState: TrainerFormState = { message: "", success: false };

const primaryRoles = [
  "Freelance Trainer",
  "Corporate Trainer",
  "Academic Faculty",
  "Industry Practitioner",
  "Consultant",
];

const expertiseAreas = [
  "Technical Trainer",
  "Soft Skill Trainer",
  "Mechanical Trainer",
  "Others",
];

const trainingTypes = ["Corporate", "Institute", "Both"];

const availabilityOptions = [
  "Weekdays",
  "Weekends",
  "Part-Time",
  "Full-Time (Project-Based)",
];

const inputClass =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

function FieldLabel({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-zinc-800">
      {children}
    </label>
  );
}

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  insta: string;
  primaryRole: string;
  totalTrainingExperience: string;
  industryExperience: string;
  expectedChargesPerDay: string;
  languages: string;
  detailedExpertise: string;
  areasOfExpertise: string[];
  trainingTypesDelivered: string[];
  availability: string[];
};

function buildInitialValues(d: TrainerDefaults): FormValues {
  return {
    firstName: d.firstName ?? "",
    lastName: d.lastName ?? "",
    email: d.email ?? "",
    phone: d.phone ?? "",
    location: d.location ?? "",
    linkedin: d.linkedin ?? "",
    insta: d.insta ?? "",
    primaryRole: d.primaryRole ?? "",
    totalTrainingExperience: d.totalTrainingExperience != null ? String(d.totalTrainingExperience) : "",
    industryExperience: d.industryExperience != null ? String(d.industryExperience) : "",
    expectedChargesPerDay: d.expectedChargesPerDay ?? "",
    languages: d.languages ?? "",
    detailedExpertise: d.detailedExpertise ?? "",
    areasOfExpertise: d.areasOfExpertise ?? [],
    trainingTypesDelivered: d.trainingTypesDelivered ?? [],
    availability: d.availability ?? [],
  };
}

const STORAGE_KEY = "trainer-form-draft";
const RESUME_STORAGE_KEY = "trainer-form-resume";

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function base64ToFile(dataUrl: string, fileName: string): File {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "application/octet-stream";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], fileName, { type: mime });
}

function injectFileIntoInput(input: HTMLInputElement, file: File) {
  try {
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
  } catch {
    // DataTransfer not supported
  }
}

export function TrainerForm({
  action,
  defaults,
  submitLabel,
  mode,
}: {
  action: Action;
  defaults?: TrainerDefaults;
  submitLabel: string;
  mode: "create" | "edit";
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const d = defaults ?? {};
  const isEdit = mode === "edit";

  const [values, setValues] = useState<FormValues>(() => buildInitialValues(d));
  const [hydrated, setHydrated] = useState(false);
  const [savedFileName, setSavedFileName] = useState<string | null>(null);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) setValues(JSON.parse(saved) as FormValues);
      } catch { /* ignore */ }

      try {
        const savedResume = sessionStorage.getItem(RESUME_STORAGE_KEY);
        if (savedResume) {
          const { dataUrl, fileName } = JSON.parse(savedResume) as { dataUrl: string; fileName: string };
          const file = base64ToFile(dataUrl, fileName);
          setSavedFileName(fileName);
          setTimeout(() => {
            if (resumeInputRef.current) injectFileIntoInput(resumeInputRef.current, file);
          }, 0);
        }
      } catch { /* ignore */ }
    }
    setHydrated(true);
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit && hydrated) {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(values));
      } catch { /* ignore */ }
    }
  }, [values, isEdit, hydrated]);

  useEffect(() => {
    if (state.success && !isEdit) {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(RESUME_STORAGE_KEY);
      } catch { /* ignore */ }
    }
  }, [state.success, isEdit]);

  function set(field: keyof FormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function toggleArray(field: "areasOfExpertise" | "trainingTypesDelivered" | "availability", value: string) {
    setValues((prev) => {
      const arr = prev[field];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  }

  async function handleResumeChange() {
    const file = resumeInputRef.current?.files?.[0];
    if (!file || isEdit) return;
    try {
      const dataUrl = await fileToBase64(file);
      sessionStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify({ dataUrl, fileName: file.name }));
      setSavedFileName(file.name);
    } catch { /* ignore */ }
  }

  async function handleAutofill() {
    const file = resumeInputRef.current?.files?.[0];
    if (!file) {
      setExtractError("Please select a resume file first.");
      return;
    }
    setExtracting(true);
    setExtractError(null);
    try {
      const fd = new FormData();
      fd.append("resume", file);
      const res = await fetch("/api/extract-resume", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Extraction failed.");
      }
      const data = await res.json();
      setValues((prev) => ({
        ...prev,
        firstName: data.firstName || prev.firstName,
        lastName: data.lastName || prev.lastName,
        email: data.email || prev.email,
        phone: data.phone || prev.phone,
        location: data.location || prev.location,
        linkedin: data.linkedin || prev.linkedin,
        insta: data.insta || prev.insta,
        primaryRole: data.primaryRole || prev.primaryRole,
        totalTrainingExperience: data.totalTrainingExperience != null ? String(data.totalTrainingExperience) : prev.totalTrainingExperience,
        industryExperience: data.industryExperience != null ? String(data.industryExperience) : prev.industryExperience,
        expectedChargesPerDay: data.expectedChargesPerDay || prev.expectedChargesPerDay,
        languages: data.languages || prev.languages,
        detailedExpertise: data.detailedExpertise || prev.detailedExpertise,
        areasOfExpertise: data.areasOfExpertise?.length ? data.areasOfExpertise : prev.areasOfExpertise,
        trainingTypesDelivered: data.trainingTypesDelivered?.length ? data.trainingTypesDelivered : prev.trainingTypesDelivered,
        availability: data.availability?.length ? data.availability : prev.availability,
      }));
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : "Extraction failed.");
    } finally {
      setExtracting(false);
    }
  }

  if (!hydrated) return null;

  return (
    <form
      action={formAction}
      className="space-y-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
    >
      {isEdit && d.id ? <input type="hidden" name="id" value={d.id} /> : null}

      {/* ── Personal Details ── */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <p className="text-sm font-semibold text-zinc-800">Name</p>
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="firstName">First Name</FieldLabel>
          <input
            id="firstName"
            name="firstName"
            type="text"
            value={values.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
          <input
            id="lastName"
            name="lastName"
            type="text"
            value={values.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <input
            id="email"
            name="email"
            type="email"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="phone">Phone</FieldLabel>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="linkedin">LinkedIn Profile</FieldLabel>
          <input
            id="linkedin"
            name="linkedin"
            type="url"
            value={values.linkedin}
            onChange={(e) => set("linkedin", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="insta">Instagram Profile URL</FieldLabel>
          <input
            id="insta"
            name="insta"
            type="url"
            placeholder="https://instagram.com/yourhandle"
            value={values.insta}
            onChange={(e) => set("insta", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="location">Location</FieldLabel>
          <Combobox
            id="location"
            name="location"
            defaultValue={values.location}
            key={values.location}
            options={indiaCityStates}
            placeholder="Search city, state…"
          />
        </div>
      </section>

      {/* ── Experience & Charges ── */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel htmlFor="primaryRole">Primary Role</FieldLabel>
          <select
            id="primaryRole"
            name="primaryRole"
            value={values.primaryRole}
            onChange={(e) => set("primaryRole", e.target.value)}
            className={inputClass}
          >
            <option value="">Select role</option>
            {primaryRoles.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="totalTrainingExperience">Total Training Experience</FieldLabel>
          <input
            id="totalTrainingExperience"
            name="totalTrainingExperience"
            type="number"
            min="0"
            value={values.totalTrainingExperience}
            onChange={(e) => set("totalTrainingExperience", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="industryExperience">Industry Experience</FieldLabel>
          <input
            id="industryExperience"
            name="industryExperience"
            type="number"
            min="0"
            value={values.industryExperience}
            onChange={(e) => set("industryExperience", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="expectedChargesPerDay">Expected Charges per Day</FieldLabel>
          <input
            id="expectedChargesPerDay"
            name="expectedChargesPerDay"
            type="text"
            value={values.expectedChargesPerDay}
            onChange={(e) => set("expectedChargesPerDay", e.target.value)}
            className={inputClass}
          />
        </div>
      </section>

      {/* ── Checkboxes ── */}
      <section className="grid gap-5 md:grid-cols-2">
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-zinc-800">Areas of Expertise</legend>
          <div className="grid gap-3 rounded-md border border-zinc-200 p-4">
            {expertiseAreas.map((area) => (
              <label key={area} className="flex items-center gap-3 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  name="areasOfExpertise"
                  value={area}
                  checked={values.areasOfExpertise.includes(area)}
                  onChange={() => toggleArray("areasOfExpertise", area)}
                  className="size-4 rounded border-zinc-300 text-teal-700"
                />
                {area}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-zinc-800">
            Type of Trainings You Have Delivered
          </legend>
          <div className="grid gap-3 rounded-md border border-zinc-200 p-4">
            {trainingTypes.map((type) => (
              <label key={type} className="flex items-center gap-3 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  name="trainingTypesDelivered"
                  value={type}
                  checked={values.trainingTypesDelivered.includes(type)}
                  onChange={() => toggleArray("trainingTypesDelivered", type)}
                  className="size-4 rounded border-zinc-300 text-teal-700"
                />
                {type}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-zinc-800">Availability</legend>
          <div className="grid gap-3 rounded-md border border-zinc-200 p-4">
            {availabilityOptions.map((option) => (
              <label key={option} className="flex items-center gap-3 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  name="availability"
                  value={option}
                  checked={values.availability.includes(option)}
                  onChange={() => toggleArray("availability", option)}
                  className="size-4 rounded border-zinc-300 text-teal-700"
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2">
          <FieldLabel htmlFor="languages">Languages</FieldLabel>
          <input
            id="languages"
            name="languages"
            type="text"
            value={values.languages}
            onChange={(e) => set("languages", e.target.value)}
            className={inputClass}
          />
        </div>
      </section>

      {/* ── Detailed Expertise ── */}
      <div className="space-y-2">
        <FieldLabel htmlFor="detailedExpertise">
          Detailed Areas of Expertise / Modules You Can Deliver
        </FieldLabel>
        <textarea
          id="detailedExpertise"
          name="detailedExpertise"
          rows={5}
          value={values.detailedExpertise}
          onChange={(e) => set("detailedExpertise", e.target.value)}
          className={inputClass}
        />
      </div>

      {/* ── Photo & Resume ── */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="block text-sm font-semibold text-zinc-800">Profile Photo</p>
          <PhotoPicker name="photo" existingUrl={d.photoUrl} />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="resume">
            {isEdit ? "Replace Resume" : "Resume"}
          </FieldLabel>
          {isEdit && d.resumeUrl ? (
            <p className="text-xs text-zinc-500">
              <a
                href={d.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-teal-700"
              >
                View current resume
              </a>{" "}
              — uploading a new one replaces it.
            </p>
          ) : null}
          <input
            id="resume"
            name="resume"
            type="file"
            ref={resumeInputRef}
            onChange={handleResumeChange}
            className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-zinc-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
          {!isEdit && savedFileName ? (
            <p className="text-xs text-teal-700" />
          ) : null}
          <button
            type="button"
            onClick={handleAutofill}
            disabled={extracting}
            className="mt-1 inline-flex items-center gap-2 rounded-md border border-teal-600 px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {extracting ? "Extracting..." : "⚡ Auto-fill from Resume"}
          </button>
          {extractError ? (
            <p className="text-xs text-red-600">{extractError}</p>
          ) : null}
        </div>
      </div>

      {/* ── Declaration ── */}
      {!isEdit ? (
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-zinc-800">Declaration</legend>
          <label className="flex gap-3 rounded-md border border-zinc-200 p-4 text-sm text-zinc-700">
            <input
              type="checkbox"
              name="declarationAccepted"
              className="mt-0.5 size-4 rounded border-zinc-300 text-teal-700"
            />
            <span>
              I confirm that the information shared above is accurate, and I am open to
              freelance training opportunities based on mutual agreement.
            </span>
          </label>
        </fieldset>
      ) : (
        <input type="hidden" name="declarationAccepted" value="true" />
      )}

      {state.message ? (
        <p
          aria-live="polite"
          className={`rounded-md px-3 py-2 text-sm ${
            state.success ? "bg-teal-50 text-teal-800" : "bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-md bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {pending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
