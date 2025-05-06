// ✅ Requiere: html2canvas, jsPDF, dayjs, axios
// npm install html2canvas jspdf dayjs axios

import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useParams } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import "dayjs/locale/es";
import localizedFormat from "dayjs/plugin/localizedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import logo from "../../assets/GUSTITOSPNG.png";

import { VentaHistorialPDF } from "@/Types/PDF/VentaHistorialPDF";

dayjs.extend(localizedFormat);
dayjs.extend(customParseFormat);
dayjs.locale("es");

const formatDate = (fecha: string) =>
  dayjs(fecha).format("DD MMMM YYYY, hh:mm:ss A");

const Invoice = () => {
  const { id } = useParams();
  const [venta, setVenta] = useState<VentaHistorialPDF>();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const facturaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getSale = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/venta/get-sale/${id}`
        );
        if (response.status === 200) {
          setVenta(response.data);
        }
      } catch (error) {
        console.error("Error al cargar la venta", error);
      }
    };
    getSale();
  }, [id]);

  useEffect(() => {
    if (!venta || !facturaRef.current) return;

    const generarPDF = async () => {
      const canvas = await html2canvas(facturaRef.current!, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      const blob = pdf.output("blob");
      setPdfUrl(URL.createObjectURL(blob));
    };

    generarPDF();

    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [venta]);

  if (!venta) return <p className="text-center">Cargando factura...</p>;

  return (
    <div className="p-4">
      <div
        ref={facturaRef}
        className={`shadow-md rounded-lg ${pdfUrl ? "hidden" : "block"}`}
        style={{
          width: "210mm",
          minHeight: "297mm",
          margin: "0 auto",
          backgroundColor: "#ffffff",
          color: "#000000",
          filter: "invert(0)",
          colorScheme: "light",
          padding: "32px 48px", // más margen horizontal (32px vertical, 48px lateral)
        }}
      >
        {/* Header */}
        <div
          className="flex justify-between pb-4 mb-4"
          style={{ borderBottom: "1px solid #ddd" }}
        >
          <img src={logo} alt="logo" className="h-32 w-auto" />
          <div className="text-right text-sm" style={{ color: "#333333" }}>
            <p>{venta.sucursal?.direccion || "Dirección"}</p>
            <p>Tel: {venta.sucursal?.telefono || "Tel"}</p>
          </div>
        </div>

        {/* Info Boxes */}
        <div className="flex justify-between gap-3 mb-4 text-xs">
          {/* Box: Factura Info */}
          <div
            className="p-3 w-1/2 rounded"
            style={{
              borderLeft: "4px solid #c084fc", // lavanda pastel
              color: "#333333",
            }}
          >
            <p>Factura #{venta.id}</p>
            <p>Fecha: {formatDate(venta.fechaVenta)}</p>
            <p>Sucursal: {venta.sucursal?.nombre}</p>
            <p>Método de pago: {venta.metodoPago?.metodoPago}</p>
          </div>

          {/* Box: Cliente Info */}
          <div
            className="p-3 w-1/2 rounded"
            style={{
              borderLeft: "4px solid #f9a8d4", // rosa pastel
              color: "#333333",
            }}
          >
            {venta.cliente?.nombre ? (
              <>
                <p>Cliente: {venta.cliente.nombre}</p>
                <p>Teléfono: {venta.cliente.telefono || "N/A"}</p>
                <p>Dirección: {venta.cliente.direccion || "N/A"}</p>
                {venta.imei && <p>IMEI: {venta.imei}</p>}
              </>
            ) : (
              <p>Cliente: {venta.nombreClienteFinal || "CF"}</p>
            )}
          </div>
        </div>

        <div
          style={{
            borderRadius: "10px",
            overflow: "hidden",
            boxShadow: "0 0 0 1px #e0d4eb",
          }}
        >
          <table
            className="w-full mb-6"
            style={{
              fontSize: "11px",
              borderCollapse: "collapse",
              color: "#4b0055", // más vibrante que #333
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#e9d5ff" }}>
                <th className="py-2 px-3 text-left border-b border-[#ccc]">
                  Producto
                </th>
                <th className="py-2 px-3 text-right border-b border-[#ccc]">
                  Precio
                </th>
                <th className="py-2 px-3 text-center border-b border-[#ccc]">
                  Cant.
                </th>
                <th className="py-2 px-3 text-right border-b border-[#ccc]">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {venta.productos?.map((item, index) => (
                <tr
                  key={index}
                  style={{
                    backgroundColor: index % 2 === 0 ? "#fbcfe8" : "#fff1f9",
                  }}
                >
                  <td className="py-1.5 px-3 border-b border-[#e2e2e2]">
                    {item.producto?.nombre}
                  </td>
                  <td className="py-1.5 px-3 text-right border-b border-[#e2e2e2]">
                    {item.precioVenta.toLocaleString("es-GT", {
                      style: "currency",
                      currency: "GTQ",
                    })}
                  </td>
                  <td className="py-1.5 px-3 text-center border-b border-[#e2e2e2]">
                    {item.cantidad}
                  </td>
                  <td className="py-1.5 px-3 text-right border-b border-[#e2e2e2]">
                    {(item.precioVenta * item.cantidad).toLocaleString(
                      "es-GT",
                      {
                        style: "currency",
                        currency: "GTQ",
                      }
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="text-right text-sm mb-4">
          <p className="font-semibold" style={{ color: "#7e22ce" }}>
            Total:{" "}
            {venta.productos
              ?.reduce((acc, item) => acc + item.precioVenta * item.cantidad, 0)
              .toLocaleString("es-GT", {
                style: "currency",
                currency: "GTQ",
              })}
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-xs mt-6" style={{ color: "#4b5563" }}>
          <p>¡Gracias por su compra!</p>
          <p>GUSTITO - Postres & Pasteles | Delicias hechas con amor</p>
          <p>
            Facebook: Gustito Postres y Pasteles | Instagram:
            @gustito.postresypasteles
          </p>
        </div>
      </div>

      {pdfUrl && (
        <div className="mt-6">
          <iframe
            src={pdfUrl}
            className="w-full h-[80vh] border"
            title="Vista previa PDF"
          />
        </div>
      )}
    </div>
  );
};

export default Invoice;
