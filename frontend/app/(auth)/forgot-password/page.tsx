"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { sendPasswordResetEmail } from "firebase/auth";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@tech-survivor/shared";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { getFirebaseAuthErrorMessage } from "@/lib/auth/firebaseErrorMessage";
import { firebaseAuth } from "@/lib/firebaseClient";

export default function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordInput) {
    setSubmitting(true);
    try {
      await sendPasswordResetEmail(firebaseAuth, values.email);
    } catch (error) {
      // Firebase treats "user not found" as an error here, but we intentionally don't reveal
      // whether an account exists for a given email - always show the same success state.
      const code = typeof error === "object" && error && "code" in error ? (error as { code: string }).code : undefined;
      if (code !== "auth/user-not-found") {
        toast.error(getFirebaseAuthErrorMessage(error));
        setSubmitting(false);
        return;
      }
    }
    setSent(true);
    setSubmitting(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>We&apos;ll email you a link to set a new password.</CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <Alert variant="info" title="Check your inbox">
            If an account exists for that email, we&apos;ve sent a link to reset your password. It may
            take a few minutes to arrive.
          </Alert>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
              />
              {errors.email && (
                <p id="email-error" role="alert" className="text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
              {submitting ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-600">
          Remembered your password?{" "}
          <Link href="/login" className="font-medium text-brand-blue hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
