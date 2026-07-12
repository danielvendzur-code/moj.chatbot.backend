import { SiteAssistant } from "./components/assistant/SiteAssistant";
import { PortfolioDemo } from "./components/portfolio/PortfolioDemo";

export default function App(): JSX.Element {
  return (
    <>
      <PortfolioDemo />
      <SiteAssistant />
    </>
  );
}
