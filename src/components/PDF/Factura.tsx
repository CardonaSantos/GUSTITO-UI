import React from "react";
import {
  Image,
  Text,
  View,
  Page,
  Document,
  StyleSheet,
} from "@react-pdf/renderer";
import logo from "../../assets/GUSTITOSPNG.png";
import { VentaHistorialPDF } from "@/Types/PDF/VentaHistorialPDF";
import dayjs from "dayjs";
import "dayjs/locale/es";
import localizedFormat from "dayjs/plugin/localizedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(localizedFormat);
dayjs.extend(customParseFormat);
dayjs.locale("es");

const formatearFecha = (fecha: string) =>
  dayjs(fecha).format("DD MMMM YYYY, hh:mm:ss A");

interface VentaProps {
  venta: VentaHistorialPDF | undefined;
}

const Factura: React.FC<VentaProps> = ({ venta }) => {
  const colors = {
    primary: "#7b2c7d",
    secondary: "#e2b7b8",
    tableHeader: "#fbeffb",
    border: "#dddddd",
    background: "#ffffff",
    text: "#333333",
    lightText: "#666666",
  };

  const styles = StyleSheet.create({
    page: {
      fontSize: 10,
      padding: 40,
      backgroundColor: colors.background,
      color: colors.text,
      fontFamily: "Helvetica",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
      borderBottom: `2 solid ${colors.secondary}`,
      paddingBottom: 10,
    },
    logo: { width: 190, height: 90, objectFit: "contain" },
    companyInfo: { alignItems: "flex-end", flexDirection: "column" },
    companyDetail: { fontSize: 8, color: colors.lightText, marginBottom: 2 },
    invoiceInfoContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    box: {
      backgroundColor: colors.tableHeader,
      padding: 10,
      borderRadius: 5,
      borderLeft: `4 solid ${colors.primary}`,
      width: "48%",
    },
    clientBox: {
      backgroundColor: colors.tableHeader,
      padding: 10,
      borderRadius: 5,
      borderLeft: `4 solid ${colors.secondary}`,
      width: "48%",
    },
    table: { marginTop: 20 },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: colors.tableHeader,
      fontWeight: "bold",
      paddingVertical: 4,
    },
    tableCell: { padding: 5, fontSize: 8 },
    productNameCell: { width: "40%" },
    priceCell: { width: "20%", textAlign: "right" },
    quantityCell: { width: "15%", textAlign: "center" },
    subtotalCell: { width: "25%", textAlign: "right" },
    totalRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 10,
    },
    totalLabel: {
      padding: 5,
      fontSize: 10,
      fontWeight: "bold",
      color: colors.primary,
    },
    totalValue: {
      padding: 5,
      fontSize: 9,
      fontWeight: "bold",
      color: colors.primary,
    },
    thankYouText: {
      fontSize: 10,
      fontWeight: "bold",
      color: colors.primary,
      textAlign: "center",
      marginTop: 20,
    },
    footerText: { fontSize: 8, color: colors.lightText, textAlign: "center" },
  });

  if (!venta) return null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image style={styles.logo} src={logo} />
          <View style={styles.companyInfo}>
            <Text style={styles.companyDetail}>
              {venta.sucursal?.direccion || "Dirección"}
            </Text>
            <Text style={styles.companyDetail}>
              Tel: {venta.sucursal?.telefono || "Tel"} | PBX:{" "}
              {venta.sucursal?.pbx || "N/A"}
            </Text>
          </View>
        </View>

        <View style={styles.invoiceInfoContainer}>
          <View style={styles.box}>
            <Text>Factura No.#{venta.id}</Text>
            <Text>Fecha: {formatearFecha(venta.fechaVenta)}</Text>
            <Text>Sucursal: {venta.sucursal?.nombre}</Text>
            <Text>Método de pago: {venta.metodoPago?.metodoPago}</Text>
          </View>
          <View style={styles.clientBox}>
            <Text>
              Nombre:{" "}
              {venta.cliente?.nombre || venta.nombreClienteFinal || "CF"}
            </Text>
            <Text>
              Teléfono:{" "}
              {venta.cliente?.telefono || venta.telefonoClienteFinal || "N/A"}
            </Text>
            <Text>
              Dirección:{" "}
              {venta.cliente?.direccion || venta.direccionClienteFinal || "N/A"}
            </Text>
            {venta.imei && <Text>IMEI: {venta.imei}</Text>}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.productNameCell]}>
              Producto
            </Text>
            <Text style={[styles.tableCell, styles.priceCell]}>Precio</Text>
            <Text style={[styles.tableCell, styles.quantityCell]}>Cant.</Text>
            <Text style={[styles.tableCell, styles.subtotalCell]}>
              Subtotal
            </Text>
          </View>
          {venta.productos?.length ? (
            venta.productos.map((item, index) => (
              <View key={index} style={{ flexDirection: "row" }}>
                <Text style={[styles.tableCell, styles.productNameCell]}>
                  {item.producto?.nombre}
                </Text>
                <Text style={[styles.tableCell, styles.priceCell]}>
                  {new Intl.NumberFormat("es-GT", {
                    style: "currency",
                    currency: "GTQ",
                  }).format(item.precioVenta)}
                </Text>
                <Text style={[styles.tableCell, styles.quantityCell]}>
                  {item.cantidad}
                </Text>
                <Text style={[styles.tableCell, styles.subtotalCell]}>
                  {new Intl.NumberFormat("es-GT", {
                    style: "currency",
                    currency: "GTQ",
                  }).format(item.precioVenta * item.cantidad)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.tableCell}>No hay productos</Text>
          )}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>
            {new Intl.NumberFormat("es-GT", {
              style: "currency",
              currency: "GTQ",
            }).format(
              venta.productos?.reduce(
                (acc, item) => acc + item.precioVenta * item.cantidad,
                0
              ) || 0
            )}
          </Text>
        </View>

        <Text style={styles.thankYouText}>¡Gracias por su compra!</Text>
        <Text style={styles.footerText}>
          GUSTITO - Postres & Pasteles | Delicias hechas con amor
        </Text>
        <Text style={styles.footerText}>
          Facebook: Gustito Postres y Pasteles |
          Instagram:@gustito.postresypasteles
        </Text>
      </Page>
    </Document>
  );
};

export default Factura;
