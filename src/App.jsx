import HomeComponent from "./home";
import { ThemeProvider } from "./providers/theme-provider";

function App() {
  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <HomeComponent />
      </ThemeProvider>
    </>
  );
}

export default App;
