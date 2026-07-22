"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function SignIn() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/presentation";

  useEffect(() => {
    void signIn("dev", { callbackUrl });
  }, [callbackUrl]);

  return null;
}
