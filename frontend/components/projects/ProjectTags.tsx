import { Badge } from "@/components/ui/Badge";

interface ProjectTagsProps {
  technologies: string[];
}

export function ProjectTags({ technologies }: ProjectTagsProps) {
  return (
    <ul className="flex flex-wrap gap-2">
      {technologies.map((tech) => (
        <li key={tech}>
          <Badge>{tech}</Badge>
        </li>
      ))}
    </ul>
  );
}
