import { ArrowUpRight } from "lucide-react";
import type { Service } from "@/types/service";
import { Badge } from "@/components/ui/Badge";
import { GlowCard } from "@/components/ui/GlowCard";
import { ServiceIcon } from "@/components/services/ServiceIcon";

interface ServiceCardProps {
  service: Service;
  id?: string;
}

export function ServiceCard({ service, id }: ServiceCardProps) {
  const headingId = `${service.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-title`;

  return (
    <GlowCard className="flex h-full flex-col">
      <article aria-labelledby={headingId} id={id} className="flex h-full flex-col">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-purple/25 bg-purple/10 text-purple">
          <ServiceIcon name={service.icon} />
        </div>
        <h3 id={headingId} className="font-display text-xl text-ink">
          {service.title}
        </h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-muted">
          {service.description}
        </p>
        <ul className="mt-5 flex flex-wrap gap-2">
          {service.technologies.map((tech) => (
            <li key={tech}>
              <Badge>{tech}</Badge>
            </li>
          ))}
        </ul>
        <a
          href="#contact"
          className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-blue transition-colors hover:text-ink"
        >
          Explore service
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </article>
    </GlowCard>
  );
}
