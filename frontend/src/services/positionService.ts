const API_BASE_URL = "http://localhost:3010";

export interface InterviewStep {
  id: number;
  name: string;
  orderIndex: number;
}

export interface InterviewFlow {
  positionName: string;
  steps: InterviewStep[];
}

// Shape returned by GET /position/:id/interviewflow. The backend double-nests:
// the controller wraps a value that already contains positionName + interviewFlow.
interface InterviewFlowResponse {
  interviewFlow: {
    positionName: string;
    interviewFlow: {
      id: number;
      description: string;
      interviewSteps: Array<{
        id: number;
        name: string;
        orderIndex: number;
        [key: string]: unknown;
      }>;
    };
  };
}

// Fetches a position's interview flow and returns a flat, orderIndex-sorted shape.
// Unwrapping the double nesting and the sort both live here, so the component
// stays a pure renderer.
export const getInterviewFlow = async (id: number): Promise<InterviewFlow> => {
  const response = await fetch(`${API_BASE_URL}/position/${id}/interviewflow`);

  if (!response.ok) {
    throw new Error("Failed to fetch the interview flow");
  }

  const data: InterviewFlowResponse = await response.json();
  const inner = data.interviewFlow.interviewFlow;

  const steps: InterviewStep[] = inner.interviewSteps
    .map((step) => ({
      id: step.id,
      name: step.name,
      orderIndex: step.orderIndex,
    }))
    .sort((a, b) => a.orderIndex - b.orderIndex);

  return {
    positionName: data.interviewFlow.positionName,
    steps,
  };
};
