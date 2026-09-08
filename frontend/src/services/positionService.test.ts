import { getInterviewFlow } from "./positionService";

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
