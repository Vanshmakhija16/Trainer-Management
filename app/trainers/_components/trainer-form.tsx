"use client";

import { useActionState } from "react";
import { Combobox } from "@/app/_components/combobox";
import { PhotoPicker } from "@/app/_components/photo-picker";
import { indiaCityStates } from "@/lib/locations";

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

function RequiredMark() {
  return <span className="text-red-600">*</span>;
}

function FieldLabel({
  children,
  htmlFor,
  optional = false,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  optional?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-semibold text-zinc-800"
    >
      {children} {optional ? null : <RequiredMark />}
    </label>
  );
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

  const has = (list: string[] | undefined, value: string) =>
    !!list?.includes(value);

  return (
    <form
      action={formAction}
      className="space-y-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
    >
      {isEdit && d.id ? (
        <input type="hidden" name="id" value={d.id} />
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <p className="text-sm font-semibold text-zinc-800">
            Name <RequiredMark />
          </p>
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="firstName">First Name</FieldLabel>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            defaultValue={d.firstName ?? ""}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            defaultValue={d.lastName ?? ""}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={d.email ?? ""}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="phone">Phone</FieldLabel>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            defaultValue={d.phone ?? ""}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="linkedin"
            className="block text-sm font-semibold text-zinc-800"
          >
            LinkedIn Profile
          </label>
          <input
            id="linkedin"
            name="linkedin"
            type="url"
            defaultValue={d.linkedin ?? ""}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="location">Location</FieldLabel>
          <Combobox
            id="location"
            name="location"
            required
            defaultValue={d.location ?? ""}
            options={indiaCityStates}
            placeholder="Search city, state…"
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel htmlFor="primaryRole">Primary Role</FieldLabel>
          <select
            id="primaryRole"
            name="primaryRole"
            required
            className={inputClass}
            defaultValue={d.primaryRole ?? ""}
          >
            <option value="" disabled>
              Select role
            </option>
            {primaryRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="totalTrainingExperience">
            Total Training Experience
          </FieldLabel>
          <input
            id="totalTrainingExperience"
            name="totalTrainingExperience"
            type="number"
            min="0"
            required
            defaultValue={d.totalTrainingExperience ?? ""}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="industryExperience">
            Industry Experience
          </FieldLabel>
          <input
            id="industryExperience"
            name="industryExperience"
            type="number"
            min="0"
            required
            defaultValue={d.industryExperience ?? ""}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="expectedChargesPerDay">
            Expected Charges per Day
          </FieldLabel>
          <input
            id="expectedChargesPerDay"
            name="expectedChargesPerDay"
            type="text"
            required
            defaultValue={d.expectedChargesPerDay ?? ""}
            className={inputClass}
          />
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-zinc-800">
            Areas of Expertise <RequiredMark />
          </legend>
          <div className="grid gap-3 rounded-md border border-zinc-200 p-4">
            {expertiseAreas.map((area) => (
              <label
                key={area}
                className="flex items-center gap-3 text-sm text-zinc-700"
              >
                <input
                  type="checkbox"
                  name="areasOfExpertise"
                  value={area}
                  defaultChecked={has(d.areasOfExpertise, area)}
                  className="size-4 rounded border-zinc-300 text-teal-700"
                />
                {area}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-zinc-800">
            Type of Trainings You Have Delivered <RequiredMark />
          </legend>
          <div className="grid gap-3 rounded-md border border-zinc-200 p-4">
            {trainingTypes.map((type) => (
              <label
                key={type}
                className="flex items-center gap-3 text-sm text-zinc-700"
              >
                <input
                  type="checkbox"
                  name="trainingTypesDelivered"
                  value={type}
                  defaultChecked={has(d.trainingTypesDelivered, type)}
                  className="size-4 rounded border-zinc-300 text-teal-700"
                />
                {type}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-zinc-800">
            Availability <RequiredMark />
          </legend>
          <div className="grid gap-3 rounded-md border border-zinc-200 p-4">
            {availabilityOptions.map((option) => (
              <label
                key={option}
                className="flex items-center gap-3 text-sm text-zinc-700"
              >
                <input
                  type="checkbox"
                  name="availability"
                  value={option}
                  defaultChecked={has(d.availability, option)}
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
            required
            defaultValue={d.languages ?? ""}
            className={inputClass}
          />
        </div>
      </section>

      <div className="space-y-2">
        <FieldLabel htmlFor="detailedExpertise">
          Detailed Areas of Expertise / Modules You Can Deliver
        </FieldLabel>
        <textarea
          id="detailedExpertise"
          name="detailedExpertise"
          rows={5}
          required
          defaultValue={d.detailedExpertise ?? ""}
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="block text-sm font-semibold text-zinc-800">
            Profile Photo
          </p>
          <PhotoPicker name="photo" existingUrl={d.photoUrl} />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="resume" optional={isEdit}>
            {isEdit ? "Replace Resume" : "Updated Resume"}
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
            required={!isEdit}
            className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-zinc-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
        </div>
      </div>

      {!isEdit ? (
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-zinc-800">
            Declaration <RequiredMark />
          </legend>
          <label className="flex gap-3 rounded-md border border-zinc-200 p-4 text-sm text-zinc-700">
            <input
              type="checkbox"
              name="declarationAccepted"
              required
              className="mt-0.5 size-4 rounded border-zinc-300 text-teal-700"
            />
            <span>
              I confirm that the information shared above is accurate, and I am
              open to freelance training opportunities based on mutual
              agreement.
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
            state.success
              ? "bg-teal-50 text-teal-800"
              : "bg-red-50 text-red-700"
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
