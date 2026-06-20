import Link from "next/link";
import { notFound } from "next/navigation";
import { TrainerForm } from "@/app/trainers/_components/trainer-form";
import { getTrainerById } from "@/lib/trainers";
import { updateTrainer } from "../../actions";

export default async function EditTrainerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trainer = await getTrainerById(id);
  if (!trainer) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/trainers/${trainer.id}`}
          className="text-sm font-semibold text-teal-700"
        >
          ← Back to profile
        </Link>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
          Edit Trainer
        </h2>
        <p className="mt-1 text-sm text-zinc-600">{trainer.name}</p>
      </div>

      <TrainerForm
        action={updateTrainer}
        mode="edit"
        submitLabel="Save Changes"
        defaults={{
          id: trainer.id,
          firstName: trainer.firstName,
          lastName: trainer.lastName,
          email: trainer.email,
          phone: trainer.phone,
          location: trainer.location ?? trainer.city,
          linkedin: trainer.linkedin,
          primaryRole: trainer.primaryRole,
          totalTrainingExperience: trainer.totalTrainingExperience,
          industryExperience: trainer.industryExperience,
          expectedChargesPerDay: trainer.expectedChargesPerDay,
          languages: trainer.languages,
          detailedExpertise: trainer.detailedExpertise,
          areasOfExpertise: trainer.areasOfExpertise,
          trainingTypesDelivered: trainer.trainingTypesDelivered,
          availability: trainer.availability,
          resumeUrl: trainer.resumeUrl,
          photoUrl: trainer.photoUrl,
        }}
      />
    </div>
  );
}
