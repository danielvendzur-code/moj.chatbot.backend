import { ChameleonWidget } from "./components/widget/ChameleonWidget";

export default function App(): JSX.Element {
  return (
    <main className="widget-preview" aria-label="Ukážka webového asistenta">
      <div className="widget-preview__surface" aria-hidden="true" />
      <ChameleonWidget />
    </main>
  );
}
