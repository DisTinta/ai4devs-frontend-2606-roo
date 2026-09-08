import React from "react";
import { render, screen } from "@testing-library/react";
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
  currentInterviewStep: "Applied",
  currentInterviewStepId: 10,
  averageScore: 4,
  id: 7,
  applicationId: 3,
  ...overrides,
});

afterEach(() => {
  jest.resetAllMocks();
});

// jsdom has no layout/media-query engine, so these assert the responsive classes
// are applied. Real stacking/scroll at the breakpoint is validated in the E2E.
describe("PositionDetail mobile/responsive (HU-6)", () => {
  it("lays the columns container out stacked below md and horizontal-scroll at md+", async () => {
    mockGetInterviewFlow.mockResolvedValue(
      flow("Senior Backend Engineer", [
        { id: 10, name: "Applied", orderIndex: 0 },
        { id: 11, name: "Technical", orderIndex: 1 },
      ]),
    );
    mockGetCandidates.mockResolvedValue([candidate()]);

    renderAt("/positions/1");
    await screen.findByText("Ada Lovelace");

    const board = screen.getByTestId("board-columns");
    expect(board).toHaveClass("d-flex");
    expect(board).toHaveClass("flex-column"); // stacked below md
    expect(board).toHaveClass("flex-md-row"); // horizontal at md+
    expect(board).toHaveClass("overflow-x-auto"); // horizontal scroll when columns overflow

    // Each column does not shrink at md+ (so the row overflows and scrolls).
    const columns = screen.getAllByTestId("board-column");
    expect(columns).toHaveLength(2);
    columns.forEach((col) => expect(col).toHaveClass("flex-md-shrink-0"));
  });

  it("lets the header title shrink/wrap so it does not overlap the back control", async () => {
    mockGetInterviewFlow.mockResolvedValue(
      flow("A Very Long Position Title That Could Overflow On Mobile", [
        { id: 10, name: "Applied", orderIndex: 0 },
      ]),
    );
    mockGetCandidates.mockResolvedValue([]);

    renderAt("/positions/1");

    const title = await screen.findByRole("heading", { level: 2 });
    expect(title).toHaveClass("text-break");
    // Back control still present and tappable.
    expect(
      screen.getByRole("link", { name: /volver a posiciones/i }),
    ).toBeInTheDocument();
  });
});
