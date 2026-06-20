import { redirect } from "next/navigation";

// Back-compat redirect: /universities/:id -> /organizations/:id
export default async function UniversityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/organizations/${id}`);
}
