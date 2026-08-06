import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/officer")({
  beforeLoad: ({ context, location }) => {
    // @ts-expect-error injected
    const role = context.role;
    if (role !== "admin" && role !== "dispatcher" && role !== "officer") {
      throw new Error("Unauthorized");
    }
  },
  component: () => <Outlet />,
});
