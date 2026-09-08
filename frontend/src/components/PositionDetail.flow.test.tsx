import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import PositionDetail from "./PositionDetail";
import { getInterviewFlow, InterviewFlow } from "../services/positionService";

jest.mock("../services/positionService");

const mockGetInterviewFlow = getInterviewFlow as jest.MockedFunction<
  typeof getInterviewFlow
>;

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/positions" element={<h2>Posiciones</h2>} />
        <Route path="/positions/:id" element={<PositionDetail />} />
      </Routes>
    </MemoryRouter>,
  );

const flow = (
  positionName: string,
  steps: InterviewFlow["steps"],
): InterviewFlow => ({ positionName, steps });

afterEach(() => {
  jest.resetAllMocks();
});

describe("PositionDetail interview flow (HU-2)", () => {
  it("shows the positionName as the title and one ordered column per stage", async () => {
    mockGetInterviewFlow.mockResolvedValue(
      flow("Senior Backend Engineer", [
        { id: 1, name: "Applied", orderIndex: 0 },
        { id: 2, name: "Screening", orderIndex: 1 },
        { id: 3, name: "Technical", orderIndex: 2 },
      ]),
    );

    renderAt("/positions/1");

    // Title from positionName
    expect(
      await screen.findByRole("heading", { name: /senior backend engineer/i }),
    ).toBeInTheDocument();

    // Exactly 3 columns, headers in ascending orderIndex order
    const columnHeaders = screen.getAllByRole("heading", { level: 3 });
    expect(columnHeaders.map((h) => h.textContent)).toEqual([
      "Applied",
      "Screening",
      "Technical",
    ]);
  });

  it("renders exactly one column per step (5 steps)", async () => {
    mockGetInterviewFlow.mockResolvedValue(
      flow(
        "Five Stage Role",
        Array.from({ length: 5 }, (_, i) => ({
          id: i + 1,
          name: `Stage ${i}`,
          orderIndex: i,
        })),
      ),
    );

    renderAt("/positions/1");

    await screen.findByRole("heading", { name: /five stage role/i });
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(5);
  });

  it("renders exactly one column for a single-step flow", async () => {
    mockGetInterviewFlow.mockResolvedValue(
      flow("One Stage Role", [{ id: 1, name: "Applied", orderIndex: 0 }]),
    );

    renderAt("/positions/1");

    await screen.findByRole("heading", { name: /one stage role/i });
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(1);
  });

  it("keeps the shell mounted and renders no columns when the fetch fails", async () => {
    mockGetInterviewFlow.mockRejectedValue(new Error("network"));

    renderAt("/positions/1");

    // Back control (shell) stays mounted, no crash
    expect(
      await screen.findByRole("link", { name: /volver a posiciones/i }),
    ).toBeInTheDocument();

    // No columns rendered
    await waitFor(() => {
      expect(screen.queryAllByRole("heading", { level: 3 })).toHaveLength(0);
    });
  });
});
