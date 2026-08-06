import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

import appCss from "../styles.css?url";
import { AppShell } from "@/components/layout/app-shell";
import { OfficerShell } from "@/components/layout/officer-shell";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          404 · Signal lost
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-foreground">Route not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you are looking for is not registered in the operations grid.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90"
        >
          Return to Command
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-danger">System fault</p>
        <h1 className="mt-4 text-2xl font-semibold text-foreground">This panel didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Try again or return to the command dashboard.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-lg border border-border-strong bg-panel px-4 py-2 text-sm font-medium text-foreground hover:bg-panel-elevated"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        title: "QC Traffic Ops — AI Enforcement Command · Quezon City LGU",
      },
      {
        name: "description",
        content:
          "Real-time AI traffic violation detection, IoT camera monitoring, digital citations and online payment for the Quezon City LGU.",
      },
      { name: "author", content: "Quezon City LGU" },
      { name: "theme-color", content: "#020617" },
      {
        property: "og:title",
        content: "QC Traffic Ops — AI Enforcement Command",
      },
      {
        property: "og:description",
        content:
          "Live AI violation detection, CCTV monitoring, and digital citations for Quezon City.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/qc-favicon.webp", type: "image/webp" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
        integrity: "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=",
        crossOrigin: "",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const isOfficerRoute = pathname === "/officer" || pathname.startsWith("/officer/");
  const Shell = isOfficerRoute ? OfficerShell : AppShell;

  return (
    <QueryClientProvider client={queryClient}>
      <Shell>
        <Outlet />
      </Shell>
      <Toaster />
    </QueryClientProvider>
  );
}
