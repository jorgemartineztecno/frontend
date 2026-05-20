import ProtectedRoute from "../auth/protectedRoute";
import Dashboard from "./dashboard/Dashboard";
import RegisterService from "./service-offered/RegisterService";
import Service from "./service-offered/Service";
import RegisterCar from "./car/RegisterCar";
import Cars from "./car/Cars";
import Employees from "./Employee/Employees";
import RegisterEmployees from "./Employee/RegisterEmployee";
import Client from "./client/Client";
import RegisterClient from "./client/RegisterClient";
import Payment from "./washed/Payment";
import EmployeeForm from "./Employee/employeeForm";
import CarForm from "./car/carForm";
import ServiceForm from "./service-offered/serviceForm";
import ClientForm from "./client/ClientForm";
import WashHistory from "./washed/WashHistory";
import WashForm from "./washed/WashForm";
import EmployeePayments from "./Employee/EmployeePayments";
import PredictionForm from "./predictions/PredictionForm";
import PredictionHistory from "./predictions/PredictionHistory";
import Chat from "./chat/Chat";
import Optimization from "./optimization/Optimization";

const createProtectedElement = (Component) => (
  <ProtectedRoute>
    <Component />
  </ProtectedRoute>
);

const PrivateRoutes = [
  { path: "/dashboard", element: createProtectedElement(Dashboard) },
  {
    path: "/register-service",
    element: createProtectedElement(RegisterService),
  },
  { path: "/services", element: createProtectedElement(Service) },
  { path: "/services/new", element: createProtectedElement(ServiceForm) },
  { path: "/services/edit/:id", element: createProtectedElement(ServiceForm) },
  { path: "/register-car", element: createProtectedElement(RegisterCar) },
  { path: "/cars", element: createProtectedElement(Cars) },
  { path: "/cars/new", element: createProtectedElement(CarForm) },
  { path: "/cars/edit/:id", element: createProtectedElement(CarForm) },
  { path: "/employees", element: createProtectedElement(Employees) },
  { path: "/employees/new", element: createProtectedElement(EmployeeForm) },
  {
    path: "/employees/edit/:id",
    element: createProtectedElement(EmployeeForm),
  },
  {
    path: "/register-employees",
    element: createProtectedElement(RegisterEmployees),
  },
  { path: "/clients", element: createProtectedElement(Client) },
  { path: "/clients/new", element: createProtectedElement(ClientForm) },
  { path: "/clients/edit/:id", element: createProtectedElement(ClientForm) },
  { path: "/register-client", element: createProtectedElement(RegisterClient) },
  { path: "/washes", element: createProtectedElement(WashHistory) },
  { path: "/washes/new", element: createProtectedElement(WashForm) },
  { path: "/washes/edit/:id", element: createProtectedElement(WashForm) },
  { path: "/payments", element: createProtectedElement(EmployeePayments) },
  { path: "/predictions", element: createProtectedElement(PredictionForm) },
  {
    path: "/prediction-history",
    element: createProtectedElement(PredictionHistory),
  },
  { path: "/chat", element: createProtectedElement(Chat) },
  { path: "/optimization", element: createProtectedElement(Optimization) },
];

export default PrivateRoutes;
