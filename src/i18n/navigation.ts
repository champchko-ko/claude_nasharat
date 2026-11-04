import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Framework adapter: next-intl requires this destructured export shape.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
