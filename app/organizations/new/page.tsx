import Link from "next/link";
import { NewOrganizationForm } from "./new-organization-form";

export default function NewOrganizationPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/organizations"
          className="text-sm font-semibold text-teal-700"
        >
          ← Back to organizations
        </Link>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
          Add Organization
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Universities, colleges, corporates, hospitals — all live here.
        </p>
      </div>

      <NewOrganizationForm />
    </div>
  );
}
