import React from "react";
import {
  Image,
  Text,
  View,
  Page,
  Document,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import logo from "../../assets/logoNvPNG.png";
import { VentaHistorialPDF } from "@/Types/PDF/VentaHistorialPDF";
import dayjs from "dayjs";
import "dayjs/locale/es";
import localizedFormat from "dayjs/plugin/localizedFormat";

dayjs.extend(localizedFormat);
dayjs.locale("es");

// Registrar fuentes personalizadas
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf",
      fontWeight: 300,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf",
      fontWeight: 500,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: 700,
    },
  ],
});

const formatearFecha = (fecha: string) => {
  return dayjs(fecha).format("DD/MM/YYYY");
};

interface GarantiaProps {
  venta: VentaHistorialPDF | undefined;
}
const Garantia: React.FC<GarantiaProps> = ({ venta }) => {
  const styles = StyleSheet.create({
    page: {
      fontFamily: "Roboto",
      fontSize: 10,
      padding: 30,
      backgroundColor: "#FFFFFF",
      lineHeight: 1.4,
    },
    header: {
      flexDirection: "column",
      alignItems: "center",
      marginBottom: 10,
    },
    logo: {
      width: 90,
      height: 50,
      marginBottom: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#fcb100",
      textAlign: "center",
    },
    section: {
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: "bold",
      marginBottom: 3,
      color: "#333",
      textAlign: "left",
    },
    row: {
      flexDirection: "row",
      marginBottom: 2,
    },
    label: {
      fontWeight: "bold",
      width: "40%",
      color: "#555",
    },
    value: {
      width: "60%",
      color: "#333",
    },
    terms: {
      marginTop: 5,
      fontSize: 9,
      lineHeight: 1.4,
    },
    signatureSection: {
      marginTop: 15,
      alignItems: "center",
      textAlign: "center",
    },
    signatureLine: {
      marginTop: 15,
      borderTopWidth: 1,
      borderColor: "#000000",
      width: "70%",
      alignSelf: "center",
    },
    footer: {
      marginTop: 10,
      fontSize: 9,
      textAlign: "center",
      color: "#555",
    },
  });

  return (
    <Document>
      {venta?.productos.map((producto, index) => (
        <Page key={index} size="A4" style={styles.page}>
          {/* Header */}
          <View style={styles.header}>
            <Image src={logo} style={styles.logo} />
            <Text style={styles.title}>Comprobante de Garantía</Text>
          </View>

          {/* Detalles de la Venta */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalles de la Venta</Text>
            <View style={styles.row}>
              <Text style={styles.label}>No. Garantía:</Text>
              <Text style={styles.value}>
                {venta?.id ? `#${venta.id}` : "No disponible"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Fecha de Venta:</Text>
              <Text style={styles.value}>
                {venta?.fechaVenta
                  ? formatearFecha(venta.fechaVenta)
                  : "No disponible"}
              </Text>
            </View>
          </View>

          {/* Información del Producto */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información del Producto</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Dispositivo:</Text>
              <Text style={styles.value}>
                {producto?.producto?.nombre || "No disponible"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Descripción:</Text>
              <Text style={styles.value}>
                {producto?.producto?.descripcion || "No disponible"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>IMEI:</Text>
              <Text style={styles.value}>{venta?.imei || "No disponible"}</Text>
            </View>
          </View>

          {/* Información del Cliente */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información del Cliente</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Nombre:</Text>
              <Text style={styles.value}>
                {venta?.cliente?.nombre ||
                  venta?.nombreClienteFinal ||
                  "No disponible"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>DPI:</Text>
              <Text style={styles.value}>
                {venta?.cliente?.dpi || "No disponible"}
              </Text>
            </View>
          </View>

          {/* Términos de Garantía */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Términos de la Garantía</Text>
            {[
              "Cubre defectos de fábrica en pantalla, batería, micrófonos, etc.",
              "Garantía válida por 6 meses desde la fecha de compra.",
              "No aplica por daños por golpes, humedad, o manipulación externa.",
              "El tiempo de reparación será de 5-6 semanas (sin devoluciones).",
            ].map((term, idx) => (
              <Text key={idx} style={styles.terms}>
                {`${idx + 1}. ${term}`}
              </Text>
            ))}
          </View>

          {/* Firma */}
          <View style={styles.signatureSection}>
            <Text>
              Confirmo haber recibido el dispositivo en buen estado y acepto los
              términos de garantía.
            </Text>
            <View style={styles.signatureLine} />
            <Text>Firma del Cliente</Text>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            Por favor, conserve este comprobante para futuros reclamos de
            garantía. NOVA SISTEMAS - Tecnología a tu alcance.
          </Text>
        </Page>
      ))}
    </Document>
  );
};

export default Garantia;
