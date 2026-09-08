import React from "react";
import { render, screen, waitFor, within, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import PositionDetail from "./PositionDetail";
import {
  getInterviewFlow,
  getCandidates,
  updateCandidateStage,
  InterviewFlow,
  Candidate,
} from "../services/positionService";

jest.mock("../services/positionService");

// dnd-kit's pointer drag cannot run in jsdom (no layout/coordinates), so we mock
// @dnd-kit/core to (a) capture the DndContext onDragEnd handler and (b) record
// what data each card registered as a draggable. Tests then synthesize a drop by
// invoking onDragEnd with the ACTUAL data the component attached — so the
// component's wiring is under test, only the library's drag mechanics are stubbed.
let mockCapturedOnDragEnd:
  | ((event: {
      active: { id: number; data: { current: any } };
      over: { id: number } | null;
    }) => void)
  | null = null;
const mockDraggables = new Map<number, { data: any; disabled: boolean }>();

jest.mock("@dnd-kit/core", () => ({
  DndContext: ({ children, onDragEnd }: any) => {
    mockCapturedOnDragEnd = onDragEnd;
    return children;
  },
  useDraggable: ({ id, data, disabled }: any) => {
    mockDraggables.set(id, { data: data ?? {}, disabled: Boolean(disabled) });
    return {
      attributes: {},
      listeners: {},
      setNodeRef: () => {},
      transform: null,
      isDragging: false,
    };
  },
  useDroppable: () => ({ setNodeRef: () => {}, isOver: false }),
}));

const mockGetInterviewFlow = getInterviewFlow as jest.MockedFunction<
  typeof getInterviewFlow
>;
const mockGetCandidates = getCandidates as jest.MockedFunction<
  typeof getCandidates
>;
const mockUpdateCandidateStage = updateCandidateStage as jest.MockedFunction<
  typeof updateCandidateStage
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

const columnFor = (headingText: RegExp) => {
  const heading = screen.getByRole("heading", { level: 3, name: headingText });
  // eslint-disable-next-line testing-library/no-node-access
  return heading.closest("[class*='col']") as HTMLElement;
};

// Simulate dropping a card on a destination column using the data the component
// actually registered for that draggable.
const drop = (candidateId: number, destStepId: number) => {
  const reg = mockDraggables.get(candidateId);
  act(() => {
    mockCapturedOnDragEnd?.({
      active: { id: candidateId, data: { current: reg?.data } },
      over: { id: destStepId },
    });
  });
};

const twoColumnFlow = () =>
  flow("Senior Backend Engineer", [
    { id: 10, name: "Applied", orderIndex: 0 },
    { id: 11, name: "Technical", orderIndex: 1 },
  ]);

beforeEach(() => {
  jest.clearAllMocks();
  mockCapturedOnDragEnd = null;
  mockDraggables.clear();
});

describe("PositionDetail drag-and-drop (HU-4)", () => {
  it("persists the new stage when a card is dropped on another column", async () => {
    mockGetInterviewFlow.mockResolvedValue(twoColumnFlow());
    mockGetCandidates.mockResolvedValue([
      candidate({ id: 7, applicationId: 3, currentInterviewStepId: 10 }),
    ]);
    mockUpdateCandidateStage.mockResolvedValue(undefined);

    renderAt("/positions/1");
    await screen.findByText("Ada Lovelace");

    drop(7, 11);

    expect(mockUpdateCandidateStage).toHaveBeenCalledTimes(1);
    expect(mockUpdateCandidateStage).toHaveBeenCalledWith(7, 3, 11);

    await waitFor(() =>
      expect(
        within(columnFor(/technical/i)).getByText("Ada Lovelace"),
      ).toBeInTheDocument(),
    );
  });

  it("moves the card optimistically before the response resolves", async () => {
    mockGetInterviewFlow.mockResolvedValue(twoColumnFlow());
    mockGetCandidates.mockResolvedValue([
      candidate({ id: 7, applicationId: 3, currentInterviewStepId: 10 }),
    ]);
    // A pending promise that never settles during the assertion window.
    mockUpdateCandidateStage.mockReturnValue(new Promise<void>(() => {}));

    renderAt("/positions/1");
    await screen.findByText("Ada Lovelace");

    drop(7, 11);

    // Card is already in Technical although the request has not resolved.
    expect(
      within(columnFor(/technical/i)).getByText("Ada Lovelace"),
    ).toBeInTheDocument();
    expect(
      within(columnFor(/applied/i)).queryByText("Ada Lovelace"),
    ).not.toBeInTheDocument();
  });

  it("rolls the card back to its original column and shows an error on failure", async () => {
    mockGetInterviewFlow.mockResolvedValue(twoColumnFlow());
    mockGetCandidates.mockResolvedValue([
      candidate({ id: 7, applicationId: 3, currentInterviewStepId: 10 }),
    ]);
    mockUpdateCandidateStage.mockRejectedValue(new Error("500"));

    renderAt("/positions/1");
    await screen.findByText("Ada Lovelace");

    drop(7, 11);

    // The card returns to Applied and an error is surfaced.
    await waitFor(() =>
      expect(
        within(columnFor(/applied/i)).getByText("Ada Lovelace"),
      ).toBeInTheDocument(),
    );
    expect(
      within(columnFor(/technical/i)).queryByText("Ada Lovelace"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("issues no request and changes nothing on a same-column drop", async () => {
    mockGetInterviewFlow.mockResolvedValue(twoColumnFlow());
    mockGetCandidates.mockResolvedValue([
      candidate({ id: 7, applicationId: 3, currentInterviewStepId: 10 }),
    ]);

    renderAt("/positions/1");
    await screen.findByText("Ada Lovelace");

    drop(7, 10); // dropped back on its own column (Applied, step 10)

    expect(mockUpdateCandidateStage).not.toHaveBeenCalled();
    expect(
      within(columnFor(/applied/i)).getByText("Ada Lovelace"),
    ).toBeInTheDocument();
  });

  it("locks the in-flight card while others stay movable", async () => {
    mockGetInterviewFlow.mockResolvedValue(twoColumnFlow());
    mockGetCandidates.mockResolvedValue([
      candidate({
        id: 7,
        fullName: "Ada Lovelace",
        applicationId: 3,
        currentInterviewStepId: 10,
      }),
      candidate({
        id: 8,
        fullName: "Grace Hopper",
        applicationId: 4,
        currentInterviewStepId: 10,
      }),
    ]);
    mockUpdateCandidateStage.mockReturnValue(new Promise<void>(() => {}));

    renderAt("/positions/1");
    await screen.findByText("Ada Lovelace");

    drop(7, 11);

    // Card 7 is locked (its request is pending); card 8 remains movable.
    await waitFor(() => expect(mockDraggables.get(7)?.disabled).toBe(true));
    expect(mockDraggables.get(8)?.disabled).toBe(false);

    // A second move attempt on the locked card issues no new request.
    drop(7, 10);
    expect(mockUpdateCandidateStage).toHaveBeenCalledTimes(1);
  });
});
