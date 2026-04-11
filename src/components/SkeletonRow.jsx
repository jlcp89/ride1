/**
 * Renders `count` placeholder table rows with pulsing bars. Sits inside the
 * same `.ride-table` so the layout doesn't shift when the real data lands.
 */
export default function SkeletonTable({ count = 10 }) {
  return (
    <div className="table-wrap" aria-busy="true" aria-label="Loading rides">
      <div className="table-scroll">
        <table className="ride-table">
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Status</th>
              <th scope="col">Rider</th>
              <th scope="col">Driver</th>
              <th scope="col">Pickup time</th>
              <th scope="col">Events 24h</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: count }).map((_, i) => (
              <tr key={i}>
                <td>
                  <span className="skeleton-bar" style={{ '--skeleton-w': '32px' }} />
                </td>
                <td>
                  <span className="skeleton-bar" style={{ '--skeleton-w': '64px' }} />
                </td>
                <td>
                  <span className="skeleton-bar" style={{ '--skeleton-w': '140px' }} />
                </td>
                <td>
                  <span className="skeleton-bar" style={{ '--skeleton-w': '120px' }} />
                </td>
                <td>
                  <span className="skeleton-bar" style={{ '--skeleton-w': '110px' }} />
                </td>
                <td>
                  <span className="skeleton-bar" style={{ '--skeleton-w': '28px' }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
