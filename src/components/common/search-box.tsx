"use client";

/**
 * Search box that writes `?q=...` in the URL (§10.6: search, filters and
 * page live in the URL). The page (a Server Component) reads the URL and
 * asks the service for the matching rows.
 */
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchBox({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [text, setText] = useState(searchParams.get("q") ?? "");

  function apply(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (text.trim()) params.set("q", text.trim());
    else params.delete("q");
    params.delete("page"); // a new search starts at page 1
    router.replace(`?${params.toString()}`);
  }

  return (
    <form onSubmit={apply} className="relative w-full sm:max-w-xs" role="search">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pl-8"
      />
    </form>
  );
}
