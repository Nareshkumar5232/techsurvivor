"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { registerSchema, type RegisterInput } from "@tech-survivor/shared";
import type { ProfileInput, UserProfile } from "@tech-survivor/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getFirebaseAuthErrorMessage } from "@/lib/auth/firebaseErrorMessage";
import { firebaseAuth } from "@/lib/firebaseClient";

const YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Other"];

export default function RegisterPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterInput) {
    setSubmitting(true);
    try {
      // If a previous attempt got as far as creating the Firebase Auth account but the profile
      // step failed (e.g. duplicate roll number), retrying should not try to create the account
      // again — just pick up at the profile step.
      if (!firebaseAuth.currentUser || firebaseAuth.currentUser.email !== values.email) {
        const credential = await createUserWithEmailAndPassword(firebaseAuth, values.email, values.password);
        await sendEmailVerification(credential.user);
      }

      const profileInput: ProfileInput = {
        fullName: values.fullName,
        institution: values.institution,
        department: values.department,
        year: values.year,
        rollNumber: values.rollNumber,
        phone: values.phone,
        ...(values.eventRegistrationId ? { eventRegistrationId: values.eventRegistrationId } : {}),
      };
      await apiClient.post<UserProfile>("/profile", profileInput);

      await refreshProfile();
      toast.success("Account created! Check your email to verify your address.");
      router.push("/dashboard");
    } catch (error) {
      toast.error(getFirebaseAuthErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Register once to take part in both rounds.</CardDescription>
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

          <Field id="email" label="Email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="password" label="Password" error={errors.password?.message}>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                aria-invalid={errors.password ? "true" : "false"}
                aria-describedby={errors.password ? "password-error" : undefined}
                {...register("password")}
              />
            </Field>
            <Field id="confirmPassword" label="Confirm password" error={errors.confirmPassword?.message}>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                aria-invalid={errors.confirmPassword ? "true" : "false"}
                aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                {...register("confirmPassword")}
              />
            </Field>
          </div>

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
            {submitting ? "Creating account..." : "Register"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-blue hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
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
