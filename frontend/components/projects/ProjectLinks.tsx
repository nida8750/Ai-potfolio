interface ProjectLinksProps {
  githubUrl?: string;
  liveUrl?: string;
}

function isPublicUrl(value?: string): value is string {
  return Boolean(
    value && (value.startsWith("https://") || value.startsWith("http://")),
  );
}

export function ProjectLinks({ githubUrl, liveUrl }: ProjectLinksProps) {
  const github = isPublicUrl(githubUrl) ? githubUrl : undefined;
  const live = isPublicUrl(liveUrl) ? liveUrl : undefined;

  if (!github && !live) {
    return (
      <p className="mt-5 text-xs leading-5 text-muted">
        Public repository and live demo links will appear here when they are
        available.
      </p>
    );
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-4">
      {github ? (
        <a
          href={github}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-muted hover:text-foreground"
        >
          GitHub
        </a>
      ) : null}
      {live ? (
        <a
          href={live}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-muted hover:text-foreground"
        >
          Live Demo
        </a>
      ) : null}
    </div>
  );
}
