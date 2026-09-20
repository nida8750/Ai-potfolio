export interface Project {
  title: string;
  slug: string;
  category: string;
  description: string;
  technologies: string[];
  image?: string;
  githubUrl?: string;
  liveUrl?: string;
  featured?: boolean;
}
