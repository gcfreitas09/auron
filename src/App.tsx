import Orb from "./components/Orb";
import SystemHeader from "./components/SystemHeader";

function App() {
  return (
    <main className="app-shell">
      <div className="app-background" aria-hidden="true">
        <div className="app-gradient app-gradient-primary" />
        <div className="app-gradient app-gradient-secondary" />
        <div className="app-grid" />
        <div className="app-noise" />
      </div>

      <section className="auron-stage" aria-label="AURON interface">
        <SystemHeader />
        <Orb />
      </section>
    </main>
  );
}

export default App;
