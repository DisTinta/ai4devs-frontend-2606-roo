import React from "react";
import { render, screen, within } from "@testing-library/react";
import CandidateCard from "./CandidateCard";
import { Candidate } from "../services/positionService";

const candidate = (overrides: Partial<Candidate> = {}): Candidate => ({
  fullName: "Ada Lovelace",
  currentInterviewStep: "Technical",
  currentInterviewStepId: 11,
  averageScore: 4,
  id: 20,
  applicationId: 2,
  ...overrides,
});

describe("CandidateCard", () => {
  it("renders the candidate full name", () => {
    render(<CandidateCard candidate={candidate()} />);

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("shows the average score as a number and a visual filled to 4 of 5", () => {
    render(<CandidateCard candidate={candidate({ averageScore: 4 })} />);

    // Numeric score present.
    expect(screen.getByText(/4/)).toBeInTheDocument();

    // Visual over 5: an accessible group labelled with the score out of 5.
    const meter = screen.getByRole("img", { name: /4 (de|of) 5/i });
    const filled = within(meter).getAllByTestId("score-pip-filled");
    const empty = within(meter).getAllByTestId("score-pip-empty");
    expect(filled).toHaveLength(4);
    expect(empty).toHaveLength(1);
  });

  it("renders a score of 0 as zero filled of 5, never as missing data", () => {
    render(<CandidateCard candidate={candidate({ averageScore: 0 })} />);

    const meter = screen.getByRole("img", { name: /0 (de|of) 5/i });
    expect(within(meter).queryAllByTestId("score-pip-filled")).toHaveLength(0);
    expect(within(meter).getAllByTestId("score-pip-empty")).toHaveLength(5);

    expect(screen.queryByText(/N\/A/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/sin dato/i)).not.toBeInTheDocument();
  });

  it("clamps and rounds a fractional score into 0-5 for the visual", () => {
    render(<CandidateCard candidate={candidate({ averageScore: 3.5 })} />);

    const meter = screen.getByRole("img", { name: /4 (de|of) 5/i });
    expect(within(meter).getAllByTestId("score-pip-filled")).toHaveLength(4);
  });
});
