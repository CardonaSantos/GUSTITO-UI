"use client";
import type React from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  MessageSquare,
  Wifi,
  Map,
  Save,
  Check,
  X,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import axios from "axios";
import { toast } from "sonner";
const VITE_CRM_API_URL = import.meta.env.VITE_CRM_API_URL;
import ReactSelectComponent, { MultiValue } from "react-select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FormData {
  // Datos básicos
  nombre: string;
  coordenadas: string;
  ip: string;
  apellidos: string;
  telefono: string;
  direccion: string;
  dpi: string;
  observaciones: string;
  contactoReferenciaNombre: string;
  contactoReferenciaTelefono: string;
  // estadoCliente: "ACTIVO" | "INACTIVO"; // Puedes agregar más estados si lo deseas

  // Datos del servicio
  contrasenaWifi: string;
  ssidRouter: string;
  fechaInstalacion: Date | null;
  asesorId: string | null;
  servicioId: string | null;
  municipioId: string | null;
  departamentoId: string | null;
  empresaId: string;

  mascara: string;
  gateway: string;
}

interface Departamentos {
  id: number;
  nombre: string;
}

interface Municipios {
  id: number;
  nombre: string;
}

interface Servicios {
  id: number;
  nombre: string;
}

interface ServiciosInternet {
  id: number;
  nombre: string;
  velocidad: string;
}

interface FacturacionZona {
  id: number;
  nombre: string;
  velocidad: string;
  clientesCount: number;
  facturasCount: number;
}

interface contradoID {
  clienteId: number;
  idContrato: string; //UNIQUE EL CAMPO
  fechaFirma: Date | null;
  archivoContrato: string;
  observaciones: string;
}

function CreateCustomers() {
  const [openConfirm, setOpenConfirm] = useState(false);
  const [departamentos, setDepartamentos] = useState<Departamentos[]>([]);
  const [municipios, setMunicipios] = useState<Municipios[]>([]);
  const [servicios, setServicios] = useState<Servicios[]>([]);
  const [zonasFacturacion, setZonasFacturacion] = useState<FacturacionZona[]>(
    []
  );
  const [serviciosWifi, setServiciosWifi] = useState<ServiciosInternet[]>([]);

  const [fechaInstalacion, setFechaInstalacion] = useState<Date | null>(
    new Date()
  );
  //
  const [depaSelected, setDepaSelected] = useState<string | null>(null);
  const [muniSelected, setMuniSelected] = useState<string | null>(null);
  const [serviceSelected, setSeriviceSelected] = useState<string[]>([]);
  const [serviceWifiSelected, setSeriviceWifiSelected] = useState<
    string | null
  >(null);
  const [zonasFacturacionSelected, setZonasFacturacionSelected] = useState<
    string | null
  >(null);

  const getDepartamentos = async () => {
    try {
      const response = await axios.get(
        `${VITE_CRM_API_URL}/location/get-all-departamentos`
      );

      if (response.status === 200) {
        setDepartamentos(response.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getMunicipios = async () => {
    try {
      const response = await axios.get(
        `${VITE_CRM_API_URL}/location/get-municipio/${Number(depaSelected)}`
      );

      if (response.status === 200) {
        setMunicipios(response.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getServicios = async () => {
    try {
      const response = await axios.get(
        `${VITE_CRM_API_URL}/servicio/get-servicios-to-customer`
      );

      if (response.status === 200) {
        setServicios(response.data);
      }
    } catch (error) {
      console.log(error);
      toast.info("Error al conseguir servicios");
    }
  };

  const getServiciosWifi = async () => {
    try {
      const response = await axios.get(
        `${VITE_CRM_API_URL}/servicio-internet/get-services-to-customer`
      );

      if (response.status === 200) {
        setServiciosWifi(response.data);
      }
    } catch (error) {
      console.log(error);
      toast.info("Error al conseguir servicios wifi");
    }
  };

  const getFacturacionZona = async () => {
    try {
      const response = await axios.get(
        `${VITE_CRM_API_URL}/facturacion-zona/get-zonas-facturacion-to-customer`
      );

      if (response.status === 200) {
        setZonasFacturacion(response.data);
      }
    } catch (error) {
      console.log(error);
      toast.info("Error al conseguir servicios wifi");
    }
  };

  console.log("depas", departamentos);

  useEffect(() => {
    getDepartamentos();
    getServicios();
    getServiciosWifi();
    getFacturacionZona();
  }, []);

  // Obtener municipios cuando depaSelected cambia
  useEffect(() => {
    if (depaSelected) {
      getMunicipios();
    } else {
      setMunicipios([]);
      setMuniSelected(null);
    }
  }, [depaSelected]);

  console.log("el depa selected es: ", depaSelected);
  console.log("el muni selected es: ", muniSelected);
  console.log("la zonas de facturacion son: ", zonasFacturacion);
  console.log(
    "La zona de facturacion seleccionada es: ",
    zonasFacturacionSelected
  );

  interface OptionSelected {
    value: string; // Cambiar 'number' a 'string'
    label: string;
  }

  // Cambiar 'optionsDepartamentos' para mapear los departamentos a 'string' para 'value'
  const optionsDepartamentos: OptionSelected[] = departamentos.map((depa) => ({
    value: depa.id.toString(), // Asegúrate de convertir el 'id' a 'string'
    label: depa.nombre,
  }));

  const optionsMunis: OptionSelected[] = municipios.map((muni) => ({
    value: muni.id.toString(),
    label: muni.nombre,
  }));

  const optionsServices: OptionSelected[] = servicios.map((service) => ({
    value: service.id.toString(),
    label: service.nombre,
  }));

  const optionsServicesWifi: OptionSelected[] = serviciosWifi.map(
    (service) => ({
      value: service.id.toString(),
      label: service.nombre,
    })
  );

  const optionsZonasFacturacion: OptionSelected[] = zonasFacturacion
    .sort((a, b) => {
      const numA = parseInt(a.nombre.match(/\d+/)?.[0] || "0");
      const numB = parseInt(b.nombre.match(/\d+/)?.[0] || "0");
      return numA - numB;
    })
    .map((zona) => ({
      value: zona.id.toString(),
      label: `${zona.nombre} Clientes: (${zona.clientesCount}) Facturas:(${zona.facturasCount})`,
    }));

  // Manejar el cambio en el select de departamento
  const handleSelectDepartamento = (selectedOption: OptionSelected | null) => {
    setDepaSelected(selectedOption ? selectedOption.value : null);
  };

  // Manejar el cambio en el select de municipio
  const handleSelectMunicipio = (selectedOption: OptionSelected | null) => {
    setMuniSelected(selectedOption ? selectedOption.value : null);
  };
  //manejar cambio en el select de mis servicios
  const handleSelectService = (
    selectedOption: MultiValue<OptionSelected> | null
  ) => {
    setSeriviceSelected(
      selectedOption ? selectedOption.map((option) => option.value) : []
    );
  };

  //manejar cambio en el select de mis servicios wifi
  const handleSelectServiceWifi = (selectedOption: OptionSelected | null) => {
    setSeriviceWifiSelected(selectedOption ? selectedOption.value : null);
  };

  const handleSelectZonaFacturacion = (
    selectedOption: OptionSelected | null
  ) => {
    setZonasFacturacionSelected(selectedOption ? selectedOption.value : null);
  };

  // Estados para los campos del formulario
  const [formData, setFormData] = useState<FormData>({
    // Datos básicos
    nombre: "",
    coordenadas: "",
    ip: "",
    gateway: "",
    mascara: "",
    apellidos: "",
    telefono: "",
    direccion: "",
    dpi: "",
    observaciones: "",
    contactoReferenciaNombre: "",
    contactoReferenciaTelefono: "",
    // Datos del servicio
    contrasenaWifi: "",
    ssidRouter: "",
    fechaInstalacion: null as Date | null,
    asesorId: "",
    servicioId: "",
    municipioId: "",
    departamentoId: "",
    empresaId: "",
  });

  const [formDataContrado, setFormDataContrato] = useState<contradoID>({
    archivoContrato: "",
    clienteId: 0,
    fechaFirma: new Date(),
    idContrato: "".trim(),
    observaciones: "".trim(),
  });

  const handleChangeDataContrato = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormDataContrato((previaData) => ({
      ...previaData,
      [name]: value,
    }));
  };

  console.log("El form data es: ", formData);
  console.log("El serviceSelected data es: ", serviceSelected);

  console.log(setServicios, setMunicipios, setDepartamentos);

  // Manejador de cambios para los campos de texto
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const token = localStorage.getItem("tokenAuthCRM"); // O obténlo de donde sea necesario

  console.log("mi token", token);

  // Manejador para enviar el formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Asegúrate de convertir 'depaSelected' y 'muniSelected' a números si es necesario
    const formDataToSend = {
      nombre: formData.nombre.trim(),
      apellidos: formData.apellidos.trim(),
      ip: formData.ip.trim(),
      telefono: formData.telefono.trim(),
      direccion: formData.direccion.trim(),
      dpi: formData.dpi.trim(),
      observaciones: formData.observaciones.trim(),
      contactoReferenciaNombre: formData.contactoReferenciaNombre.trim(),
      contactoReferenciaTelefono: formData.contactoReferenciaTelefono.trim(),
      contrasenaWifi: formData.contrasenaWifi.trim(),
      ssidRouter: formData.ssidRouter.trim(),
      fechaInstalacion: fechaInstalacion,
      // asesorId: null,
      // servicioId: null,
      municipioId: Number(muniSelected) || null, // Convertir a número
      departamentoId: Number(depaSelected) || null, // Convertir a número
      empresaId: 1,
      // Asegúrate de que coordenadas sea un valor correcto, evitando cadenas vacías
      coordenadas:
        formData.coordenadas && formData.coordenadas !== ""
          ? formData.coordenadas.split(",").map((item) => item.trim())
          : [],

      servicesIds: serviceSelected.map((id) => parseInt(id)),
      servicioWifiId: Number(serviceWifiSelected),
      zonaFacturacionId: Number(zonasFacturacionSelected),
      //
      idContrato: formDataContrado.idContrato,
      fechaFirma: formDataContrado.fechaFirma,
      archivoContrato: formDataContrado.archivoContrato,
      observacionesContrato: formDataContrado.observaciones,
    };

    // Validar si municipio y departamento están seleccionados
    if (!formDataToSend.municipioId) {
      toast.info("Seleccione un municipio");
      return;
    }

    if (!formDataToSend.departamentoId) {
      toast.info("Seleccione un departamento");
      return;
    }

    if (!formDataToSend.zonaFacturacionId) {
      toast.warning("Debe agregar una zona de facturación");
      return;
    }

    if (!formDataToSend.servicioWifiId) {
      toast.warning("No puede crear un cliente sin asignarle un servicio");
      return;
    }

    console.log("La data enviada es: ", formDataToSend);

    try {
      const response = await axios.post(
        `${VITE_CRM_API_URL}/internet-customer/create-new-customer`,
        formDataToSend // <-- Envía los datos directamente
      );

      if (response.status === 201) {
        toast.success("Cliente creado");
        resetFormData();
        setOpenConfirm(false);
      }

      console.log("Respuesta del servidor:", response.data);
    } catch (error) {
      console.error("Error al enviar los datos:", error);
      toast.info("Revise sus datos enviados");
    }
  };

  console.log("El form data es: ", formData);

  const resetFormData = () => {
    setFormData({
      nombre: "",
      coordenadas: "",
      ip: "",
      apellidos: "",
      telefono: "",
      direccion: "",
      dpi: "",
      observaciones: "",
      contactoReferenciaNombre: "",
      contactoReferenciaTelefono: "",
      contrasenaWifi: "",
      ssidRouter: "",
      fechaInstalacion: null,
      asesorId: "",
      servicioId: "",
      municipioId: "",
      departamentoId: "",
      empresaId: "",
      gateway: "",
      mascara: "",
    });

    // Resetear formDataContrato
    setFormDataContrato({
      archivoContrato: "",
      clienteId: 0,
      fechaFirma: new Date(),
      idContrato: "",
      observaciones: "",
    });

    // Resetear los selects
    setDepaSelected(null);
    setMuniSelected(null);
    setSeriviceSelected([]);
    setSeriviceWifiSelected(null);
    setZonasFacturacionSelected(null);
    setFechaInstalacion(new Date()); // Si es necesario, puedes restablecer la fecha a su valor inicial.
  };

  return (
    <div className="container ">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="container  mx-auto px-1 py-6"
      >
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-center">
                Añadir nuevo cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Información Personal
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="nombre-all">
                        Nombres <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="nombre-all"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        placeholder="Nombre completo"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="apellidos-all">
                        Apellidos <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="apellidos-all"
                        name="apellidos"
                        value={formData.apellidos}
                        onChange={handleChange}
                        placeholder="Apellidos"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="telefono-all">Teléfono</Label>
                      <Input
                        id="telefono-all"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        placeholder="Teléfono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="dpi-all">DPI</Label>
                      <Input
                        id="dpi-all"
                        name="dpi"
                        value={formData.dpi}
                        onChange={handleChange}
                        placeholder="DPI"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="direccion-all">Dirección</Label>
                      <Textarea
                        id="direccion-all"
                        name="direccion"
                        value={formData.direccion}
                        onChange={handleChange}
                        placeholder="Dirección"
                        cols={3}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Service Information */}
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-primary" />
                    Información del Servicio
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex space-x-2">
                        {" "}
                        {/* Contenedor flexible para los tres inputs */}
                        <div className="flex-1">
                          <Label htmlFor="ip">IP</Label>
                          <Input
                            id="ip"
                            name="ip"
                            value={formData.ip}
                            onChange={handleChange}
                            placeholder="IP"
                            required
                          />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="gateway">Gateway</Label>
                          <Input
                            id="gateway"
                            name="gateway"
                            value={formData.gateway}
                            onChange={handleChange}
                            placeholder="(opcional)"
                            required
                          />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="mascara">Subnet Mask</Label>
                          <Input
                            id="mascara"
                            name="mascara"
                            value={formData.mascara}
                            onChange={handleChange}
                            placeholder="(opcional)"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="servicioWifiId-all">
                        Servicio Wifi{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <ReactSelectComponent
                        options={optionsServicesWifi}
                        onChange={handleSelectServiceWifi}
                        value={
                          serviceWifiSelected
                            ? {
                                value: serviceWifiSelected,
                                label:
                                  serviciosWifi.find(
                                    (s) =>
                                      s.id.toString() === serviceWifiSelected
                                  )?.nombre || "",
                              }
                            : null
                        }
                        className="text-sm text-black"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="servicioId-all">
                        Otros Servicios{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <ReactSelectComponent
                        isMulti={true}
                        options={optionsServices}
                        onChange={handleSelectService}
                        value={optionsServices.filter((option) =>
                          serviceSelected.includes(option.value)
                        )}
                        className="text-sm text-black"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="contrasenaWifi-all">
                        Contraseña WiFi{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="contrasenaWifi-all"
                        name="contrasenaWifi"
                        value={formData.contrasenaWifi}
                        onChange={handleChange}
                        placeholder="Contraseña WiFi"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="ssidRouter-all">SSID</Label>
                      <Input
                        id="ssidRouter-all"
                        name="ssidRouter"
                        value={formData.ssidRouter}
                        onChange={handleChange}
                        placeholder="SSID"
                      />
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Map className="h-4 w-4 text-primary" />
                    Ubicación y Contacto
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="ubicacionMaps-all">Ubicación Maps</Label>
                      <Input
                        id="coordenadas"
                        name="coordenadas"
                        value={formData.coordenadas}
                        onChange={handleChange}
                        placeholder="Coordenadas"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="departamentoId-all">Departamento</Label>
                      <ReactSelectComponent
                        options={optionsDepartamentos}
                        value={
                          depaSelected
                            ? {
                                value: depaSelected,
                                label:
                                  departamentos.find(
                                    (depa) =>
                                      depa.id.toString() === depaSelected
                                  )?.nombre || "",
                              }
                            : null
                        }
                        onChange={handleSelectDepartamento}
                        className="text-sm text-black"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="municipioId-all">Municipio</Label>
                      <ReactSelectComponent
                        options={optionsMunis}
                        onChange={handleSelectMunicipio}
                        //si el valor seleccionado, el select muestra, el objeto, value que es el seleccionado, y el label es un find, donde el seleccionado fin en el array.nombre porque nombre es el label, sino un string vacio o null
                        value={
                          muniSelected
                            ? {
                                value: muniSelected,
                                label:
                                  municipios.find(
                                    (muni) => muni.id.toString() == muniSelected
                                  )?.nombre || "",
                              }
                            : null
                        }
                        className="text-sm text-black"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="contactoReferenciaNombre-all">
                        Nombre Referencia
                      </Label>
                      <Input
                        id="contactoReferenciaNombre-all"
                        name="contactoReferenciaNombre"
                        value={formData.contactoReferenciaNombre}
                        onChange={handleChange}
                        placeholder="Nombre referencia"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="contactoReferenciaTelefono-all">
                        Teléfono Referencia
                      </Label>
                      <Input
                        id="contactoReferenciaTelefono-all"
                        name="contactoReferenciaTelefono"
                        value={formData.contactoReferenciaTelefono}
                        onChange={handleChange}
                        placeholder="Teléfono referencia"
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-3 space-y-6">
                  <div className="flex flex-col gap-4 md:grid md:grid-cols-1 md:gap-6">
                    <Accordion
                      type="single"
                      collapsible
                      className="w-full border rounded-lg shadow-sm"
                    >
                      <AccordionItem value="item-1" className="border-none">
                        <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 font-medium">
                          Detalles del contrato
                        </AccordionTrigger>
                        <AccordionContent className="px-1 pb-3">
                          <Card className="border-0 shadow-none">
                            <CardHeader className="px-4 pb-2">
                              <CardTitle className="text-lg">
                                Información de contrato
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4">
                              <div className="grid grid-cols-1 gap-5">
                                <div className="space-y-2 w-full">
                                  <Label
                                    htmlFor="idcontrato"
                                    className="font-medium"
                                  >
                                    ID de Contrato
                                  </Label>
                                  <Input
                                    type="text"
                                    id="idcontrato"
                                    value={formDataContrado.idContrato}
                                    onChange={handleChangeDataContrato}
                                    name="idContrato"
                                    placeholder="ejem: CONTRATO-910"
                                    aria-label="ID de contrato"
                                    className="w-full"
                                  />
                                </div>

                                <div className="space-y-2 w-full">
                                  <Label
                                    htmlFor="archivoContrato"
                                    className="font-medium"
                                  >
                                    Archivo contrato
                                  </Label>
                                  <Input
                                    type="text"
                                    id="archivoContrato"
                                    value={formDataContrado.archivoContrato}
                                    onChange={handleChangeDataContrato}
                                    name="archivoContrato"
                                    placeholder="Proximamente..."
                                    aria-label="Archivo de contrato"
                                    className="w-full"
                                  />
                                </div>

                                <div className="space-y-2 w-full">
                                  <Label
                                    htmlFor="fechaFirma"
                                    className="font-medium"
                                  >
                                    Fecha Firma
                                  </Label>
                                  <div className="w-full">
                                    <DatePicker
                                      className="w-full p-2 rounded-md border border-input bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                      selected={formDataContrado.fechaFirma}
                                      onChange={(date) => {
                                        setFormDataContrato((previaData) => ({
                                          ...previaData,
                                          fechaFirma: date,
                                        }));
                                      }}
                                      aria-label="Fecha de firma"
                                      id="fechaFirma"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2 w-full">
                                  <Label
                                    htmlFor="observaciones"
                                    className="font-medium"
                                  >
                                    Observaciones
                                  </Label>
                                  <Textarea
                                    id="observaciones"
                                    value={formDataContrado.observaciones}
                                    onChange={handleChangeDataContrato}
                                    name="observaciones"
                                    placeholder="Detalles de mi contrato"
                                    aria-label="Observaciones del contrato"
                                    className="w-full min-h-[100px] resize-y"
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>

                  <div className="flex flex-col gap-3 w-full p-4 border rounded-lg shadow-sm">
                    <Label
                      htmlFor="fechaInstalacion-all"
                      className="font-medium"
                    >
                      Fecha Instalación
                    </Label>
                    <div className="w-full">
                      <DatePicker
                        className="w-full p-2 rounded-md border border-input bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        selected={fechaInstalacion}
                        onChange={(date) => {
                          setFechaInstalacion(date);
                        }}
                        showTimeSelect
                        dateFormat="Pp"
                        aria-label="Fecha de instalación"
                        id="fechaInstalacion-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="zonasFacturacion-all">
                    Zonas de Facturación{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <ReactSelectComponent
                    options={optionsZonasFacturacion}
                    onChange={handleSelectZonaFacturacion}
                    value={
                      zonasFacturacionSelected
                        ? {
                            value: zonasFacturacionSelected,
                            label:
                              zonasFacturacion.find(
                                (s) =>
                                  s.id.toString() === zonasFacturacionSelected
                              )?.nombre || "",
                          }
                        : null
                    }
                    className="text-sm text-black"
                  />
                </div>

                {/* Observations - Full width */}
                <div className="md:col-span-3 space-y-2">
                  <h3 className="font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Observaciones
                  </h3>
                  <Textarea
                    id="observaciones-all"
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleChange}
                    placeholder="Observaciones adicionales"
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </CardContent>
            <div className="m-2">
              <Button
                type="button"
                onClick={() => setOpenConfirm(true)}
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
                variant={"outline"}
              >
                <Save className="mr-2 h-4 w-4" />
                Guardar Cliente
              </Button>
            </div>
          </Card>
        </form>
        {/* Confirmation Dialog */}
        <Dialog open={openConfirm} onOpenChange={setOpenConfirm}>
          <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-lg border-0 shadow-lg">
            {/* Colored accent bar at top */}

            {/* Header with icon */}
            <DialogHeader className="pt-6 px-6 pb-2">
              <DialogTitle
                className="flex items-center gap-3 text-xl font-semibold
              justify-center 
              "
              >
                <div className="bg-amber-100 dark:bg-gray-900 p-2 rounded-full">
                  <AlertCircle className="h-5 w-5 text-rose-500" />
                </div>
                Confirmación de creación
              </DialogTitle>
            </DialogHeader>

            <div className="px-6 py-4">
              <div className="border border-gray-200 dark:border-gray-800 rounded-md p-4 mb-5 bg-gray-50 dark:bg-gray-800 ">
                <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">
                  ¿Estás seguro de que deseas crear este cliente con los datos
                  proporcionados?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Por favor, revisa cuidadosamente los datos antes de proceder.
                </p>
              </div>

              <div className="h-px bg-gray-200 dark:bg-gray-800 my-4"></div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 pb-2">
                <Button
                  variant={"outline"}
                  onClick={() => setOpenConfirm(false)}
                  className="border w-full bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-600 rounded-lg py-2 hover:text-white "
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button
                  variant={"outline"}
                  onClick={handleSubmit}
                  className="bg-teal-600 text-white w-full hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600 rounded-lg py-2 hover:text-white"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Sí, continuar y crear
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}

export default CreateCustomers;
