import { EmpaqueConStock } from "./EmpaquesType";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import EmpaquesStock from "./EmpaquesStock";
const API_URL = import.meta.env.VITE_API_URL;

export default function DashboardEmpleado() {
  const [empaques, setEmpaques] = useState<EmpaqueConStock[]>([]);

  const getEmpaques = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/empaque/find-empaques-stock`
      );
      if (response.status === 200) {
        setEmpaques(response.data);
      }
    } catch (error) {
      console.log(error);
      toast.error("Error al conseguir solicitudes");
    }
  };

  useEffect(() => {
    getEmpaques();
  }, []);

  return (
    <div className="container mx-auto p-1">
      <h1 className="text-3xl font-bold text-center mb-2">Dashboard </h1>

      <EmpaquesStock empaques={empaques} />
    </div>
  );
}
