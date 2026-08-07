"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { profileInputSchema } from "@tech-survivor/shared";
import { apiClient, ApiClientError } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { FullPageSpinner } from "@/components/ui/spinner";

const profileFormSchema = profileInputSchema.partial();
type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { profile, loading, refreshProfile } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (profile) {
      reset({
        fullName: profile.fullName,
        institution: profile.institution,
        department: profile.department,
        year: profile.year,
        rollNumber: profile.rollNumber,
        phone: profile.phone,
        eventRegistrationId: profile.eventRegistrationId ?? "",
      });
    }
  }, [profile, reset]);

  async function onSubmit(data: ProfileFormValues) {
    try {
      await apiClient.patch("/profile", data);
      await refreshProfile();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not update your profile. Please try again.");
    }
  }

  if (loading || !profile) {
    return <FullPageSpinner label="Loading your profile..." />;
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Keep your details up to date for certificates and communication.</p>
      </div>

      {profile.disqualified && (
        <Alert variant="error" title="Disqualified">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="destructive">Disqualified</Badge>
            <span>{profile.disqualificationReason ?? "No reason provided."}</span>
          </div>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <dt className="text-xs uppercase text-slate-400">Email</dt>
              <dd className="text-sm font-medium text-navy-900">{profile.email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Role</dt>
              <dd className="text-sm font-medium capitalize text-navy-900">{profile.role}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Status</dt>
              <dd>
                <Badge variant={profile.status === "active" ? "success" : "destructive"}>{profile.status}</Badge>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Participant Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" autoComplete="name" {...register("fullName")} />
              {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>}
            </div>
            <div>
              <Label htmlFor="institution">Institution</Label>
              <Input id="institution" {...register("institution")} />
              {errors.institution && <p className="mt-1 text-xs text-red-600">{errors.institution.message}</p>}
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Input id="department" {...register("department")} />
              {errors.department && <p className="mt-1 text-xs text-red-600">{errors.department.message}</p>}
            </div>
            <div>
              <Label htmlFor="year">Year</Label>
              <Input id="year" {...register("year")} />
              {errors.year && <p className="mt-1 text-xs text-red-600">{errors.year.message}</p>}
            </div>
            <div>
              <Label htmlFor="rollNumber">Roll Number</Label>
              <Input id="rollNumber" {...register("rollNumber")} />
              {errors.rollNumber && <p className="mt-1 text-xs text-red-600">{errors.rollNumber.message}</p>}
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" autoComplete="tel" {...register("phone")} />
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="eventRegistrationId">Event Registration ID</Label>
              <Input id="eventRegistrationId" {...register("eventRegistrationId")} />
              {errors.eventRegistrationId && (
                <p className="mt-1 text-xs text-red-600">{errors.eventRegistrationId.message}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={isSubmitting || !isDirty}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
