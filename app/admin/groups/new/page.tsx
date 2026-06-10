import { GroupSetupForm } from "@/components/groups/GroupSetupForm";

export default function NewGroupPage() {
  return (
    <main className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">New Tournament Group</h1>
      <GroupSetupForm />
    </main>
  );
}
