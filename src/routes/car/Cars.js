import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../api/apiService';
import DataTable from '../../components/DataTable';

const Cars = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCars = async () => {
    try {
      const data = await apiService.getCars();
      setCars(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  const columns = [
    { key: 'licencePlate', title: 'Placa' },
    { key: 'make', title: 'Marca' },
    { key: 'color', title: 'Color' },
    { 
      key: 'actions',
      title: 'Acciones',
      render: (car) => (
        <div className="actions">
          {/* <button onClick={() => navigate(`/cars/edit/${car.licencePlate}`)}>
            Editar
          </button> */}
          <button onClick={() => handleDelete(car)}>
            Eliminar
          </button>
        </div>
      )
    }
  ];
   const handleDelete = async ({id}) => {
      if (window.confirm('¿Está seguro de eliminar este registro vehiculo? ')) {
        try {
          await apiService.deleteCar(id);
        } catch (err) {
          console.error(err);
        }finally{
          fetchCars()
        }
      }
    };

  if (loading) return <div>Cargando vehículos...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Vehículos Registrados</h2>
        <button onClick={() => navigate('/cars/new')}>
          + Nuevo Vehículo
        </button>
      </div>
      <DataTable 
        columns={columns} 
        data={cars} 
        emptyMessage="No hay vehículos registrados"
      />
    </div>
  );
};

export default Cars;