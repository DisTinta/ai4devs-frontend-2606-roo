import React from "react";
import { Container } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import { mockPositions } from "./Positions";

const knownPositionIds = mockPositions.map((position) => position.id);

const PositionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const numericId = Number(id);
  const isKnown =
    Number.isInteger(numericId) && knownPositionIds.includes(numericId);

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
        <h2 className="mb-0">Posición {id}</h2>
      </div>
      {isKnown ? (
        <p className="text-muted">Detalle de la posición en construcción.</p>
      ) : (
        <p className="text-muted">Posición no encontrada.</p>
      )}
    </Container>
  );
};

export default PositionDetail;
