import React, { useState, useEffect } from 'react';
import './DataTable.css';

const DOTS = '…';

function getPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, DOTS, total];
  if (current >= total - 3) return [1, DOTS, total - 4, total - 3, total - 2, total - 1, total];
  return [1, DOTS, current - 1, current, current + 1, DOTS, total];
}

const DataTable = ({
  columns = [],
  data = [],
  emptyMessage = 'No hay datos disponibles',
  onDelete,
  onEdit,
  pageSize = 8,
  searchPlaceholder = 'Buscar...',
}) => {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setPage(1);
  }, [data.length, query]);

  const filtered = query.trim()
    ? data.filter((row) =>
        Object.values(row).some((val) =>
          String(val ?? '').toLowerCase().includes(query.toLowerCase())
        )
      )
    : data;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageData = filtered.slice(start, start + pageSize);
  const pageRange = getPageRange(safePage, totalPages);
  const hasActions = onDelete || onEdit;

  return (
    <div className="dt-wrapper">
      {/* ── Barra de búsqueda ── */}
      <div className="dt-search-bar">
        <svg className="dt-search-icon" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          className="dt-search-input"
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button className="dt-search-clear" onClick={() => setQuery('')} title="Limpiar">
            ✕
          </button>
        )}
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="dt-num-col">#</th>
              {columns.map((col) => (
                <th key={col.key}>{col.title}</th>
              ))}
              {hasActions && <th className="dt-actions-head">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {pageData.length > 0 ? (
              pageData.map((item, idx) => (
                <tr key={item.id || item.licencePlate}>
                  <td className="dt-num-col dt-num-cell">{start + idx + 1}</td>
                  {columns.map((col) => (
                    <td
                      key={`${item.id || item.licencePlate}-${col.key}`}
                      data-label={col.title}
                    >
                      {col.render ? col.render(item) : item[col.key]}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="actions-cell" data-label="Acciones">
                      {onEdit && (
                        <button onClick={() => onEdit(item)} className="edit-button">
                          Editar
                        </button>
                      )}
                      {onDelete && (
                        <button onClick={() => onDelete(item)} className="delete-button">
                          Eliminar
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (hasActions ? 2 : 1)}
                  className="dt-empty"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data.length > 0 && (
        <div className="dt-footer">
          <span className="dt-info">
            {filtered.length === 0
              ? `Sin resultados para "${query}"`
              : query
                ? `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''} · mostrando ${start + 1}–${Math.min(start + pageSize, filtered.length)}`
                : `Mostrando ${start + 1}–${Math.min(start + pageSize, filtered.length)} de ${filtered.length} registros`}
          </span>

          {totalPages > 1 && (
            <div className="dt-pagination">
              <button
                className="pg-btn"
                onClick={() => setPage(1)}
                disabled={safePage === 1}
                title="Primera"
              >
                «
              </button>
              <button
                className="pg-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                title="Anterior"
              >
                ‹
              </button>

              {pageRange.map((p, i) =>
                p === DOTS ? (
                  <span key={`d${i}`} className="pg-dots">
                    {DOTS}
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`pg-btn${p === safePage ? ' pg-active' : ''}`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                className="pg-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                title="Siguiente"
              >
                ›
              </button>
              <button
                className="pg-btn"
                onClick={() => setPage(totalPages)}
                disabled={safePage === totalPages}
                title="Última"
              >
                »
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataTable;
