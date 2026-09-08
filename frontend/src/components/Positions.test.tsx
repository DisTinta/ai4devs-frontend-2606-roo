import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import Positions from "./Positions";

const LocationProbe: React.FC = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

const renderPositions = () =>
  render(
    <MemoryRouter initialEntries={["/positions"]}>
      <Routes>
        <Route path="/positions" element={<Positions />} />
        <Route path="/positions/:id" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );

describe("Positions list", () => {
  it('navigates to the position detail route when "Ver proceso" is activated', async () => {
    renderPositions();

    const verProceso = screen.getAllByRole("link", { name: /ver proceso/i });
    await userEvent.click(verProceso[0]);

    expect(screen.getByTestId("location")).toHaveTextContent("/positions/1");
  });

  it.each([
    [1, "/positions/1"],
    [2, "/positions/2"],
    [3, "/positions/3"],
  ])(
    'navigates with card %i\'s stable id to "%s"',
    async (index, expectedPath) => {
      renderPositions();

      const verProceso = screen.getAllByRole("link", { name: /ver proceso/i });
      await userEvent.click(verProceso[index - 1]);

      expect(screen.getByTestId("location")).toHaveTextContent(expectedPath);
    },
  );
});
