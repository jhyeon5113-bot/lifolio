import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { AdminLibraryReviewClient } from "./AdminLibraryReviewClient";

export default async function AdminLibraryReviewPage() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    notFound();
  }

  return <AdminLibraryReviewClient />;
}
