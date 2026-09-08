import {
  getInterviewFlow,
  getCandidates,
  updateCandidateStage,
  Candidate,
} from "./positionService";

// Backend response is double-nested (positionController wraps a value that
// already carries positionName + interviewFlow). Fixtures mirror that shape.
const nestedResponse = (
  positionName: string,
  interviewSteps: Array<{ id: number; name: string; orderIndex: number }>,
) => ({
  interviewFlow: {
    positionName,
    interviewFlow: {
      id: 1,
      description: "Standard flow",
      interviewSteps,
    },
  },
});

const mockFetchOnce = (payload: unknown, ok = true) => {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok,
    json: async () => payload,
  }) as unknown as typeof fetch;
};

describe("positionService.getInterviewFlow", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("unwraps the double-nested response into positionName and steps", async () => {
    mockFetchOnce(
      nestedResponse("Senior Backend Engineer", [
        { id: 10, name: "Applied", orderIndex: 0 },
        { id: 11, name: "Screening", orderIndex: 1 },
      ]),
    );

    const flow = await getInterviewFlow(1);

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3010/position/1/interviewflow",
    );
    expect(flow.positionName).toBe("Senior Backend Engineer");
    expect(flow.steps).toEqual([
      { id: 10, name: "Applied", orderIndex: 0 },
      { id: 11, name: "Screening", orderIndex: 1 },
    ]);
  });

  it("sorts steps by ascending orderIndex regardless of array order", async () => {
    mockFetchOnce(
      nestedResponse("Product Manager", [
        { id: 22, name: "Technical", orderIndex: 2 },
        { id: 20, name: "Applied", orderIndex: 0 },
        { id: 21, name: "Screening", orderIndex: 1 },
      ]),
    );

    const flow = await getInterviewFlow(3);

    expect(flow.steps.map((step) => step.name)).toEqual([
      "Applied",
      "Screening",
      "Technical",
    ]);
    expect(flow.steps.map((step) => step.orderIndex)).toEqual([0, 1, 2]);
  });

  it("throws when the response is not ok", async () => {
    mockFetchOnce({}, false);

    await expect(getInterviewFlow(999)).rejects.toThrow();
  });
});

describe("positionService.getCandidates", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns the flat candidates array typed, retaining ids for HU-4", async () => {
    const payload: Candidate[] = [
      {
        fullName: "Ada Lovelace",
        currentInterviewStep: "Technical",
        currentInterviewStepId: 11,
        averageScore: 4,
        id: 20,
        applicationId: 2,
      },
    ];
    mockFetchOnce(payload);

    const candidates = await getCandidates(1);

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3010/position/1/candidates",
    );
    // Flat array, no unwrapping.
    expect(candidates).toEqual(payload);
    // ids retained on the client model even if unshown (HU-4 needs them).
    expect(candidates[0].id).toBe(20);
    expect(candidates[0].applicationId).toBe(2);
    expect(candidates[0].currentInterviewStepId).toBe(11);
  });

  it("throws when the response is not ok", async () => {
    mockFetchOnce({}, false);

    await expect(getCandidates(999)).rejects.toThrow();
  });
});

describe("positionService.updateCandidateStage", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("PUTs to /candidates/:id/stage with the numeric step id and resolves on ok", async () => {
    mockFetchOnce({ message: "Candidate stage updated successfully" });

    await expect(updateCandidateStage(7, 3, 11)).resolves.toBeUndefined();

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3010/candidates/7/stage",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: 3, currentInterviewStep: 11 }),
      },
    );
  });

  it("rejects when the response is not ok", async () => {
    mockFetchOnce({}, false);

    await expect(updateCandidateStage(7, 3, 11)).rejects.toThrow();
  });

  it("rejects when fetch fails at the network level", async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error("network")) as unknown as typeof fetch;

    await expect(updateCandidateStage(7, 3, 11)).rejects.toThrow();
  });
});
