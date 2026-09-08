import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import { mockPositions } from "./Positions";
import {
  getInterviewFlow,
  getCandidates,
  InterviewFlow,
  Candidate,
} from "../services/positionService";
import CandidateCard from "./CandidateCard";

const knownPositionIds = mockPositions.map((position) => position.id);

// Groups candidates by their numeric stage id, dropping any whose id is absent
// from the loaded flow's step ids (the documented fallback: omit + console.warn,
// per ADR 20260908). Keying on the id — not the stage name — is what makes the
// placement robust to duplicate stage names.
const groupByStageId = (
  candidates: Candidate[],
  stepIds: number[],
): Map<number, Candidate[]> => {
  const known = new Set(stepIds);
  const groups = new Map<number, Candidate[]>();

  candidates.forEach((candidate) => {
    if (!known.has(candidate.currentInterviewStepId)) {
      console.warn(
        `Candidate ${candidate.id} has an unknown stage id ${candidate.currentInterviewStepId}; omitting from the board.`,
      );
      return;
    }
    const bucket = groups.get(candidate.currentInterviewStepId) ?? [];
    bucket.push(candidate);
    groups.set(candidate.currentInterviewStepId, bucket);
  });

  return groups;
};

const PositionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const numericId = Number(id);
  const isKnown =
    Number.isInteger(numericId) && knownPositionIds.includes(numericId);

  const [flow, setFlow] = useState<InterviewFlow | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    let active = true;

    // On failure/404 the shell stays mounted and no columns render (HU-5 owns
    // the rich loading/error/empty states; HU-2 only guarantees "no crash").
    getInterviewFlow(numericId)
      .then((result) => {
        if (active) {
          setFlow(result);
        }
      })
      .catch(() => {
        if (active) {
          setFlow(null);
        }
      });

    // Candidates are fetched independently: a candidates failure leaves the
    // HU-2 columns mounted with no cards (HU-3 only guarantees "no crash").
    getCandidates(numericId)
      .then((result) => {
        if (active) {
          setCandidates(result);
        }
      })
      .catch(() => {
        if (active) {
          setCandidates([]);
        }
      });

    return () => {
      active = false;
    };
  }, [numericId]);

  const groups = flow
    ? groupByStageId(
        candidates,
        flow.steps.map((step) => step.id),
      )
    : new Map<number, Candidate[]>();

  return (
    <Container className="mt-5">
      <div className="d-flex align-items-center mb-4">
        <Link
          to="/positions"
          className="btn btn-link me-3"
          aria-label="Volver a posiciones"
        >
          ←
        </Link>
        <h2 className="mb-0">{flow ? flow.positionName : `Posición ${id}`}</h2>
      </div>
      {flow ? (
        <Row>
          {flow.steps.map((step) => (
            <Col key={step.id} className="mb-4">
              <h3 className="h5">{step.name}</h3>
              {(groups.get(step.id) ?? []).map((candidate) => (
                <CandidateCard
                  key={candidate.applicationId}
                  candidate={candidate}
                />
              ))}
            </Col>
          ))}
        </Row>
      ) : isKnown ? (
        <p className="text-muted">Detalle de la posición en construcción.</p>
      ) : (
        <p className="text-muted">Posición no encontrada.</p>
      )}
    </Container>
  );
};

export default PositionDetail;
