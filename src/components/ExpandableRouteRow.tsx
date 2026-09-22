import { Box, ChevronRight, Clock3, Info, MapPin, Package, Pencil, Truck, UserRound, Warehouse } from "lucide-react";
import { useState } from "react";
import type { RouteStop } from "../mocks/mockRouteStops";

export interface RouteSummary {
  distance: string;
  driver: string;
  duration: string;
  id: string;
  packages: string;
  pickupPoints: string;
  routeNo: string;
  status?: "alert";
  vehicle: string;
  volume: string;
  weight: string;
}

interface ExpandableRouteRowProps {
  route: RouteSummary;
  stops: RouteStop[];
}

export function ExpandableRouteRow({ route, stops }: ExpandableRouteRowProps) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = `route-stop-details-${route.id}`;

  return (
    <article className={`UseCaseRouteRow${expanded ? " is-expanded" : ""}`}>
      <div className="UseCaseRouteRow__summary">
        <button
          aria-controls={detailsId}
          aria-expanded={expanded}
          aria-label={`${expanded ? "Collapse" : "Expand"} ${route.routeNo}`}
          className="UseCaseRouteRow__expand"
          onClick={() => setExpanded((current) => !current)}
          type="button"
        >
          <ChevronRight aria-hidden="true" size={16} strokeWidth={1.75} />
        </button>

        <div className="UseCaseRouteRow__actions">
          <strong>
            <span />
            {route.routeNo}
          </strong>
          <button className="UseCaseRouteRow__dispatch" type="button">
            Dispatch route
          </button>
          <button className="UseCaseRouteRow__only" type="button">
            View it only
          </button>
        </div>

        <div className="UseCaseRouteRow__overview">
          <p>
            <Clock3 size={14} />
            <span>Est.Duration:</span>
            <em>{route.duration}</em>
          </p>
          <p>
            <MapPin size={14} />
            <span>Est.Distance:</span>
            <em>{route.distance}</em>
          </p>
          <p>
            <Warehouse size={14} />
            <span>{route.pickupPoints}</span>
          </p>
          <p>
            <Package size={14} />
            <span>{route.packages}</span>
          </p>
          <p>
            <Box size={14} />
            <span>{route.volume}</span>
          </p>
          <p>
            <Box size={14} />
            <span>{route.weight}</span>
          </p>
          <p>
            <Truck size={14} />
            <span>{route.vehicle}</span>
            <Info size={13} />
          </p>
          <p className={route.status === "alert" ? "is-alert" : undefined}>
            <UserRound size={14} />
            <span>{route.driver}</span>
            <Pencil size={13} />
          </p>
        </div>
      </div>

      <div aria-hidden={!expanded} className="UseCaseRouteRow__details" id={detailsId}>
        <div className="UseCaseRouteRow__detailsClip">
          <div className="UseCaseRouteStopTableWrap">
            <table className="UseCaseRouteStopTable">
              <colgroup>
                <col className="UseCaseRouteStopTable__number" />
                <col className="UseCaseRouteStopTable__address" />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">No.</th>
                  <th scope="col">Address name</th>
                  <th scope="col">Qty</th>
                  <th scope="col">Pallets</th>
                  <th scope="col">Scan type</th>
                  <th scope="col">ETA</th>
                  <th scope="col">Weight</th>
                  <th scope="col">Volume</th>
                </tr>
              </thead>
              <tbody>
                {stops.map((stop, index) => (
                  <tr key={stop.id}>
                    <td>{index + 1}</td>
                    <td title={stop.addressName}>{stop.addressName}</td>
                    <td>{stop.qty}</td>
                    <td>{stop.pallets}</td>
                    <td>{stop.scanType}</td>
                    <td>{stop.eta}</td>
                    <td>{stop.weight}</td>
                    <td>{stop.volume}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </article>
  );
}
