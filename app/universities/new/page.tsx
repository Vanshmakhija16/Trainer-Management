import { redirect } from "next/navigation";

// Back-compat redirect: adding a university now means adding an Organization.
export default function NewUniversityPage() {
  redirect("/organizations/new");
}
