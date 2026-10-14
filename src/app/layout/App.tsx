import React, { useEffect, useState } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import GraphDataHandler from "../components/GraphDataHandler";
import {
  CssBaseline,
  Container,
  createTheme,
  darkScrollbar,
  ThemeProvider,
} from "@mui/material";

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(true);
  const paletteType = darkMode ? "dark" : "light";

  const theme = createTheme({
    palette: {
      mode: paletteType,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: paletteType === "dark" ? darkScrollbar() : null,
        },
      },
      MuiPopover: {
        styleOverrides: {
          root: {
            zIndex: 1600,
          },
        },
      },
      MuiModal: {
        styleOverrides: {
          root: {
            zIndex: 1600,
          },
        },
      },
    },
  });

  function handleThemeChange() {
    setDarkMode(!darkMode);
    localStorage.setItem("theme", darkMode ? "light" : "dark");
  }

  useEffect(() => {
    const currentTheme = localStorage.getItem("theme");
    setDarkMode(currentTheme === "dark");
  }, []);



  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Container disableGutters maxWidth={false}>
          <CssBaseline />

          <Routes>
            <Route path="/" element={<Navigate to="/upload" replace />} />
            <Route
              path="/upload"
              element={
                <GraphDataHandler
                  darkMode={darkMode}
                  onToggleTheme={handleThemeChange}
                />
              }
            />
            <Route
              path="/graph"
              element={
                <GraphDataHandler
                  darkMode={darkMode}
                  onToggleTheme={handleThemeChange}
                />
              }
            />
            <Route
              path="/data"
              element={
                <GraphDataHandler
                  darkMode={darkMode}
                  onToggleTheme={handleThemeChange}
                />
              }
            />
            <Route path="*" element={<Navigate to="/upload" replace />} />
          </Routes>
        </Container>
      </Router>
    </ThemeProvider>
  );
};

export default App;
