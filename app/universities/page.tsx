import { redirect } from "next/navigation";

// Universities are now modeled as Organizations (type=UNIVERSITY). This route
// is kept only so old links/bookmarks keep working.
export default function UniversitiesPage() {
  redirect("/organizations");
}
