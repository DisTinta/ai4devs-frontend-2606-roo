import React from "react";
import { Card } from "react-bootstrap";
import { Candidate } from "../services/positionService";

const MAX_SCORE = 5;

interface CandidateCardProps {
  candidate: Candidate;
}

// Renders a candidate as a card with its name and average score. The score is
// shown both as a number and as a visual over a fixed maximum of 5, clamped and
// rounded into 0-5. A score of 0 renders as zero filled pips, never as "N/A".
const CandidateCard: React.FC<CandidateCardProps> = ({ candidate }) => {
  const filled = Math.max(
    0,
    Math.min(MAX_SCORE, Math.round(candidate.averageScore)),
  );

  return (
    <Card className="shadow-sm mb-3">
      <Card.Body>
        <Card.Title className="h6 mb-2">{candidate.fullName}</Card.Title>
        <div className="d-flex align-items-center">
          <span className="me-2">{candidate.averageScore}</span>
          <span
            role="img"
            aria-label={`${filled} de ${MAX_SCORE}`}
            className="d-inline-flex"
          >
            {Array.from({ length: MAX_SCORE }, (_, index) => {
              const isFilled = index < filled;
              return (
                <span
                  key={index}
                  data-testid={
                    isFilled ? "score-pip-filled" : "score-pip-empty"
                  }
                  aria-hidden="true"
                  className={`d-inline-block rounded-circle me-1 ${
                    isFilled ? "bg-primary" : "bg-secondary bg-opacity-25"
                  }`}
                  style={{ width: "0.75rem", height: "0.75rem" }}
                />
              );
            })}
          </span>
        </div>
      </Card.Body>
    </Card>
  );
};

export default CandidateCard;
