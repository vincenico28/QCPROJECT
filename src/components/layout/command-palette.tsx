import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  useCameras,
  useCitations,
  useOfficers,
  useViolations,
  formatPeso,
} from "@/lib/data/traffic";
import {
  LayoutDashboard,
  Map as MapIcon,
  Video,
  FileText,
  Car,
  Users,
  CreditCard,
  BarChart3,
  Radio,
  Search,
} from "lucide-react";

const PAGES = [
  { to: "/dashboard", label: "Command Dashboard", icon: LayoutDashboard },
  { to: "/violations", label: "Violations", icon: FileText },
  { to: "/citations", label: "Citations", icon: CreditCard },
  { to: "/cameras", label: "Cameras", icon: Video },
  { to: "/map", label: "GIS Map", icon: MapIcon },
  { to: "/vehicles", label: "Vehicles", icon: Car },
  { to: "/officers", label: "Officers", icon: Users },
  { to: "/dispatch", label: "Dispatch", icon: Radio },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key && e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return { open, setOpen };
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const { data: violations = [] } = useViolations(100);
  const { data: citations = [] } = useCitations(100);
  const { data: cameras = [] } = useCameras();
  const { data: officers = [] } = useOfficers();

  const plates = useMemo(() => {
    const seen = new Map<string, number>();
    for (const v of violations) seen.set(v.plate_number, (seen.get(v.plate_number) ?? 0) + 1);
    for (const c of citations) seen.set(c.plate_number, (seen.get(c.plate_number) ?? 0) + 1);
    return [...seen.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([plate, count]) => ({ plate, count }));
  }, [violations, citations]);

  const goPlate = (plate: string) => {
    onOpenChange(false);
    void navigate({ to: "/vehicles/$plate", params: { plate } });
  };

  const go = (to: string) => {
    onOpenChange(false);
    void navigate({ to });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search plates, citations, cameras, officers…" />
      <CommandList>
        <CommandEmpty>No matches found.</CommandEmpty>

        <CommandGroup heading="Navigate">
          {PAGES.map((p) => {
            const Icon = p.icon;
            return (
              <CommandItem key={p.to} value={`nav ${p.label}`} onSelect={() => go(p.to)}>
                <Icon className="mr-2 size-4" />
                {p.label}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        {plates.length > 0 && (
          <CommandGroup heading="Plates">
            {plates.map((p) => (
              <CommandItem
                key={p.plate}
                value={`plate ${p.plate}`}
                onSelect={() => goPlate(p.plate)}
              >
                <Search className="mr-2 size-4" />
                <span className="font-mono-tab">{p.plate}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {p.count} record{p.count === 1 ? "" : "s"}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {citations.length > 0 && (
          <CommandGroup heading="Citations">
            {citations.slice(0, 10).map((c) => (
              <CommandItem
                key={c.id}
                value={`citation ${c.citation_number} ${c.plate_number} ${c.offense}`}
                onSelect={() => go("/citations")}
              >
                <CreditCard className="mr-2 size-4" />
                <span className="font-mono-tab">{c.citation_number}</span>
                <span className="ml-2 truncate text-xs text-muted-foreground">
                  {c.plate_number} · {c.offense}
                </span>
                <span className="ml-auto font-mono-tab text-xs">
                  {formatPeso(Number(c.amount))}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {cameras.length > 0 && (
          <CommandGroup heading="Cameras">
            {cameras.slice(0, 10).map((cam) => (
              <CommandItem
                key={cam.id}
                value={`camera ${cam.code} ${cam.location}`}
                onSelect={() => go(`/cameras/${cam.code}`)}
              >
                <Video className="mr-2 size-4" />
                <span className="font-mono-tab">{cam.code}</span>
                <span className="ml-2 truncate text-xs text-muted-foreground">{cam.location}</span>
                <span className="ml-auto text-[10px] uppercase text-muted-foreground">
                  {cam.status}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {officers.length > 0 && (
          <CommandGroup heading="Officers">
            {officers.slice(0, 10).map((o) => (
              <CommandItem
                key={o.id}
                value={`officer ${o.badge_number} ${o.full_name} ${o.unit}`}
                onSelect={() => go(`/officers/${o.badge_number}`)}
              >
                <Users className="mr-2 size-4" />
                <span>{o.full_name}</span>
                <span className="ml-2 font-mono-tab text-xs text-muted-foreground">
                  {o.badge_number}
                </span>
                <span className="ml-auto text-[10px] uppercase text-muted-foreground">
                  {o.on_duty ? "on duty" : "off duty"}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
