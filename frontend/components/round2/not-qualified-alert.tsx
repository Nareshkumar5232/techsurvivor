import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Shown whenever the backend reports NOT_QUALIFIED (or the derived "locked" status) for
 *  Round 2 - the participant took Round 1 but did not meet the qualification bar. */
export function NotQualifiedAlert() {
  return (
    <Alert variant="warning" title="You did not qualify for Round 2">
      <p>Only participants who met the Round 1 qualification bar can access Round 2 problems.</p>
      <Link href="/round1/result" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3")}>
        View your Round 1 result
      </Link>
    </Alert>
  );
}
