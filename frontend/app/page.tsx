import { Container } from "@/components/ui/Container";
import { navigation } from "@/data/navigation";

export default function HomePage() {
  return (
    <main id="main">
      {navigation.map((item) => {
        const id = item.href.slice(1);
        return (
          <section
            key={item.href}
            id={id}
            aria-labelledby={`${id}-heading`}
            className="min-h-[70vh] border-b border-white/5 py-20"
          >
            <Container>
              <h2
                id={`${id}-heading`}
                className="font-display text-2xl text-foreground md:text-3xl"
              >
                {item.label}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
                Placeholder section for scroll and active-link testing.
              </p>
            </Container>
          </section>
        );
      })}
    </main>
  );
}
