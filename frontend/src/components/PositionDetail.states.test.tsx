import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

const twoColumnFlow = () =>
  flow("Senior Backend Engineer", [
    { id: 10, name: "Applied", orderIndex: 0 },
    { id: 11, name: "Technical", orderIndex: 1 },
  ]);

const pending = <T,>() => new Promise<T>(() => {});

afterEach(() => {
  jest.resetAllMocks();
});

describe("PositionDetail board states (HU-5)", () => {
  it("shows a single loading indicator while either fetch is pending", async () => {
    mockGetInterviewFlow.mockReturnValue(pending<InterviewFlow>());
    mockGetCandidates.mockReturnValue(pending<Candidate[]>());

    renderAt("/positions/1");

    // One loading indicator, no columns / empty / error yet.
    expect(await screen.findByRole("status")).toBeInTheDocument();
    expect(screen.queryAllByRole("heading", { level: 3 })).toHaveLength(0);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText(/no hay candidatos/i)).not.toBeInTheDocument();
  });

  it("shows an error message with a Retry control when a fetch fails", async () => {
    mockGetInterviewFlow.mockRejectedValue(new Error("network"));
    mockGetCandidates.mockResolvedValue([]);

    renderAt("/positions/1");

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reintentar/i }),
    ).toBeInTheDocument();
    // Not a blank area: the shell/back control is present too.
    expect(
      screen.getByRole("link", { name: /volver a posiciones/i }),
    ).toBeInTheDocument();
  });

  it("re-issues only the failed request when Retry is clicked", async () => {
    mockGetInterviewFlow.mockResolvedValue(twoColumnFlow());
    // Candidates fail first, then succeed on retry.
    mockGetCandidates
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce([
        candidate({ id: 7, currentInterviewStepId: 10 }),
      ]);

    renderAt("/positions/1");

    await screen.findByRole("button", { name: /reintentar/i });
    // Flow fetched once, candidates once (the failed attempt).
    expect(mockGetInterviewFlow).toHaveBeenCalledTimes(1);
    expect(mockGetCandidates).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole("button", { name: /reintentar/i }));

    // Only candidates is re-issued; flow is not re-fetched.
    await screen.findByText("Ada Lovelace");
    expect(mockGetCandidates).toHaveBeenCalledTimes(2);
    expect(mockGetInterviewFlow).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders the empty message plus columns with placeholders when candidates is []", async () => {
    mockGetInterviewFlow.mockResolvedValue(twoColumnFlow());
    mockGetCandidates.mockResolvedValue([]);

    renderAt("/positions/1");

    expect(
      await screen.findByText(/no hay candidatos en esta posición/i),
    ).toBeInTheDocument();
    // Both columns still render.
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(2);
    // Each column shows a placeholder.
    expect(screen.getAllByTestId("empty-column")).toHaveLength(2);
  });

  it("shows a placeholder in an empty column while another has candidates", async () => {
    mockGetInterviewFlow.mockResolvedValue(twoColumnFlow());
    mockGetCandidates.mockResolvedValue([
      candidate({
        id: 7,
        fullName: "Ada Lovelace",
        currentInterviewStepId: 10,
      }),
    ]);

    renderAt("/positions/1");

    await screen.findByText("Ada Lovelace");
    // "Applied" (10) has the card; "Technical" (11) is empty with a placeholder
    // rendered inside its droppable column (stays a valid HU-4 drop target).
    const technical = screen
      .getByRole("heading", { level: 3, name: /technical/i })
      // eslint-disable-next-line testing-library/no-node-access
      .closest("[class*='col']") as HTMLElement;
    expect(within(technical).getByTestId("empty-column")).toBeInTheDocument();
    // Board-level empty message is NOT shown (there is a candidate).
    expect(
      screen.queryByText(/no hay candidatos en esta posición/i),
    ).not.toBeInTheDocument();
  });

  it("keeps the empty state and the error state distinct", async () => {
    // Empty success: empty message, never the error alert.
    mockGetInterviewFlow.mockResolvedValue(twoColumnFlow());
    mockGetCandidates.mockResolvedValue([]);

    const { unmount } = renderAt("/positions/1");
    expect(
      await screen.findByText(/no hay candidatos en esta posición/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    unmount();

    jest.resetAllMocks();

    // Failure: error+retry alert, never the empty message.
    mockGetInterviewFlow.mockResolvedValue(twoColumnFlow());
    mockGetCandidates.mockRejectedValue(new Error("network"));

    renderAt("/positions/1");
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reintentar/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/no hay candidatos en esta posición/i),
    ).not.toBeInTheDocument();
  });
});
