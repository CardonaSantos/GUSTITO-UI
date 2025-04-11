"use client";

enum EstadoTicketSoporte {
  NUEVO = "NUEVO",
  ABIERTA = "ABIERTA",
  EN_PROCESO = "EN_PROCESO",
  PENDIENTE = "PENDIENTE",
  PENDIENTE_CLIENTE = "PENDIENTE_CLIENTE",
  PENDIENTE_TECNICO = "PENDIENTE_TECNICO",
  RESUELTA = "RESUELTA",
  CANCELADA = "CANCELADA",
  ARCHIVADA = "ARCHIVADA",
}

import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Ticket } from "./ticketTypes";
// import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import CrmCreateTicket from "./CreateTickets/CrmCreateTicket";

interface TicketListProps {
  tickets: Ticket[]; // Lista de tickets
  selectedTicketId: number | null; // ID del ticket seleccionado (debería ser un número, no un objeto Ticket)
  onSelectTicket: (ticket: Ticket) => void; // Función para seleccionar un ticket
}

export default function TicketList({
  tickets,
  selectedTicketId,
  onSelectTicket,
}: TicketListProps) {
  console.log("El id que me están pasando a la list es: ", selectedTicketId);

  const getBadgeProps = (status: EstadoTicketSoporte) => {
    switch (status) {
      case EstadoTicketSoporte.NUEVO:
        return {
          text: "Nuevo",
          bgColor: "bg-blue-50",
          textColor: "text-blue-600",
        };
      case EstadoTicketSoporte.ABIERTA:
        return {
          text: "Abierto",
          bgColor: "bg-yellow-50",
          textColor: "text-yellow-600",
        };
      case EstadoTicketSoporte.EN_PROCESO:
        return {
          text: "En Proceso",
          bgColor: "bg-green-50",
          textColor: "text-green-600",
        };
      case EstadoTicketSoporte.PENDIENTE:
        return {
          text: "Pendiente",
          bgColor: "bg-gray-50",
          textColor: "text-gray-600",
        };
      case EstadoTicketSoporte.PENDIENTE_CLIENTE:
        return {
          text: "Pendiente Cliente",
          bgColor: "bg-pink-50",
          textColor: "text-pink-600",
        };
      case EstadoTicketSoporte.PENDIENTE_TECNICO:
        return {
          text: "Pendiente Técnico",
          bgColor: "bg-teal-50",
          textColor: "text-teal-600",
        };
      case EstadoTicketSoporte.RESUELTA:
        return {
          text: "Resuelta",
          bgColor: "bg-green-50",
          textColor: "text-green-600",
        };
      case EstadoTicketSoporte.CANCELADA:
        return {
          text: "Cancelada",
          bgColor: "bg-red-50",
          textColor: "text-red-600",
        };
      case EstadoTicketSoporte.ARCHIVADA:
        return {
          text: "Archivada",
          bgColor: "bg-gray-200",
          textColor: "text-gray-600",
        };
      default:
        return {
          text: "Desconocido",
          bgColor: "bg-gray-100",
          textColor: "text-gray-500",
        };
    }
  };

  console.log("La list de tickets es: ", tickets);

  return (
    <div className="h-[calc(100vh-220px)] flex flex-col">
      <Tabs defaultValue="inbox" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-10">
          <TabsTrigger value="inbox">TODOS</TabsTrigger>
          <TabsTrigger value="enProceso">EN PROCESO</TabsTrigger>
          <TabsTrigger value="lista">RESUELTOS</TabsTrigger>
          <TabsTrigger value="archivados">ARCHIVADOS</TabsTrigger>
        </TabsList>
        <TabsContent value="inbox" className="m-0 my-1">
          <div className="overflow-y-auto h-[calc(100vh-280px)]">
            <AnimatePresence>
              {tickets.filter((ticket) => ticket).length === 0 ? (
                <div className="py-6 mx-2">
                  <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Tickets Soporte</AlertTitle>
                    <AlertDescription>
                      Actualmente no hay tickets en línea
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                tickets
                  .filter((ticket) => ticket.status !== "RESUELTA")
                  .map((ticket) => (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`border-b p-4 cursor-pointer ${
                        Number(selectedTicketId) === Number(ticket.id)
                          ? "bg-gray-100 dark:bg-gray-900"
                          : ""
                      }`}
                      onClick={() => {
                        onSelectTicket(ticket);
                        console.log("El ticket seleccionado es: ", ticket.id);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {ticket.customer
                              ? ticket.customer.name.slice(0, 2).toUpperCase()
                              : "NA"}{" "}
                            {/* Aquí se asigna las iniciales del técnico si hay asignado, si no, se muestra "NA" */}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-[13px]">
                              #{ticket.id} ·{" "}
                              {ticket.customer
                                ? ticket.customer.name
                                : "No asignado"}{" "}
                              {/* Si el ticket tiene asignado un técnico, muestra su nombre, si no, muestra "No asignado" */}
                            </div>
                            <div className="text-xs ">
                              {format(new Date(ticket.date), "d MMM yyyy", {
                                locale: es,
                              })}
                            </div>
                          </div>
                          <h3 className="font-normal text-base truncate">
                            {ticket.title}
                          </h3>
                          <p className="text-[12px] line-clamp-2">
                            {ticket.description}
                          </p>
                        </div>
                        {/* {ticket.status === "NUEVO" && ( */}
                        <div className="mt-2">
                          <Badge
                            variant="outline"
                            className={`${
                              getBadgeProps(ticket.status).bgColor
                            } ${getBadgeProps(ticket.status).text}  ${
                              getBadgeProps(ticket.status).textColor
                            } `}
                          >
                            <span className="text-[10px]">{ticket.status}</span>
                          </Badge>
                        </div>
                        {/* )} */}
                      </div>
                    </motion.div>
                  ))
              )}
            </AnimatePresence>
          </div>
        </TabsContent>
        {/* Similar for "lista" and "archivados" tabs */}
        <TabsContent value="lista" className="m-0">
          <div className="overflow-y-auto h-[calc(100vh-280px)]">
            <AnimatePresence>
              {tickets.filter((ticket) => ticket.status === "RESUELTA")
                .length === 0 ? (
                <div className="py-6 mx-2">
                  <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Resueltos</AlertTitle>
                    <AlertDescription>
                      Actualmente no hay tickets resueltos
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                tickets
                  .filter((ticket) => ticket.status === "RESUELTA")
                  .map((ticket) => (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`border-b p-4 cursor-pointer ${
                        Number(selectedTicketId) === Number(ticket.id)
                          ? "bg-gray-100 dark:bg-gray-900"
                          : ""
                      }`}
                      onClick={() => {
                        onSelectTicket(ticket);
                        console.log("El ticket seleccionado es: ", ticket.id);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {ticket.customer
                              ? ticket.customer.name.slice(0, 2).toUpperCase()
                              : "NA"}{" "}
                            {/* Aquí se asigna las iniciales del técnico si hay asignado, si no, se muestra "NA" */}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-[13px]">
                              #{ticket.id} ·{" "}
                              {ticket.customer
                                ? ticket.customer.name
                                : "No asignado"}{" "}
                              {/* Si el ticket tiene asignado un técnico, muestra su nombre, si no, muestra "No asignado" */}
                            </div>
                            <div className="text-xs ">
                              {format(new Date(ticket.date), "d MMM yyyy", {
                                locale: es,
                              })}
                            </div>
                          </div>
                          <h3 className="font-normal text-base truncate">
                            {ticket.title}
                          </h3>
                          <p className="text-[12px] line-clamp-2">
                            {ticket.description}
                          </p>
                        </div>
                        {/* {ticket.status === "NUEVO" && ( */}
                        <div className="mt-2">
                          <Badge
                            variant="outline"
                            className={`${
                              getBadgeProps(ticket.status).bgColor
                            } ${getBadgeProps(ticket.status).text}  ${
                              getBadgeProps(ticket.status).textColor
                            } `}
                            // className="bg-blue-50 text-red-400 hover:bg-blue-100 "
                          >
                            <span className="text-[10px]">{ticket.status}</span>
                          </Badge>
                        </div>
                        {/* )} */}
                      </div>
                    </motion.div>
                  ))
              )}
            </AnimatePresence>
          </div>
        </TabsContent>
        {/* ARCHIVADOS */}
        <TabsContent value="archivados" className="m-0">
          <div className="overflow-y-auto h-[calc(100vh-280px)]">
            <AnimatePresence>
              {tickets.filter((ticket) => ticket.status === "ARCHIVADA")
                .length === 0 ? (
                <div className="py-6 mx-2">
                  <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Archivados</AlertTitle>
                    <AlertDescription>
                      Actualmente no hay tickets archivados
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                tickets
                  .filter((ticket) => ticket.status === "ARCHIVADA")
                  .map((ticket) => (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`border-b p-4 cursor-pointer ${
                        Number(selectedTicketId) === Number(ticket.id)
                          ? "bg-gray-100 dark:bg-gray-900"
                          : ""
                      }`}
                      onClick={() => {
                        onSelectTicket(ticket);
                        console.log("El ticket seleccionado es: ", ticket.id);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {ticket.assignee
                              ? ticket.assignee.name.slice(0, 2).toUpperCase()
                              : "NA"}{" "}
                            {/* Aquí se asigna las iniciales del técnico si hay asignado, si no, se muestra "NA" */}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-[13px]">
                              #{ticket.id} ·{" "}
                              {ticket.assignee
                                ? ticket.assignee.name
                                : "No asignado"}{" "}
                              {/* Si el ticket tiene asignado un técnico, muestra su nombre, si no, muestra "No asignado" */}
                            </div>
                            <div className="text-xs ">
                              {format(new Date(ticket.date), "d MMM yyyy", {
                                locale: es,
                              })}
                            </div>
                          </div>
                          <h3 className="font-normal text-base truncate">
                            {ticket.title}
                          </h3>
                          <p className="text-[12px] line-clamp-2">
                            {ticket.description}
                          </p>
                        </div>
                        {/* {ticket.status === "NUEVO" && ( */}
                        <div className="mt-2">
                          <Badge
                            variant="outline"
                            className={`${
                              getBadgeProps(ticket.status).bgColor
                            } ${getBadgeProps(ticket.status).text}  ${
                              getBadgeProps(ticket.status).textColor
                            } `}
                            // className="bg-blue-50 text-red-400 hover:bg-blue-100 "
                          >
                            <span className="text-[10px]">{ticket.status}</span>
                          </Badge>
                        </div>
                        {/* )} */}
                      </div>
                    </motion.div>
                  ))
              )}
            </AnimatePresence>
          </div>{" "}
          <div className="p-4 text-center text-muted-foreground">
            No hay tickets archivados
          </div>
        </TabsContent>{" "}
        {""}
        {/* EN PRCOESO */}
        <TabsContent value="enProceso" className="m-0">
          <div className="overflow-y-auto h-[calc(100vh-280px)]">
            <AnimatePresence>
              {tickets.filter((ticket) => ticket.status === "EN_PROCESO")
                .length === 0 ? (
                <div className="py-6 mx-2">
                  <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>EN PROCESO</AlertTitle>
                    <AlertDescription>
                      Actualmente no hay tickets en proceso
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                tickets
                  .filter((ticket) => ticket.status === "EN_PROCESO")
                  .map((ticket) => (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`border-b p-4 cursor-pointer ${
                        Number(selectedTicketId) === Number(ticket.id)
                          ? "bg-gray-100 dark:bg-gray-900"
                          : ""
                      }`}
                      onClick={() => {
                        onSelectTicket(ticket);
                        console.log("El ticket seleccionado es: ", ticket.id);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {ticket.customer
                              ? ticket.customer.name.slice(0, 2).toUpperCase()
                              : "NA"}{" "}
                            {/* Aquí se asigna las iniciales del técnico si hay asignado, si no, se muestra "NA" */}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-[13px]">
                              #{ticket.id} ·{" "}
                              {ticket.customer
                                ? ticket.customer.name
                                : "No asignado"}{" "}
                              {/* Si el ticket tiene asignado un técnico, muestra su nombre, si no, muestra "No asignado" */}
                            </div>
                            <div className="text-xs ">
                              {format(new Date(ticket.date), "d MMM yyyy", {
                                locale: es,
                              })}
                            </div>
                          </div>
                          <h3 className="font-normal text-base truncate">
                            {ticket.title}
                          </h3>
                          <p className="text-[12px] line-clamp-2">
                            {ticket.description}
                          </p>
                        </div>
                        {/* {ticket.status === "NUEVO" && ( */}
                        <div className="mt-2">
                          <Badge
                            variant="outline"
                            className={`${
                              getBadgeProps(ticket.status).bgColor
                            } ${getBadgeProps(ticket.status).text}  ${
                              getBadgeProps(ticket.status).textColor
                            } `}
                            // className="bg-blue-50 text-red-400 hover:bg-blue-100 "
                          >
                            <span className="text-[10px]">{ticket.status}</span>
                          </Badge>
                        </div>
                        {/* )} */}
                      </div>
                    </motion.div>
                  ))
              )}
            </AnimatePresence>
          </div>
        </TabsContent>{" "}
      </Tabs>
    </div>
  );
}
