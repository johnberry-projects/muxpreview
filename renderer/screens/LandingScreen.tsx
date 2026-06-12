interface LandingScreenProps {
  message: string;
  title: string;
}

export function LandingScreen({ message, title }: LandingScreenProps) {
  return (
    <main className="app-shell">
      <section className="status-panel">
        <p className="eyebrow">muxpreview</p>
        <h1>{title}</h1>
        <p>{message}</p>
      </section>
    </main>
  );
}
