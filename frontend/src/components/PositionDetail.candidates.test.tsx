import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import PositionDetail from "./PositionDetail";
import {
  getInterviewFlow,
  getCandidates,
  InterviewFlow,
  Candidate,
} from "../services/positionService";

jest.mock("../services/positionService");

const mockGetInterviewFlow = getInterviewFlow as jest.MockedFunction<
  typeof getInterviewFlow
>;
const mockGetCandidates = getCandidates as jest.MockedFunction<
  typeof getCandidates
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

const candidate = (overrides: Partial<Candidate> = {}): Candidate => ({
  fullName: "Ada Lovelace",
  currentInterviewStep: "Technical",
  currentInterviewStepId: 11,
  averageScore: 4,
  id: 20,
  applicationId: 2,
  ...overrides,
});

// Finds the column (Col) that owns a given stage heading, so we can assert a
// card lives inside that specific column and not a sibling.
const columnFor = (headingText: RegExp) => {
  const heading = screen.getByRole("heading", { level: 3, name: headingText });
  // eslint-disable-next-line testing-library/no-node-access
  return heading.closest("[class*='col']") as HTMLElement;
};

afterEach(() => {
  jest.resetAllMocks();
});

describe("PositionDetail candidates (HU-3)", () => {
  it("places a candidate card in the column whose step id matches currentInterviewStepId", async () => {
    mockGetInterviewFlow.mockResolvedValue(
      flow("Senior Backend Engineer", [
        { id: 10, name: "Applied", orderIndex: 0 },
        { id: 11, name: "Technical", orderIndex: 1 },
      ]),
    );
    mockGetCandidates.mockResolvedValue([
      candidate({ fullName: "Ada Lovelace", currentInterviewStepId: 11 }),
    ]);

    renderAt("/positions/1");

    await screen.findByText("Ada Lovelace");

    // Card is inside the Technical (id 11) column, not Applied (id 10).
    expect(
      within(columnFor(/technical/i)).getByText("Ada Lovelace"),
    ).toBeInTheDocument();
    expect(
      within(columnFor(/applied/i)).queryByText("Ada Lovelace"),
    ).not.toBeInTheDocument();
  });

  it("does not crash when a candidate has an unknown stage id (omitted with a console warning)", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockGetInterviewFlow.mockResolvedValue(
      flow("Senior Backend Engineer", [
        { id: 10, name: "Applied", orderIndex: 0 },
        { id: 11, name: "Technical", orderIndex: 1 },
      ]),
    );
    mockGetCandidates.mockResolvedValue([
      candidate({ fullName: "Grace Hopper", currentInterviewStepId: 99 }),
    ]);

    renderAt("/positions/1");

    // Columns render, no crash.
    expect(
      await screen.findByRole("heading", { name: /technical/i }),
    ).toBeInTheDocument();

    // Unmatched candidate is omitted from the board and a warning is emitted.
    await waitFor(() => expect(warn).toHaveBeenCalled());
    expect(screen.queryByText("Grace Hopper")).not.toBeInTheDocument();

    warn.mockRestore();
  });

  it("keeps the columns mounted with no cards when the candidates fetch fails", async () => {
    mockGetInterviewFlow.mockResolvedValue(
      flow("Senior Backend Engineer", [
        { id: 10, name: "Applied", orderIndex: 0 },
        { id: 11, name: "Technical", orderIndex: 1 },
      ]),
    );
    mockGetCandidates.mockRejectedValue(new Error("network"));

    renderAt("/positions/1");

    // Columns (HU-2) stay mounted.
    expect(
      await screen.findByRole("heading", { name: /technical/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(2);

    // No candidate cards, no crash.
    await waitFor(() =>
      expect(screen.queryByText("Ada Lovelace")).not.toBeInTheDocument(),
    );
  });
});
