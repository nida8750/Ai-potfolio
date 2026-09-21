import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { Hero } from "@/components/sections/Hero";
import { Projects } from "@/components/sections/Projects";
import { Services } from "@/components/sections/Services";

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
