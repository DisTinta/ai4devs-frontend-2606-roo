import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import { mockPositions } from "./Positions";
import { getInterviewFlow, InterviewFlow } from "../services/positionService";

const knownPositionIds = mockPositions.map((position) => position.id);

const PositionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const numericId = Number(id);
  const isKnown =
    Number.isInteger(numericId) && knownPositionIds.includes(numericId);

  const [flow, setFlow] = useState<InterviewFlow | null>(null);

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

    return () => {
      active = false;
    };
  }, [numericId]);

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
