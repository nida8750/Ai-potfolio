import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { Hero } from "@/components/sections/Hero";
import { Projects } from "@/components/sections/Projects";
import { Services } from "@/components/sections/Services";

/**
 * The marketing page is cached and refreshed periodically; admin mutations
 * call revalidatePath("/") so published changes appear without waiting.
 */
export const revalidate = 300;

export default function HomePage() {
  return (
    <main id="main">
      <Hero />
      <Services />
      <Projects />
      <About />
      <Contact />
    </main>
  );
}
