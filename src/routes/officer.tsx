import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/officer")({
  component: () => <Outlet />,
});
