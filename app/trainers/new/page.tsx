import { TrainerForm } from "@/app/trainers/_components/trainer-form";
import { createTrainer } from "./actions";

export default function AddTrainerPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-teal-700">Trainers</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
          Add Trainer
        </h2>
      </div>

      <TrainerForm action={createTrainer} mode="create" submitLabel="Submit" />
    </div>
  );
}
