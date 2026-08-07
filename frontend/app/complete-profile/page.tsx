"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { profileInputSchema, type ProfileInputParsed } from "@tech-survivor/shared";
import type { UserProfile } from "@tech-survivor/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { FullPageSpinner } from "@/components/ui/spinner";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth/AuthProvider";
import { RequireAuth } from "@/lib/auth/guards";
import { getFirebaseAuthErrorMessage } from "@/lib/auth/firebaseErrorMessage";

const YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Other"];

export default function CompleteProfilePage() {
  return (
    <RequireAuth>
      <CompleteProfileForm />
    </RequireAuth>
  );
}

function CompleteProfileForm() {
  const router = useRouter();
  const { profile, loading, refreshProfile } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileInputParsed>({ resolver: zodResolver(profileInputSchema) });

  // Prefill from any partial profile that already exists (e.g. a retry after a failed submit).
  useEffect(() => {
    if (profile) {
      reset({
        fullName: profile.fullName,
        institution: profile.institution,
        department: profile.department,
        year: profile.year,
        rollNumber: profile.rollNumber,
        phone: profile.phone,
        eventRegistrationId: profile.eventRegistrationId ?? undefined,
      });
    }
  }, [profile, reset]);

  useEffect(() => {
    if (!loading && profile?.profileComplete) {
      router.replace("/dashboard");
    }
  }, [loading, profile, router]);

  if (loading) return <FullPageSpinner label="Checking your profile..." />;
  if (profile?.profileComplete) return <FullPageSpinner label="Redirecting..." />;

  async function onSubmit(values: ProfileInputParsed) {
    setSubmitting(true);
    try {
      await apiClient.post<UserProfile>("/profile", values);
      await refreshProfile();
      toast.success("Profile completed!");
      router.push("/dashboard");
    } catch (error) {
      toast.error(getFirebaseAuthErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-12 sm:px-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Complete your profile</CardTitle>
          <CardDescription>
            We need a few more details before you can access your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Field id="fullName" label="Full name" error={errors.fullName?.message}>
              <Input
                id="fullName"
                autoComplete="name"
                aria-invalid={errors.fullName ? "true" : "false"}
                aria-describedby={errors.fullName ? "fullName-error" : undefined}
                {...register("fullName")}
              />
            </Field>

            <Field id="institution" label="Institution" error={errors.institution?.message}>
              <Input
                id="institution"
                autoComplete="organization"
                aria-invalid={errors.institution ? "true" : "false"}
                aria-describedby={errors.institution ? "institution-error" : undefined}
                {...register("institution")}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="department" label="Department" error={errors.department?.message}>
                <Input
                  id="department"
                  aria-invalid={errors.department ? "true" : "false"}
                  aria-describedby={errors.department ? "department-error" : undefined}
                  {...register("department")}
                />
              </Field>
              <Field id="year" label="Year" error={errors.year?.message}>
                <Select
                  id="year"
                  defaultValue=""
                  aria-invalid={errors.year ? "true" : "false"}
                  aria-describedby={errors.year ? "year-error" : undefined}
                  {...register("year")}
                >
                  <option value="" disabled>
                    Select year
                  </option>
                  {YEAR_OPTIONS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="rollNumber" label="Roll number" error={errors.rollNumber?.message}>
                <Input
                  id="rollNumber"
                  aria-invalid={errors.rollNumber ? "true" : "false"}
                  aria-describedby={errors.rollNumber ? "rollNumber-error" : undefined}
                  {...register("rollNumber")}
                />
              </Field>
              <Field id="phone" label="Phone number" error={errors.phone?.message}>
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  aria-invalid={errors.phone ? "true" : "false"}
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                  {...register("phone")}
                />
              </Field>
            </div>

            <Field
              id="eventRegistrationId"
              label="Event registration ID (optional)"
              error={errors.eventRegistrationId?.message}
            >
              <Input id="eventRegistrationId" {...register("eventRegistrationId")} />
            </Field>

            <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
              {submitting ? "Saving..." : "Save and continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
