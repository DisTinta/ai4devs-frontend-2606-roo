import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import PositionDetail from "./PositionDetail";

const LocationProbe: React.FC = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/positions"
          element={
            <div>
              <h2>Posiciones</h2>
              <LocationProbe />
            </div>
          }
        />
        <Route path="/positions/:id" element={<PositionDetail />} />
      </Routes>
    </MemoryRouter>,
  );

describe("PositionDetail", () => {
  it("renders the id from the route param in a heading (deep link)", () => {
    renderAt("/positions/2");

    expect(screen.getByRole("heading", { name: /2/ })).toBeInTheDocument();
  });

  it("returns to the positions list when the back control is activated", async () => {
    renderAt("/positions/3");

    await userEvent.click(
      screen.getByRole("link", { name: /volver a posiciones/i }),
    );

    expect(screen.getByTestId("location")).toHaveTextContent("/positions");
    expect(
      screen.getByRole("heading", { name: /posiciones/i }),
    ).toBeInTheDocument();
  });

  it("renders the shell with a not-found message for an unknown id, back still works", () => {
    renderAt("/positions/does-not-exist");

    // Shell present: title heading + back control, no crash
    expect(
      screen.getByRole("heading", { name: /posición/i }),
    ).toBeInTheDocument();
    const back = screen.getByRole("link", { name: /volver a posiciones/i });
    expect(back).toHaveAttribute("href", "/positions");
    // Neutral not-found message
    expect(screen.getByText(/no encontrada/i)).toBeInTheDocument();
  });

  it("adds no global chrome (navbar/footer) to the detail view", () => {
    renderAt("/positions/2");

    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
  });
});
