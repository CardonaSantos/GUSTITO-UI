"use client";

import { useState } from "react";
// import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import CrmCreateTicket from "./CreateTickets/CrmCreateTicket";
import { useStoreCrm } from "../ZustandCrm/ZustandCrmContext";

interface TicketFiltersProps {
  onFilterChange: (value: string) => void;
  onStatusChange: (value: string | null) => void;
  //Para el modal
  openCreatT: boolean;
  setOpenCreateT: (value: boolean) => void;
  getTickets: () => void;
  //filter de asignados
  setSelectedAssignee: (value: string | null) => void;
  setSelectedCreator: (value: string | null) => void;
}

export default function TicketFilters({
  onFilterChange,
  onStatusChange,
  //Propiedades del create ticket
  getTickets,
  openCreatT,
  setOpenCreateT,
  //para filter select
  setSelectedAssignee,
  setSelectedCreator,
}: TicketFiltersProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const userId = useStoreCrm((state) => state.userIdCRM) ?? 0;

  const handleFilterChange = (value: string) => {
    if (value === "assignedToMe") {
      setSelectedAssignee(String(userId)); // Establece el ID del usuario asignado a ti
      setSelectedCreator(null); // Limpiar el filtro por creador
    } else if (value === "createdByMe") {
      setSelectedCreator(String(userId)); // Establece el ID del creador a ti
      setSelectedAssignee(null); // Limpiar el filtro por asignado
    } else {
      setSelectedAssignee(null); // Limpiar el filtro por asignado
      setSelectedCreator(null); // Limpiar el filtro por creador
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Input
            placeholder="Buscar"
            className="pl-8 "
            onChange={(e) => onFilterChange(e.target.value)}
          />
        </div>

        <Select onValueChange={onStatusChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Etiquetas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="urgent">Urgente</SelectItem>
            <SelectItem value="maintenance">Mantenimiento</SelectItem>
            <SelectItem value="installation">Instalación</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal sm:w-[240px]"
            >
              <span>
                {date
                  ? format(date, "PPP", { locale: es })
                  : "Seleccionar fecha"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setOpenCreateT(true);
            }}
            variant={"destructive"}
            className="h-[32px] border-2"
          >
            Crear Ticket
          </Button>
          <CrmCreateTicket
            getTickets={getTickets}
            openCreatT={openCreatT}
            setOpenCreateT={setOpenCreateT}
          />
        </div>
        <Select onValueChange={handleFilterChange}>
          <SelectTrigger className="w-[150px] h-[32px]">
            <SelectValue placeholder="Filtrar tickets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="assignedToMe">{`Asignados a mí (${userId})`}</SelectItem>
            <SelectItem value="createdByMe">{`Creados por mí (${userId})`}</SelectItem>
          </SelectContent>
        </Select>

        {/* <div className="flex flex-wrap gap-2">
          <Button className="h-[32px]" onClick={() => onStatusChange("nuevo")}>
            Nuevo
          </Button>
          <Button
            className="h-[32px]"
            onClick={() => onStatusChange("abierto")}
          >
            Abiertos
          </Button>
          <Button
            className="h-[32px]"
            onClick={() => onStatusChange("pendiente")}
          >
            Pendiente
          </Button>
          <Button
            className="h-[32px]"
            onClick={() => onStatusChange("solucionado")}
          >
            Solucionado
          </Button>
        </div> */}
      </div>
    </div>
  );
}
