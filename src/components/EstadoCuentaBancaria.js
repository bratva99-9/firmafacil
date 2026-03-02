import React, { useState } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import './GeneracionImagenes.css';

function EstadoCuentaBancaria() {
    const [mostrarConfig, setMostrarConfig] = useState(false);

    // Configuración de páginas modulares
    const [configuracionPaginas, setConfiguracionPaginas] = useState({
        transaccionesPorPaginaIntermedia: 38,
        transaccionesEnCierre: 3,
        totalPaginas: 12 // Total de páginas deseadas (incluye primera, intermedias, cierre, última)
    });

    // Coordenadas configurables
    const [coordenadas, setCoordenadas] = useState({
        // Página 1 - Datos del cliente
        nombrePagina1X: 23,
        nombrePagina1Y: 140,
        nombrePagina1FontSize: 11,

        cuentaPagina1X: 23,
        cuentaPagina1Y: 155,
        cuentaPagina1FontSize: 11,

        cedulaPagina1X: 23,
        cedulaPagina1Y: 210,
        cedulaPagina1FontSize: 11,

        cicloPagina1X: 23,
        cicloPagina1Y: 196,
        cicloPagina1FontSize: 10,

        // Fechas de Corte (Página 1)
        fechaCorteInicioX: 523, fechaCorteInicioY: 139, fechaCorteInicioFontSize: 10,
        fechaCorteFinX: 523, fechaCorteFinY: 155, fechaCorteFinFontSize: 10,
        // Posición 2 para Fechas de Corte
        fechaCorteInicio2X: 522, fechaCorteInicio2Y: 396, fechaCorteInicio2FontSize: 9,
        fechaCorteFin2X: 522, fechaCorteFin2Y: 413, fechaCorteFin2FontSize: 9,

        // Resumen de Cuenta (Página 1)
        saldoAnteriorX: 568, saldoAnteriorY: 431, saldoAnteriorFontSize: 9,
        cantDepositosX: 479, cantDepositosY: 448, cantDepositosFontSize: 9,
        depositosX: 568, depositosY: 448, depositosFontSize: 9,
        cantChequesX: 479, cantChequesY: 466, cantChequesFontSize: 9,
        chequesX: 568, chequesY: 466, chequesFontSize: 9,
        interesX: 568, interesY: 484, interesFontSize: 9,
        saldoActualX: 568, saldoActualY: 501, saldoActualFontSize: 9,
        saldoPromedioX: 568, saldoPromedioY: 519, saldoPromedioFontSize: 9,

        // Encabezado (Páginas intermedias)
        transaccionesInicioY: 242,
        transaccionesColumna1X: 23,
        transaccionesColumna2X: 320,
        transaccionLineHeight: 13,
        fontSize: 9,

        // Encabezado de páginas intermedias
        encabezadoNombreX: 28,
        encabezadoNombreY: 145,
        encabezadoNombreFontSize: 13,
        encabezadoCuentaX: 28,
        encabezadoCuentaY: 179,
        encabezadoCuentaFontSize: 12,
        encabezadoCiRucX: 419,
        encabezadoCiRucY: 145,
        encabezadoCiRucFontSize: 12,
        encabezadoCicloX: 419,
        encabezadoCicloY: 179,
        encabezadoCicloFontSize: 12,

        // Número de página (esquina superior derecha)
        numeroPaginaX: 574,
        numeroPaginaY: 31,
        numeroPaginaFontSize: 10,

        // Columnas de transacciones (offset relativo a columna)
        colFecha: 0,
        colOfic: 44,
        colNDoc: 87,
        colDescripcion: 138,
        colDebito: 423,
        colCredito: 487,
        colSaldo: 538
    });

    const actualizarCoordenada = (campo, eje, valor) => {
        setCoordenadas(prev => ({
            ...prev,
            [campo]: typeof prev[campo] === 'object'
                ? { ...prev[campo], [eje]: parseInt(valor) || 0 }
                : parseInt(valor) || 0
        }));
    };

    const [cliente, setCliente] = useState({
        nombre: '',
        numeroCuenta: '',
        tipoCuenta: 'AHORROS',
        periodo: '',
        saldoInicial: 0,
        saldoAnterior: '4.62',
        cantDepositos: '(86)',
        depositos: '2222.18',
        cantCheques: '(200)',
        cheques: '2224.36',
        interes: '0.00',
        saldoActual: '2.44',
        saldoPromedio: '56.43',
        cedula: '0958398984', // Cédula del cliente
        ciclo: '1', // Ciclo 1-5
        anio: new Date().getFullYear(),
        mes: new Date().getMonth(), // 0-11
        saldoPromedioObjetivo: 600,
        totalCreditosObjetivo: 2500
    });

    // Calcular fechas de corte automáticamente
    const obtenerFechasCorte = () => {
        const anio = parseInt(cliente.anio) || 2025;
        const mes = parseInt(cliente.mes); // 0 permitimos si es enero

        // Validar mes (0-11)
        const mesValido = isNaN(mes) ? 0 : mes;

        // Fecha corte actual: 6 del mes siguiente
        const fechaFin = new Date(anio, mesValido + 1, 6);

        // Fecha corte anterior: 7 del mes seleccionado
        const fechaInicio = new Date(anio, mesValido, 7);

        const formatear = (date) => {
            if (!date || isNaN(date.getTime())) return '00-00-0000';
            const d = date.getDate().toString().padStart(2, '0');
            const m = (date.getMonth() + 1).toString().padStart(2, '0');
            const y = date.getFullYear();
            return `${d}-${m}-${y}`;
        };

        return {
            inicio: formatear(fechaInicio),
            fin: formatear(fechaFin)
        };
    };

    const [transacciones, setTransacciones] = useState([]);
    const [nuevaTransaccion, setNuevaTransaccion] = useState({
        fecha: '',
        ofic: '',
        ndoc: '',
        descripcion: '',
        debito: '',
        credito: ''
    });

    const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
    const [generandoPDF, setGenerandoPDF] = useState(false);
    const [error, setError] = useState(null);

    // Formatear fecha a DD-MMM (ej: 18-Nov)
    const formatearFecha = (fechaISO) => {
        if (!fechaISO) return '';
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const fecha = new Date(fechaISO + 'T00:00:00'); // Evitar problemas de zona horaria
        const dia = fecha.getDate();
        const mes = meses[fecha.getMonth()];
        return `${dia}-${mes}`;
    };

    // Cargar datos de prueba unificado con generación lógica
    const cargarDatosPrueba = () => {
        const { totalPaginas, transaccionesPorPaginaIntermedia, transaccionesEnCierre } = configuracionPaginas;
        const totalTransaccionesDeseadas = (Math.max(0, totalPaginas - 3) * transaccionesPorPaginaIntermedia) + transaccionesEnCierre;

        const saldoInicialReal = parseFloat(cliente.saldoAnterior) || 4.62;
        const promedioObjetivo = parseFloat(cliente.saldoPromedioObjetivo) || 600;
        const totalCreditosDeseados = parseFloat(cliente.totalCreditosObjetivo) || 2500;

        // Datos del cliente de prueba
        setCliente(prev => ({
            ...prev,
            nombre: 'CENTENO HOLGUIN KEVIN JULIAN',
            numeroCuenta: '2100345678',
            tipoCuenta: 'AHORROS',
            cedula: '0958398984',
            ciclo: '1'
        }));

        // Rango de fechas
        const anio = parseInt(cliente.anio) || 2025;
        const mes = parseInt(cliente.mes);
        const fechaInicio = new Date(anio, mes, 7);
        const fechaFin = new Date(anio, mes + 1, 6);
        const diasDelPeriodo = Math.round((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24)) + 1;

        const transaccionesResult = [];
        let saldoActual = saldoInicialReal;
        let sumaSaldosDiarios = 0;
        let creditosAcumulados = 0;

        // Pools de descripciones profesionales (Adecuados para crédito)
        const descCreditos = [
            'TRANSFERENCIA INTERNET', 'TRANSFERENCIA INTERBANCARIA RECIBIDA', 'DEPOSITO EFECTIVO VENTANILLA',
            'ABONO POR NOMINA', 'TRANSFERENCIA SPI', 'REVERSION CARGO BANCARIO', 'REVERSION DE COMISION'
        ];

        const descDebitosConsumo = [
            'CONSUMO VISA IN COMISARIATO', 'RETIRO ATM BP', 'COMPRA FERRETERIA',
            'PAGO SEGURO DE SALUD', 'CONSUMO GASOLINERA', 'FARMACIA FYBECA',
            'PAGO SERVICIOS PROFESIONALES', 'CONSUMO SUPERMAXI', 'PAGO SEGURO VEHICULAR',
            'CONSUMO FARMACIAS SANA SANA', 'COMPRA ALMACENES DEATI'
        ];

        const descServicios = [
            { nombre: 'PAGO SERVICIOS CNEL', dia: 15, rango: [20, 60] },
            { nombre: 'PAGO SERVICIOS EPMAPS', dia: 18, rango: [10, 35] },
            { nombre: 'PAGO SERVICIOS CNT', dia: 22, rango: [15, 80] },
            { nombre: 'PAGO IESS', dia: 12, rango: [70, 450] },
            { nombre: 'PAGO IMPUESTOS SRI', dia: 20, rango: [10, 200] }
        ];

        const cargosMensuales = [
            { nombre: 'SEGURO DE DESGRAVAMEN', dia: 28, monto: 1.50 },
            { nombre: 'COMISION SERVICIOS BANCARIOS', dia: 30, monto: 0.56 }
        ];

        const generarMontoConPicos = (base) => {
            const cents = (Math.random() * 0.99).toFixed(2);
            return Math.floor(base) + parseFloat(cents);
        };

        const generarNdoc = () => {
            // Generar número de 7 u 8 dígitos (entre 1,000,000 y 99,999,999)
            return Math.floor(Math.random() * (99999999 - 1000000 + 1) + 1000000).toString();
        };

        const fechasCredito = [
            new Date(anio, mes, 10),
            new Date(anio, mes, 25),
            new Date(anio, mes + 1, 1)
        ].filter(d => d >= fechaInicio && d <= fechaFin);

        // Generar transacciones día a día
        for (let d = 0; d < diasDelPeriodo; d++) {
            const fechaDia = new Date(fechaInicio);
            fechaDia.setDate(fechaInicio.getDate() + d);
            const fechaStr = `${fechaDia.getFullYear()}-${(fechaDia.getMonth() + 1).toString().padStart(2, '0')}-${fechaDia.getDate().toString().padStart(2, '0')}`;
            const numDia = fechaDia.getDate();

            // 1. Créditos
            const esFechaCredito = fechasCredito.some(fc => fc.getDate() === numDia && fc.getMonth() === fechaDia.getMonth());
            if (esFechaCredito && creditosAcumulados < totalCreditosDeseados && transaccionesResult.length < totalTransaccionesDeseadas) {
                const montoMax = (totalCreditosDeseados / fechasCredito.length) * 1.2;
                const monto = generarMontoConPicos(Math.min(montoMax, totalCreditosDeseados - creditosAcumulados + 50));

                transaccionesResult.push({
                    fecha: fechaStr,
                    ofic: '8381',
                    ndoc: generarNdoc(),
                    descripcion: descCreditos[Math.floor(Math.random() * descCreditos.length)],
                    debito: 0,
                    credito: monto,
                    saldo: saldoActual + monto
                });
                saldoActual += monto;
                creditosAcumulados += monto;
            }

            // 2. Servicios
            descServicios.forEach(serv => {
                if (numDia === serv.dia && Math.random() > 0.3 && transaccionesResult.length < totalTransaccionesDeseadas) {
                    const monto = generarMontoConPicos(Math.random() * (serv.rango[1] - serv.rango[0]) + serv.rango[0]);
                    if (saldoActual - monto > 5) {
                        saldoActual -= monto;
                        transaccionesResult.push({
                            fecha: fechaStr,
                            ofic: '8381',
                            ndoc: generarNdoc(),
                            descripcion: serv.nombre,
                            debito: monto,
                            credito: 0,
                            saldo: saldoActual
                        });
                    }
                }
            });

            // 3. Cargos mensuales
            cargosMensuales.forEach(cargo => {
                if (numDia === cargo.dia && transaccionesResult.length < totalTransaccionesDeseadas) {
                    if (saldoActual - cargo.monto > 5) {
                        saldoActual -= cargo.monto;
                        transaccionesResult.push({
                            fecha: fechaStr,
                            ofic: '0000',
                            ndoc: '0',
                            descripcion: cargo.nombre,
                            debito: cargo.monto,
                            credito: 0,
                            saldo: saldoActual
                        });
                    }
                }
            });

            // 4. Consumo diario
            // Intentar balancear el número de transacciones para llegar al total
            const transaccionesRestantes = totalTransaccionesDeseadas - transaccionesResult.length;
            const diasRestantes = diasDelPeriodo - d;
            const metaTransaccionesHoy = Math.max(1, Math.ceil(transaccionesRestantes / diasRestantes));

            for (let t = 0; t < metaTransaccionesHoy; t++) {
                if (transaccionesResult.length >= totalTransaccionesDeseadas) break;

                let montoBase = Math.random() * 30 + 1;
                if (saldoActual > promedioObjetivo * 1.2) montoBase = Math.random() * 50 + 10;
                else if (saldoActual < 100) montoBase = Math.random() * 5 + 1;

                if (saldoActual - montoBase > 5) {
                    const monto = generarMontoConPicos(montoBase);
                    const desc = descDebitosConsumo[Math.floor(Math.random() * descDebitosConsumo.length)];
                    saldoActual -= monto;
                    transaccionesResult.push({
                        id: Date.now() + transaccionesResult.length,
                        fecha: fechaStr,
                        ofic: '8381',
                        ndoc: generarNdoc(),
                        descripcion: desc,
                        debito: monto,
                        credito: 0,
                        saldo: saldoActual
                    });

                    // Retención de impuestos profesionalizada
                    if (transaccionesResult.length < totalTransaccionesDeseadas && Math.random() > 0.8) {
                        const iva = parseFloat((monto * 0.15).toFixed(2));
                        if (saldoActual - iva > 5) {
                            saldoActual -= iva;
                            transaccionesResult.push({
                                fecha: fechaStr,
                                ofic: '0000',
                                ndoc: '0',
                                descripcion: 'RETENCION IVASD SERV DIGITALES',
                                debito: iva,
                                credito: 0,
                                saldo: saldoActual
                            });
                        }
                    }
                }
            }

            sumaSaldosDiarios += saldoActual;
        }

        // 5. Garantizar el número exacto de transacciones si faltan (Sin descripciones genéricas ni 0s)
        while (transaccionesResult.length < totalTransaccionesDeseadas) {
            const monto = generarMontoConPicos(Math.random() * 15 + 2);
            const desc = descDebitosConsumo[Math.floor(Math.random() * descDebitosConsumo.length)];
            const dRand = Math.floor(Math.random() * diasDelPeriodo);
            const fRef = new Date(fechaInicio);
            fRef.setDate(fechaInicio.getDate() + dRand);
            const fStr = `${fRef.getFullYear()}-${(fRef.getMonth() + 1).toString().padStart(2, '0')}-${fRef.getDate().toString().padStart(2, '0')}`;

            if (saldoActual - monto > 2) {
                saldoActual -= monto;
                transaccionesResult.push({
                    fecha: fStr,
                    ofic: '8381',
                    ndoc: generarNdoc(),
                    descripcion: desc,
                    debito: monto,
                    credito: 0,
                    saldo: saldoActual
                });
            } else {
                const ingreso = generarMontoConPicos(Math.random() * 50 + 20);
                saldoActual += ingreso;
                transaccionesResult.push({
                    fecha: fStr,
                    ofic: '8381',
                    ndoc: generarNdoc(),
                    descripcion: descCreditos[Math.floor(Math.random() * descCreditos.length)],
                    debito: 0,
                    credito: ingreso,
                    saldo: saldoActual
                });
            }
        }

        // Ordenar resultados por fecha antes del recalcular
        transaccionesResult.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        // Recalcular saldos progresivos para asegurar consistencia perfecta
        let saldoProgresivo = saldoInicialReal;
        transaccionesResult.forEach(t => {
            if (t.credito > 0) saldoProgresivo += t.credito;
            else saldoProgresivo -= t.debito;
            t.saldo = saldoProgresivo;
        });

        // Totales finales
        let totalD = 0; let totalC = 0; let cD = 0; let cC = 0;
        transaccionesResult.forEach(t => {
            totalD += t.debito || 0;
            totalC += t.credito || 0;
            if (t.debito > 0) cD++;
            if (t.credito > 0) cC++;
        });

        setCliente(prev => ({
            ...prev,
            depositos: totalC.toFixed(2),
            cheques: totalD.toFixed(2),
            cantDepositos: `(${cC})`,
            cantCheques: `(${cD})`,
            saldoActual: saldoProgresivo.toFixed(2),
            saldoPromedio: (sumaSaldosDiarios / diasDelPeriodo).toFixed(2)
        }));

        setTransacciones(transaccionesResult);
        setError(null);
    };

    // Agregar nueva transacción
    const agregarTransaccion = () => {
        const debito = parseFloat(nuevaTransaccion.debito) || 0;
        const credito = parseFloat(nuevaTransaccion.credito) || 0;

        // Calcular saldo
        const saldoAnterior = transacciones.length > 0
            ? transacciones[transacciones.length - 1].saldo
            : parseFloat(cliente.saldoInicial) || 0;

        const nuevoSaldo = saldoAnterior - debito + credito;

        const transaccion = {
            id: Date.now(),
            fecha: nuevaTransaccion.fecha || new Date().toISOString().split('T')[0],
            ofic: nuevaTransaccion.ofic || '001',
            ndoc: nuevaTransaccion.ndoc || Math.floor(Math.random() * 1000000).toString(),
            descripcion: nuevaTransaccion.descripcion || 'Sin descripción',
            debito: debito,
            credito: credito,
            saldo: nuevoSaldo
        };

        setTransacciones([...transacciones, transaccion]);
        setNuevaTransaccion({ fecha: '', ofic: '', ndoc: '', descripcion: '', debito: '', credito: '' });
        setError(null);
    };

    // Eliminar transacción
    const eliminarTransaccion = (id) => {
        const nuevasTransacciones = transacciones.filter(t => t.id !== id);
        recalcularSaldos(nuevasTransacciones);
    };

    // Recalcular saldos después de eliminar
    const recalcularSaldos = (lista) => {
        let saldoActual = parseFloat(cliente.saldoInicial) || 0;
        const actualizadas = lista.map(t => {
            saldoActual = saldoActual - t.debito + t.credito;
            return { ...t, saldo: saldoActual };
        });
        setTransacciones(actualizadas);
    };

    // Generar PDF con sistema modular
    const generarPDF = async (previewMode = false) => {
        setGenerandoPDF(true);
        setError(null);

        try {
            // 1. Cargar todas las plantillas
            const [primeraBytes, intermedioBytes, cierreBytes, ultimaBytes] = await Promise.all([
                fetch('/primera_pichincha.pdf').then(r => r.ok ? r.arrayBuffer() : Promise.reject('Error cargando primera_pichincha.pdf')),
                fetch('/pichincha_intermedio.pdf').then(r => r.ok ? r.arrayBuffer() : Promise.reject('Error cargando pichincha_intermedio.pdf')),
                fetch('/cierremovientos3_pichincha.pdf').then(r => r.ok ? r.arrayBuffer() : Promise.reject('Error cargando cierremovientos3_pichincha.pdf')),
                fetch('/ultima_pichincha.pdf').then(r => r.ok ? r.arrayBuffer() : Promise.reject('Error cargando ultima_pichincha.pdf'))
            ]);

            // 2. Crear PDF final vacío
            const pdfDoc = await PDFDocument.create();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            // 3. Agregar primera página y escribir datos del cliente
            const primeraPdf = await PDFDocument.load(primeraBytes);
            const [primeraPage] = await pdfDoc.copyPages(primeraPdf, [0]);
            pdfDoc.addPage(primeraPage);
            const { height } = primeraPage.getSize();

            // Funciones de dibujo
            const draw = (text, x, y, page, options = {}) => {
                if (text === null || text === undefined || text === '') return;
                page.drawText(String(text), {
                    x: x,
                    y: height - y,
                    size: options.size || 12,
                    font: options.font || font,
                    color: options.color || rgb(0, 0, 0),
                });
            };

            const drawRight = (text, x, y, page, options = {}) => {
                if (text === null || text === undefined || text === '') return;
                const textWidth = (options.font || font).widthOfTextAtSize(String(text), options.size || 12);
                page.drawText(String(text), {
                    x: x - textWidth,
                    y: height - y,
                    size: options.size || 12,
                    font: options.font || font,
                    color: options.color || rgb(0, 0, 0),
                });
            };

            // Escribir datos del cliente en primera página
            // Escribir datos del cliente en primera página
            // 1. Nombre
            if (cliente.nombre) {
                draw(cliente.nombre, coordenadas.nombrePagina1X, coordenadas.nombrePagina1Y, primeraPage, {
                    size: coordenadas.nombrePagina1FontSize,
                    font: fontBold // Negrita
                });
            }

            // 2. Cuenta
            if (cliente.numeroCuenta) {
                const cuentaTexto = `CUENTA ${cliente.numeroCuenta}`;
                draw(cuentaTexto, coordenadas.cuentaPagina1X, coordenadas.cuentaPagina1Y, primeraPage, {
                    size: coordenadas.cuentaPagina1FontSize,
                    font: fontBold // Negrita
                });
            }

            // 3. C.I./RUC
            const cedulaValor = cliente.cedula || '0958398984';
            const cedulaTexto = `C.I./RUC: ${cedulaValor}`;
            draw(cedulaTexto, coordenadas.cedulaPagina1X, coordenadas.cedulaPagina1Y, primeraPage, {
                size: coordenadas.cedulaPagina1FontSize,
                font: fontBold // Negrita
            });

            // 4. Ciclo
            const cicloTexto = `CICLO ${cliente.ciclo || '1'}`;
            draw(cicloTexto, coordenadas.cicloPagina1X, coordenadas.cicloPagina1Y, primeraPage, {
                size: coordenadas.cicloPagina1FontSize,
                font: font // Normal (no negrita)
            });

            // 5. Fechas de Corte
            const { inicio: fechaInicio, fin: fechaFin } = obtenerFechasCorte();

            // Fecha Último Corte (7 del mes anterior)
            draw(fechaInicio, coordenadas.fechaCorteInicioX, coordenadas.fechaCorteInicioY, primeraPage, {
                size: coordenadas.fechaCorteInicioFontSize,
                font: font
            });

            // Fecha Este Corte (6 del mes actual)
            draw(fechaFin, coordenadas.fechaCorteFinX, coordenadas.fechaCorteFinY, primeraPage, {
                size: coordenadas.fechaCorteFinFontSize,
                font: font
            });

            // 5.1 Fechas de Corte (Posición 2)
            // Fecha Último Corte (2)
            draw(fechaInicio, coordenadas.fechaCorteInicio2X, coordenadas.fechaCorteInicio2Y, primeraPage, {
                size: coordenadas.fechaCorteInicio2FontSize,
                font: font
            });

            // Fecha Este Corte (2)
            draw(fechaFin, coordenadas.fechaCorteFin2X, coordenadas.fechaCorteFin2Y, primeraPage, {
                size: coordenadas.fechaCorteFin2FontSize,
                font: font
            });

            // 6. Resumen de Cuenta (Alineado a la Derecha)
            // 6. Resumen de Cuenta (Alineado a la Derecha por defecto, Conteos a la Izquierda)
            const valoresResumen = [
                { valor: cliente.saldoAnterior, x: coordenadas.saldoAnteriorX, y: coordenadas.saldoAnteriorY, size: coordenadas.saldoAnteriorFontSize, align: 'right' },
                { valor: cliente.cantDepositos, x: coordenadas.cantDepositosX, y: coordenadas.cantDepositosY, size: coordenadas.cantDepositosFontSize, align: 'left' },
                { valor: cliente.depositos, x: coordenadas.depositosX, y: coordenadas.depositosY, size: coordenadas.depositosFontSize, align: 'right' },
                { valor: cliente.cantCheques, x: coordenadas.cantChequesX, y: coordenadas.cantChequesY, size: coordenadas.cantChequesFontSize, align: 'left' },
                { valor: cliente.cheques, x: coordenadas.chequesX, y: coordenadas.chequesY, size: coordenadas.chequesFontSize, align: 'right' },
                { valor: cliente.interes, x: coordenadas.interesX, y: coordenadas.interesY, size: coordenadas.interesFontSize, align: 'right' },
                { valor: cliente.saldoActual, x: coordenadas.saldoActualX, y: coordenadas.saldoActualY, size: coordenadas.saldoActualFontSize, align: 'right' },
                { valor: cliente.saldoPromedio, x: coordenadas.saldoPromedioX, y: coordenadas.saldoPromedioY, size: coordenadas.saldoPromedioFontSize, align: 'right' }
            ];

            valoresResumen.forEach(item => {
                if (item.valor) {
                    if (item.align === 'left') {
                        draw(item.valor, item.x, item.y, primeraPage, {
                            size: item.size,
                            font: font
                        });
                    } else {
                        drawRight(item.valor, item.x, item.y, primeraPage, {
                            size: item.size,
                            font: font
                        });
                    }
                }
            });

            // 4. Calcular distribución de transacciones
            const { transaccionesPorPaginaIntermedia, transaccionesEnCierre } = configuracionPaginas;
            const totalTransacciones = transacciones.length;
            const transaccionesParaIntermedias = Math.max(0, totalTransacciones - transaccionesEnCierre);
            const numPaginasIntermedias = Math.ceil(transaccionesParaIntermedias / transaccionesPorPaginaIntermedia);

            // Número de página en esquina superior derecha de primera página
            const totalPaginasFinales = 3 + numPaginasIntermedias; // 1 primera + N intermedias + 1 cierre + 1 última
            const textoPagina1 = `Página 1 de ${totalPaginasFinales}`;
            drawRight(textoPagina1, coordenadas.numeroPaginaX, coordenadas.numeroPaginaY, primeraPage, {
                size: coordenadas.numeroPaginaFontSize
            });

            // 5. Agregar páginas intermedias y escribir transacciones
            let transaccionIndex = 0;
            const fontSize = coordenadas.fontSize || 9;
            const lineHeight = coordenadas.transaccionLineHeight || 13;
            const startY = coordenadas.transaccionesInicioY;
            const baseX = coordenadas.transaccionesColumna1X;

            for (let i = 0; i < numPaginasIntermedias; i++) {
                const intermedioPdf = await PDFDocument.load(intermedioBytes);
                const [intermedioPage] = await pdfDoc.copyPages(intermedioPdf, [0]);
                pdfDoc.addPage(intermedioPage);

                // Calcular número de página actual (primera página + intermedias + cierre + última)
                const paginaActual = 2 + i; // Página 2 es la primera intermedia
                const totalPaginasFinales = 3 + numPaginasIntermedias; // 1 primera + N intermedias + 1 cierre + 1 última

                // Número de página en esquina superior derecha
                const textoPagina = `Página ${paginaActual} de ${totalPaginasFinales}`;
                drawRight(textoPagina, coordenadas.numeroPaginaX, coordenadas.numeroPaginaY, intermedioPage, {
                    size: coordenadas.numeroPaginaFontSize
                });

                // Escribir encabezado en página intermedia
                // Nombre en negritas
                const nombreCompleto = cliente.nombre || 'CENTENO HOLGUIN KEVIN JULIAN';
                draw(nombreCompleto, coordenadas.encabezadoNombreX, coordenadas.encabezadoNombreY, intermedioPage, {
                    size: coordenadas.encabezadoNombreFontSize,
                    font: fontBold
                });

                // Número de cuenta
                const textoCuenta = `CUENTA: ${cliente.numeroCuenta || ''}`;
                draw(textoCuenta, coordenadas.encabezadoCuentaX, coordenadas.encabezadoCuentaY, intermedioPage, {
                    size: coordenadas.encabezadoCuentaFontSize
                });

                // C.I./RUC (etiqueta en negritas, número normal)
                const cedulaCliente = cliente.cedula || '0958398984';
                draw('C.I./RUC: ', coordenadas.encabezadoCiRucX, coordenadas.encabezadoCiRucY, intermedioPage, {
                    size: coordenadas.encabezadoCiRucFontSize,
                    font: fontBold
                });
                // Calcular posición del número después de la etiqueta
                const labelWidth = fontBold.widthOfTextAtSize('C.I./RUC: ', coordenadas.encabezadoCiRucFontSize);
                draw(cedulaCliente, coordenadas.encabezadoCiRucX + labelWidth, coordenadas.encabezadoCiRucY, intermedioPage, {
                    size: coordenadas.encabezadoCiRucFontSize
                });

                // CICLO
                const textoCiclo = `CICLO ${cliente.ciclo || '1'}`;
                draw(textoCiclo, coordenadas.encabezadoCicloX, coordenadas.encabezadoCicloY, intermedioPage, {
                    size: coordenadas.encabezadoCicloFontSize
                });

                // Escribir hasta 38 transacciones en esta página
                let yPos = startY;
                const transaccionesEnEstaPagina = Math.min(
                    transaccionesPorPaginaIntermedia,
                    transaccionesParaIntermedias - transaccionIndex
                );

                // Formato Fecha: DD-MMM (ej: 16-Nov)
                const formatearFechaTransaccion = (fechaStr) => {
                    if (!fechaStr) return '';
                    const [y, m, d] = fechaStr.split('-');
                    const mesesCortos = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                    const mesIndex = parseInt(m) - 1;
                    const mesCorto = mesesCortos[mesIndex] || '';
                    return `${d}-${mesCorto}`;
                };

                for (let j = 0; j < transaccionesEnEstaPagina; j++) {
                    const t = transacciones[transaccionIndex];
                    if (!t) break;

                    const fechaFormateada = formatearFechaTransaccion(t.fecha);
                    draw(fechaFormateada, baseX + coordenadas.colFecha, yPos, intermedioPage, { size: fontSize });
                    draw(t.ofic, baseX + coordenadas.colOfic, yPos, intermedioPage, { size: fontSize });
                    draw(t.ndoc, baseX + coordenadas.colNDoc, yPos, intermedioPage, { size: fontSize });
                    draw(t.descripcion.substring(0, 35), baseX + coordenadas.colDescripcion, yPos, intermedioPage, { size: fontSize });

                    const debitoText = t.debito > 0 ? t.debito.toFixed(2) : '0.00';
                    const creditoText = t.credito > 0 ? t.credito.toFixed(2) : '0.00';
                    const saldoText = t.saldo.toFixed(2);
                    drawRight(debitoText, baseX + coordenadas.colDebito, yPos, intermedioPage, { size: fontSize });
                    drawRight(creditoText, baseX + coordenadas.colCredito, yPos, intermedioPage, { size: fontSize });
                    drawRight(saldoText, baseX + coordenadas.colSaldo, yPos, intermedioPage, { size: fontSize });

                    yPos += lineHeight;
                    transaccionIndex++;
                }
            }

            // 6. Agregar página de cierre y escribir últimas transacciones
            if (transaccionesEnCierre > 0 && transaccionIndex < totalTransacciones) {
                const cierrePdf = await PDFDocument.load(cierreBytes);
                const [cierrePage] = await pdfDoc.copyPages(cierrePdf, [0]);
                pdfDoc.addPage(cierrePage);

                // Número de página de cierre
                const paginaCierre = 2 + numPaginasIntermedias; // Después de las intermedias
                const totalPaginasFinales = 3 + numPaginasIntermedias;
                const textoPaginaCierre = `Página ${paginaCierre} de ${totalPaginasFinales}`;
                drawRight(textoPaginaCierre, coordenadas.numeroPaginaX, coordenadas.numeroPaginaY, cierrePage, {
                    size: coordenadas.numeroPaginaFontSize
                });

                // Escribir encabezado en página de cierre
                // Nombre en negritas
                const nombreCompleto = cliente.nombre || 'CENTENO HOLGUIN KEVIN JULIAN';
                draw(nombreCompleto, coordenadas.encabezadoNombreX, coordenadas.encabezadoNombreY, cierrePage, {
                    size: coordenadas.encabezadoNombreFontSize,
                    font: fontBold
                });

                // Número de cuenta
                const textoCuenta = `CUENTA: ${cliente.numeroCuenta || ''}`;
                draw(textoCuenta, coordenadas.encabezadoCuentaX, coordenadas.encabezadoCuentaY, cierrePage, {
                    size: coordenadas.encabezadoCuentaFontSize
                });

                // C.I./RUC (etiqueta en negritas, número normal)
                const cedulaCliente = cliente.cedula || '0958398984';
                draw('C.I./RUC: ', coordenadas.encabezadoCiRucX, coordenadas.encabezadoCiRucY, cierrePage, {
                    size: coordenadas.encabezadoCiRucFontSize,
                    font: fontBold
                });
                // Calcular posición del número después de la etiqueta
                const labelWidth = fontBold.widthOfTextAtSize('C.I./RUC: ', coordenadas.encabezadoCiRucFontSize);
                draw(cedulaCliente, coordenadas.encabezadoCiRucX + labelWidth, coordenadas.encabezadoCiRucY, cierrePage, {
                    size: coordenadas.encabezadoCiRucFontSize
                });

                // CICLO
                const textoCiclo = `CICLO ${cliente.ciclo || '1'}`;
                draw(textoCiclo, coordenadas.encabezadoCicloX, coordenadas.encabezadoCicloY, cierrePage, {
                    size: coordenadas.encabezadoCicloFontSize
                });

                let yPos = startY;
                const transaccionesRestantes = Math.min(transaccionesEnCierre, totalTransacciones - transaccionIndex);

                for (let j = 0; j < transaccionesRestantes; j++) {
                    const t = transacciones[transaccionIndex];
                    if (!t) break;

                    draw(formatearFecha(t.fecha), baseX + coordenadas.colFecha, yPos, cierrePage, { size: fontSize });
                    draw(t.ofic, baseX + coordenadas.colOfic, yPos, cierrePage, { size: fontSize });
                    draw(t.ndoc, baseX + coordenadas.colNDoc, yPos, cierrePage, { size: fontSize });
                    draw(t.descripcion.substring(0, 35), baseX + coordenadas.colDescripcion, yPos, cierrePage, { size: fontSize });

                    const debitoText = t.debito > 0 ? t.debito.toFixed(2) : '0.00';
                    const creditoText = t.credito > 0 ? t.credito.toFixed(2) : '0.00';
                    const saldoText = t.saldo.toFixed(2);
                    drawRight(debitoText, baseX + coordenadas.colDebito, yPos, cierrePage, { size: fontSize });
                    drawRight(creditoText, baseX + coordenadas.colCredito, yPos, cierrePage, { size: fontSize });
                    drawRight(saldoText, baseX + coordenadas.colSaldo, yPos, cierrePage, { size: fontSize });

                    yPos += lineHeight;
                    transaccionIndex++;
                }
            }

            // 7. Agregar última página (sin datos por ahora)
            const ultimaPdf = await PDFDocument.load(ultimaBytes);
            const [ultimaPage] = await pdfDoc.copyPages(ultimaPdf, [0]);
            pdfDoc.addPage(ultimaPage);

            // Número de página en última página
            const textoPaginaUltima = `Página ${totalPaginasFinales} de ${totalPaginasFinales}`;
            drawRight(textoPaginaUltima, coordenadas.numeroPaginaX, coordenadas.numeroPaginaY, ultimaPage, {
                size: coordenadas.numeroPaginaFontSize
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            if (previewMode) {
                setPdfPreviewUrl(url);
            } else {
                const link = document.createElement('a');
                link.href = url;
                link.download = `Estado_Cuenta_${cliente.numeroCuenta || 'banco'}_${Date.now()}.pdf`;
                link.click();
            }

        } catch (error) {
            console.error('Error generando PDF:', error);
            setError('Error al generar PDF: ' + error.message);
        } finally {
            setGenerandoPDF(false);
        }
    };

    return (
        <div className="gi-container">
            {/* Vista Previa del PDF - Ahora arriba */}
            {pdfPreviewUrl && (
                <div style={{
                    marginBottom: '16px',
                    border: '2px solid #3b82f6',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    position: 'relative'
                }}>
                    <div style={{
                        padding: '8px',
                        background: '#fff',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>
                            📄 Vista Previa del Estado de Cuenta
                        </span>
                        <button
                            onClick={() => setPdfPreviewUrl(null)}
                            style={{
                                border: 'none',
                                background: '#fff',
                                color: '#ef4444',
                                cursor: 'pointer',
                                fontSize: '14px',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }}
                        >
                            ✖️
                        </button>
                    </div>
                    <iframe
                        src={pdfPreviewUrl}
                        style={{
                            width: '100%',
                            height: '600px',
                            border: 'none'
                        }}
                        title="Vista Previa PDF"
                    />
                </div>
            )}

            {/* Botones de Configuración */}
            <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                    onClick={() => setMostrarConfig(!mostrarConfig)}
                    style={{
                        padding: '8px 16px',
                        background: mostrarConfig ? '#ef4444' : '#6366f1',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    {mostrarConfig ? '✖️ Cerrar' : '⚙️ Configurar Coordenadas'}
                </button>
                <button
                    onClick={cargarDatosPrueba}
                    style={{
                        padding: '8px 16px',
                        background: '#10b981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    🧪 Cargar Datos de Prueba
                </button>
                <button
                    onClick={() => {
                        const coordenadasJSON = JSON.stringify(coordenadas, null, 2);
                        navigator.clipboard.writeText(coordenadasJSON);
                        alert('✅ Coordenadas copiadas al portapapeles!\n\nPuedes pegarlas en un mensaje para que te ayude a ajustarlas.');
                    }}
                    style={{
                        padding: '8px 16px',
                        background: '#f59e0b',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    📋 Exportar Coordenadas
                </button>
            </div>

            {/* Configuración de Páginas Modulares */}
            <div className="gi-panel" style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', margin: '0 0 12px', color: '#1e293b', fontWeight: '600' }}>
                    📊 Configuración de Páginas
                </h3>

                {/* Campo principal: Total de páginas */}
                <div style={{ marginBottom: '16px', padding: '12px', background: '#eff6ff', borderRadius: '6px', border: '2px solid #3b82f6' }}>
                    <label style={{ fontSize: '13px', color: '#1e40af', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                        📄 Total de Páginas del PDF:
                    </label>
                    <input
                        type="number"
                        min="4"
                        value={configuracionPaginas.totalPaginas}
                        onChange={(e) => {
                            const total = parseInt(e.target.value) || 4;
                            setConfiguracionPaginas({
                                ...configuracionPaginas,
                                totalPaginas: Math.max(4, total) // Mínimo 4 páginas
                            });
                        }}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '2px solid #3b82f6',
                            borderRadius: '4px',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#1e40af'
                        }}
                    />
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                        💡 El sistema calculará automáticamente las transacciones necesarias
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                        <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                            Transacciones por página intermedia:
                        </label>
                        <input
                            type="number"
                            value={configuracionPaginas.transaccionesPorPaginaIntermedia}
                            onChange={(e) => setConfiguracionPaginas({
                                ...configuracionPaginas,
                                transaccionesPorPaginaIntermedia: parseInt(e.target.value) || 38
                            })}
                            style={{
                                width: '100%',
                                padding: '6px 10px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                fontSize: '13px'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                            Transacciones en página de cierre:
                        </label>
                        <input
                            type="number"
                            value={configuracionPaginas.transaccionesEnCierre}
                            onChange={(e) => setConfiguracionPaginas({
                                ...configuracionPaginas,
                                transaccionesEnCierre: parseInt(e.target.value) || 3
                            })}
                            style={{
                                width: '100%',
                                padding: '6px 10px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                fontSize: '13px'
                            }}
                        />
                    </div>
                </div>

                {/* Cálculo automático */}
                <div style={{
                    background: '#f1f5f9',
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#475569'
                }}>
                    <div style={{ fontWeight: '600', marginBottom: '6px' }}>🧮 Cálculo Automático:</div>
                    <div>• Total de páginas configuradas: <strong>{configuracionPaginas.totalPaginas}</strong></div>
                    <div>• Páginas intermedias: <strong>{Math.max(0, configuracionPaginas.totalPaginas - 3)}</strong></div>
                    <div>• Transacciones en intermedias: <strong>{Math.max(0, configuracionPaginas.totalPaginas - 3) * configuracionPaginas.transaccionesPorPaginaIntermedia}</strong></div>
                    <div>• Transacciones en cierre: <strong>{configuracionPaginas.transaccionesEnCierre}</strong></div>
                    <div style={{ marginTop: '8px', padding: '8px', background: '#dbeafe', borderRadius: '4px', fontWeight: '600', color: '#1e40af' }}>
                        📊 Total de transacciones a generar: {(Math.max(0, configuracionPaginas.totalPaginas - 3) * configuracionPaginas.transaccionesPorPaginaIntermedia) + configuracionPaginas.transaccionesEnCierre}
                    </div>
                </div>

                {transacciones.length > 0 && (
                    <div style={{
                        background: '#dcfce7',
                        padding: '12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#166534',
                        marginTop: '12px',
                        border: '1px solid #86efac'
                    }}>
                        <div style={{ fontWeight: '600', marginBottom: '6px' }}>✅ PDF Generado con {transacciones.length} transacciones:</div>
                        <div>• Página 1: Datos del cliente</div>
                        <div>• Páginas 2-{1 + Math.ceil(Math.max(0, transacciones.length - configuracionPaginas.transaccionesEnCierre) / configuracionPaginas.transaccionesPorPaginaIntermedia)}:
                            {' '}{Math.ceil(Math.max(0, transacciones.length - configuracionPaginas.transaccionesEnCierre) / configuracionPaginas.transaccionesPorPaginaIntermedia)} páginas intermedias
                            ({Math.max(0, transacciones.length - configuracionPaginas.transaccionesEnCierre)} transacciones)
                        </div>
                        <div>• Página {2 + Math.ceil(Math.max(0, transacciones.length - configuracionPaginas.transaccionesEnCierre) / configuracionPaginas.transaccionesPorPaginaIntermedia)}:
                            Cierre ({Math.min(configuracionPaginas.transaccionesEnCierre, transacciones.length)} transacciones)
                        </div>
                        <div>• Página {3 + Math.ceil(Math.max(0, transacciones.length - configuracionPaginas.transaccionesEnCierre) / configuracionPaginas.transaccionesPorPaginaIntermedia)}: Última página</div>
                        <div style={{ marginTop: '8px', fontWeight: '600' }}>
                            Total: {3 + Math.ceil(Math.max(0, transacciones.length - configuracionPaginas.transaccionesEnCierre) / configuracionPaginas.transaccionesPorPaginaIntermedia)} páginas
                        </div>
                    </div>
                )}
            </div>

            {/* Datos del Cliente */}
            <div className="gi-panel" style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', margin: '0 0 12px', color: '#1e293b', fontWeight: '600' }}>
                    👤 Datos del Cliente
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div>
                        <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                            Nombre Completo:
                        </label>
                        <input
                            type="text"
                            value={cliente.nombre}
                            onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
                            placeholder="CENTENO HOLGUIN KEVIN JULIAN"
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                fontSize: '13px'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                            Número de Cuenta:
                        </label>
                        <input
                            type="text"
                            value={cliente.numeroCuenta}
                            onChange={(e) => setCliente({ ...cliente, numeroCuenta: e.target.value })}
                            placeholder="2100123456"
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                fontSize: '13px'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                            C.I./RUC:
                        </label>
                        <input
                            type="text"
                            value={cliente.cedula}
                            onChange={(e) => setCliente({ ...cliente, cedula: e.target.value })}
                            placeholder="0958398984"
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                fontSize: '13px'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                            CICLO:
                        </label>
                        <select
                            value={cliente.ciclo}
                            onChange={(e) => setCliente({ ...cliente, ciclo: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                fontSize: '13px'
                            }}
                        >
                            <option value="1">CICLO 1</option>
                            <option value="2">CICLO 2</option>
                            <option value="3">CICLO 3</option>
                            <option value="4">CICLO 4</option>
                            <option value="5">CICLO 5</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                            AÑO:
                        </label>
                        <select
                            value={cliente.anio}
                            onChange={(e) => setCliente({ ...cliente, anio: parseInt(e.target.value) || 2025 })}
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                fontSize: '13px'
                            }}
                        >
                            {Array.from({ length: 6 }, (_, i) => 2025 + i).map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                            MES:
                        </label>
                        <select
                            value={cliente.mes}
                            onChange={(e) => setCliente({ ...cliente, mes: parseInt(e.target.value) || 0 })}
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                fontSize: '13px'
                            }}
                        >
                            {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => (
                                <option key={i} value={i}>{m}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Configuración de Metas para Generación Lógica */}
                <div style={{
                    background: '#f8fafc',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    marginBottom: '16px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                    <h4 style={{ fontSize: '13px', margin: '0 0 10px', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        🧠 Metas para Generación Lógica
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>Saldo Promedio</label>
                            <input
                                type="number"
                                value={cliente.saldoPromedioObjetivo}
                                onChange={(e) => setCliente({ ...cliente, saldoPromedioObjetivo: e.target.value })}
                                style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>Total Créditos</label>
                            <input
                                type="number"
                                value={cliente.totalCreditosObjetivo}
                                onChange={(e) => setCliente({ ...cliente, totalCreditosObjetivo: e.target.value })}
                                style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>Saldo Anterior (Inicio)</label>
                            <input
                                type="number"
                                value={cliente.saldoAnterior}
                                onChange={(e) => setCliente({ ...cliente, saldoAnterior: e.target.value })}
                                style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            />
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="gi-error" style={{ marginBottom: '16px' }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Panel de Configuración de Coordenadas */}
                {
                    mostrarConfig && (
                        <div className="gi-panel" style={{ marginBottom: '16px', background: '#fffbeb', border: '2px solid #fbbf24' }}>
                            <h3 style={{ fontSize: '16px', margin: '0 0 12px', color: '#92400e' }}>
                                ⚙️ Configuración de Coordenadas del PDF
                            </h3>
                            <div style={{ fontSize: '12px', color: '#78350f', marginBottom: '12px' }}>
                                Ajusta las coordenadas X e Y para cada campo. Genera una vista previa para ver los cambios.
                            </div>

                            {/* Página 1 - Datos del Cliente */}
                            <div style={{ marginBottom: '16px' }}>
                                <h4 style={{ fontSize: '14px', margin: '0 0 8px', color: '#92400e' }}>📄 Página 1 - Datos del Cliente</h4>
                                <div style={{ padding: '8px', background: '#fff', borderRadius: '4px', border: '1px solid #fcd34d' }}>
                                    {/* Nombre (Página 1) */}
                                    <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #fef3c7' }}>
                                        <label style={{ fontSize: '11px', fontWeight: '600', color: '#b45309', display: 'block', marginBottom: '4px' }}>
                                            Nombre del Cliente
                                        </label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                                            <div>
                                                <label style={{ fontSize: '9px', color: '#78350f' }}>X:</label>
                                                <input
                                                    type="number"
                                                    value={coordenadas.nombrePagina1X}
                                                    onChange={(e) => actualizarCoordenada('nombrePagina1X', null, e.target.value)}
                                                    style={{ width: '100%', padding: '2px', fontSize: '11px', border: '1px solid #fde68a' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '9px', color: '#78350f' }}>Y:</label>
                                                <input
                                                    type="number"
                                                    value={coordenadas.nombrePagina1Y}
                                                    onChange={(e) => actualizarCoordenada('nombrePagina1Y', null, e.target.value)}
                                                    style={{ width: '100%', padding: '2px', fontSize: '11px', border: '1px solid #fde68a' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '9px', color: '#78350f' }}>Tamaño:</label>
                                                <input
                                                    type="number"
                                                    value={coordenadas.nombrePagina1FontSize}
                                                    onChange={(e) => actualizarCoordenada('nombrePagina1FontSize', null, e.target.value)}
                                                    style={{ width: '100%', padding: '2px', fontSize: '11px', border: '1px solid #fde68a' }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cuenta (Página 1) */}
                                    <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #fef3c7' }}>
                                        <label style={{ fontSize: '11px', fontWeight: '600', color: '#b45309', display: 'block', marginBottom: '4px' }}>
                                            Número de Cuenta
                                        </label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                                            <div>
                                                <label style={{ fontSize: '9px', color: '#78350f' }}>X:</label>
                                                <input
                                                    type="number"
                                                    value={coordenadas.cuentaPagina1X}
                                                    onChange={(e) => actualizarCoordenada('cuentaPagina1X', null, e.target.value)}
                                                    style={{ width: '100%', padding: '2px', fontSize: '11px', border: '1px solid #fde68a' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '9px', color: '#78350f' }}>Y:</label>
                                                <input
                                                    type="number"
                                                    value={coordenadas.cuentaPagina1Y}
                                                    onChange={(e) => actualizarCoordenada('cuentaPagina1Y', null, e.target.value)}
                                                    style={{ width: '100%', padding: '2px', fontSize: '11px', border: '1px solid #fde68a' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '9px', color: '#78350f' }}>Tamaño:</label>
                                                <input
                                                    type="number"
                                                    value={coordenadas.cuentaPagina1FontSize}
                                                    onChange={(e) => actualizarCoordenada('cuentaPagina1FontSize', null, e.target.value)}
                                                    style={{ width: '100%', padding: '2px', fontSize: '11px', border: '1px solid #fde68a' }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* C.I./RUC (Página 1) */}
                                    <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #fef3c7' }}>
                                        <label style={{ fontSize: '11px', fontWeight: '600', color: '#b45309', display: 'block', marginBottom: '4px' }}>
                                            C.I./RUC
                                        </label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                                            <div>
                                                <label style={{ fontSize: '9px', color: '#78350f' }}>X:</label>
                                                <input
                                                    type="number"
                                                    value={coordenadas.cedulaPagina1X}
                                                    onChange={(e) => actualizarCoordenada('cedulaPagina1X', null, e.target.value)}
                                                    style={{ width: '100%', padding: '2px', fontSize: '11px', border: '1px solid #fde68a' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '9px', color: '#78350f' }}>Y:</label>
                                                <input
                                                    type="number"
                                                    value={coordenadas.cedulaPagina1Y}
                                                    onChange={(e) => actualizarCoordenada('cedulaPagina1Y', null, e.target.value)}
                                                    style={{ width: '100%', padding: '2px', fontSize: '11px', border: '1px solid #fde68a' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '9px', color: '#78350f' }}>Tamaño:</label>
                                                <input
                                                    type="number"
                                                    value={coordenadas.cedulaPagina1FontSize}
                                                    onChange={(e) => actualizarCoordenada('cedulaPagina1FontSize', null, e.target.value)}
                                                    style={{ width: '100%', padding: '2px', fontSize: '11px', border: '1px solid #fde68a' }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ciclo (Página 1) */}
                                    <div style={{ paddingBottom: '8px', borderBottom: '1px solid #fef3c7', marginBottom: '8px' }}>
                                        <label style={{ fontSize: '11px', fontWeight: '600', color: '#b45309', display: 'block', marginBottom: '4px' }}>
                                            Ciclo
                                        </label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                                            <div>
                                                <label style={{ fontSize: '9px', color: '#78350f' }}>X:</label>
                                                <input
                                                    type="number"
                                                    value={coordenadas.cicloPagina1X}
                                                    onChange={(e) => actualizarCoordenada('cicloPagina1X', null, e.target.value)}
                                                    style={{ width: '100%', padding: '2px', fontSize: '11px', border: '1px solid #fde68a' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '9px', color: '#78350f' }}>Y:</label>
                                                <input
                                                    type="number"
                                                    value={coordenadas.cicloPagina1Y}
                                                    onChange={(e) => actualizarCoordenada('cicloPagina1Y', null, e.target.value)}
                                                    style={{ width: '100%', padding: '2px', fontSize: '11px', border: '1px solid #fde68a' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '9px', color: '#78350f' }}>Tamaño:</label>
                                                <input
                                                    type="number"
                                                    value={coordenadas.cicloPagina1FontSize}
                                                    onChange={(e) => actualizarCoordenada('cicloPagina1FontSize', null, e.target.value)}
                                                    style={{ width: '100%', padding: '2px', fontSize: '11px', border: '1px solid #fde68a' }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Fechas de Corte (Página 1) */}
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: '600', color: '#b45309', display: 'block', marginBottom: '4px' }}>
                                            Fechas de Corte
                                        </label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '4px' }}>
                                            <div style={{ fontSize: '10px', color: '#92400e' }}>Inicio (Último Corte)</div>
                                            <div style={{ fontSize: '10px', color: '#92400e' }}>Fin (Este Corte)</div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                            {/* Config Inicio */}
                                            <div style={{ display: 'grid', gap: '2px' }}>
                                                <div style={{ display: 'flex', gap: '2px' }}>
                                                    <span style={{ fontSize: '9px' }}>X:</span>
                                                    <input
                                                        type="number"
                                                        value={coordenadas.fechaCorteInicioX}
                                                        onChange={(e) => actualizarCoordenada('fechaCorteInicioX', null, e.target.value)}
                                                        style={{ width: '100%', padding: '1px', fontSize: '10px' }}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', gap: '2px' }}>
                                                    <span style={{ fontSize: '9px' }}>Y:</span>
                                                    <input
                                                        type="number"
                                                        value={coordenadas.fechaCorteInicioY}
                                                        onChange={(e) => actualizarCoordenada('fechaCorteInicioY', null, e.target.value)}
                                                        style={{ width: '100%', padding: '1px', fontSize: '10px' }}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', gap: '2px' }}>
                                                    <span style={{ fontSize: '9px' }}>T:</span>
                                                    <input
                                                        type="number"
                                                        value={coordenadas.fechaCorteInicioFontSize}
                                                        onChange={(e) => actualizarCoordenada('fechaCorteInicioFontSize', null, e.target.value)}
                                                        style={{ width: '100%', padding: '1px', fontSize: '10px' }}
                                                    />
                                                </div>
                                            </div>
                                            {/* Config Fin */}
                                            <div style={{ display: 'grid', gap: '2px' }}>
                                                <div style={{ display: 'flex', gap: '2px' }}>
                                                    <span style={{ fontSize: '9px' }}>X:</span>
                                                    <input
                                                        type="number"
                                                        value={coordenadas.fechaCorteFinX}
                                                        onChange={(e) => actualizarCoordenada('fechaCorteFinX', null, e.target.value)}
                                                        style={{ width: '100%', padding: '1px', fontSize: '10px' }}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', gap: '2px' }}>
                                                    <span style={{ fontSize: '9px' }}>Y:</span>
                                                    <input
                                                        type="number"
                                                        value={coordenadas.fechaCorteFinY}
                                                        onChange={(e) => actualizarCoordenada('fechaCorteFinY', null, e.target.value)}
                                                        style={{ width: '100%', padding: '1px', fontSize: '10px' }}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', gap: '2px' }}>
                                                    <span style={{ fontSize: '9px' }}>T:</span>
                                                    <input
                                                        type="number"
                                                        value={coordenadas.fechaCorteFinFontSize}
                                                        onChange={(e) => actualizarCoordenada('fechaCorteFinFontSize', null, e.target.value)}
                                                        style={{ width: '100%', padding: '1px', fontSize: '10px' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Fechas de Corte (Posición 2) */}
                                        <div style={{ marginTop: '8px', paddingTop: '4px', borderTop: '1px dashed #fcd34d' }}>
                                            <div style={{ fontSize: '10px', color: '#92400e', marginBottom: '4px', fontWeight: 'bold' }}>Posición 2</div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                {/* Config Inicio 2 */}
                                                <div style={{ display: 'grid', gap: '2px' }}>
                                                    <div style={{ fontSize: '9px', color: '#92400e' }}>Inicio 2</div>
                                                    <div style={{ display: 'flex', gap: '2px' }}>
                                                        <span style={{ fontSize: '9px' }}>X:</span>
                                                        <input type="number" value={coordenadas.fechaCorteInicio2X} onChange={(e) => actualizarCoordenada('fechaCorteInicio2X', null, e.target.value)} style={{ width: '100%', padding: '1px', fontSize: '10px' }} />
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '2px' }}>
                                                        <span style={{ fontSize: '9px' }}>Y:</span>
                                                        <input type="number" value={coordenadas.fechaCorteInicio2Y} onChange={(e) => actualizarCoordenada('fechaCorteInicio2Y', null, e.target.value)} style={{ width: '100%', padding: '1px', fontSize: '10px' }} />
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '2px' }}>
                                                        <span style={{ fontSize: '9px' }}>T:</span>
                                                        <input type="number" value={coordenadas.fechaCorteInicio2FontSize} onChange={(e) => actualizarCoordenada('fechaCorteInicio2FontSize', null, e.target.value)} style={{ width: '100%', padding: '1px', fontSize: '10px' }} />
                                                    </div>
                                                </div>
                                                {/* Config Fin 2 */}
                                                <div style={{ display: 'grid', gap: '2px' }}>
                                                    <div style={{ fontSize: '9px', color: '#92400e' }}>Fin 2</div>
                                                    <div style={{ display: 'flex', gap: '2px' }}>
                                                        <span style={{ fontSize: '9px' }}>X:</span>
                                                        <input type="number" value={coordenadas.fechaCorteFin2X} onChange={(e) => actualizarCoordenada('fechaCorteFin2X', null, e.target.value)} style={{ width: '100%', padding: '1px', fontSize: '10px' }} />
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '2px' }}>
                                                        <span style={{ fontSize: '9px' }}>Y:</span>
                                                        <input type="number" value={coordenadas.fechaCorteFin2Y} onChange={(e) => actualizarCoordenada('fechaCorteFin2Y', null, e.target.value)} style={{ width: '100%', padding: '1px', fontSize: '10px' }} />
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '2px' }}>
                                                        <span style={{ fontSize: '9px' }}>T:</span>
                                                        <input type="number" value={coordenadas.fechaCorteFin2FontSize} onChange={(e) => actualizarCoordenada('fechaCorteFin2FontSize', null, e.target.value)} style={{ width: '100%', padding: '1px', fontSize: '10px' }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Resumen de Cuenta (Página 1) */}
                            <div style={{ padding: '8px', background: '#fff', borderRadius: '4px', border: '1px solid #e2e8f0', marginTop: '16px' }}>
                                <div style={{ borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', marginBottom: '8px' }}>
                                    <h4 style={{ fontSize: '12px', margin: 0, color: '#1e293b' }}>📊 Resumen de Cuenta</h4>
                                </div>
                                <div style={{ display: 'grid', gap: '8px' }}>
                                    {[
                                        { label: 'Saldo Anterior', keyVal: 'saldoAnterior', keyCoord: 'saldoAnterior' },
                                        { label: 'Cant. Depósitos', keyVal: 'cantDepositos', keyCoord: 'cantDepositos' },
                                        { label: 'Depósitos', keyVal: 'depositos', keyCoord: 'depositos' },
                                        { label: 'Cant. Cheques', keyVal: 'cantCheques', keyCoord: 'cantCheques' },
                                        { label: 'Cheques', keyVal: 'cheques', keyCoord: 'cheques' },
                                        { label: 'Interés', keyVal: 'interes', keyCoord: 'interes' },
                                        { label: 'Saldo Actual', keyVal: 'saldoActual', keyCoord: 'saldoActual' },
                                        { label: 'Saldo Promedio', keyVal: 'saldoPromedio', keyCoord: 'saldoPromedio' }
                                    ].map((field) => (
                                        <div key={field.keyCoord} style={{ borderBottom: '1px dashed #e2e8f0', paddingBottom: '4px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#334155' }}>{field.label}</label>
                                                <input
                                                    type="text"
                                                    value={cliente[field.keyVal]}
                                                    onChange={(e) => setCliente({ ...cliente, [field.keyVal]: e.target.value })}
                                                    style={{ width: '80px', fontSize: '10px', padding: '2px', textAlign: 'right' }}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                    <span style={{ fontSize: '9px', color: '#64748b' }}>X:</span>
                                                    <input
                                                        type="number"
                                                        value={coordenadas[`${field.keyCoord}X`]}
                                                        onChange={(e) => actualizarCoordenada(`${field.keyCoord}X`, null, e.target.value)}
                                                        style={{ width: '40px', fontSize: '9px', padding: '1px' }}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                    <span style={{ fontSize: '9px', color: '#64748b' }}>Y:</span>
                                                    <input
                                                        type="number"
                                                        value={coordenadas[`${field.keyCoord}Y`]}
                                                        onChange={(e) => actualizarCoordenada(`${field.keyCoord}Y`, null, e.target.value)}
                                                        style={{ width: '40px', fontSize: '9px', padding: '1px' }}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                    <span style={{ fontSize: '9px', color: '#64748b' }}>T:</span>
                                                    <input
                                                        type="number"
                                                        value={coordenadas[`${field.keyCoord}FontSize`]}
                                                        onChange={(e) => actualizarCoordenada(`${field.keyCoord}FontSize`, null, e.target.value)}
                                                        style={{ width: '30px', fontSize: '9px', padding: '1px' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Encabezado Páginas Intermedias */}
                            <div style={{ padding: '8px', background: '#eef2ff', borderRadius: '4px', border: '1px solid #c7d2fe', marginTop: '16px' }}>
                                <div style={{ borderBottom: '1px solid #a5b4fc', paddingBottom: '4px', marginBottom: '8px' }}>
                                    <h4 style={{ fontSize: '12px', margin: 0, color: '#1e3a8a' }}>📄 Encabezado Pág. Intermedias ({configuracionPaginas.totalPaginas > 2 ? '2+' : 'N/A'})</h4>
                                </div>
                                <div style={{ display: 'grid', gap: '8px' }}>
                                    {[
                                        { label: 'Nombre', keyVal: 'encabezadoNombre' },
                                        { label: 'Cuenta', keyVal: 'encabezadoCuenta' },
                                        { label: 'C.I./RUC', keyVal: 'encabezadoCiRuc' },
                                        { label: 'Ciclo', keyVal: 'encabezadoCiclo' }
                                    ].map((field) => (
                                        <div key={field.keyVal} style={{ borderBottom: '1px dashed #c7d2fe', paddingBottom: '4px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#1e3a8a' }}>{field.label}</label>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                    <span style={{ fontSize: '9px', color: '#4338ca' }}>X:</span>
                                                    <input
                                                        type="number"
                                                        value={coordenadas[`${field.keyVal}X`]}
                                                        onChange={(e) => actualizarCoordenada(`${field.keyVal}X`, null, e.target.value)}
                                                        style={{ width: '40px', fontSize: '9px', padding: '1px' }}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                    <span style={{ fontSize: '9px', color: '#4338ca' }}>Y:</span>
                                                    <input
                                                        type="number"
                                                        value={coordenadas[`${field.keyVal}Y`]}
                                                        onChange={(e) => actualizarCoordenada(`${field.keyVal}Y`, null, e.target.value)}
                                                        style={{ width: '40px', fontSize: '9px', padding: '1px' }}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                    <span style={{ fontSize: '9px', color: '#4338ca' }}>T:</span>
                                                    <input
                                                        type="number"
                                                        value={coordenadas[`${field.keyVal}FontSize`]}
                                                        onChange={(e) => actualizarCoordenada(`${field.keyVal}FontSize`, null, e.target.value)}
                                                        style={{ width: '30px', fontSize: '9px', padding: '1px' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Página 2 - Transacciones */}
                            <div>
                                <h4 style={{ fontSize: '14px', margin: '0 0 8px', color: '#92400e' }}>📄 Página 2 - Transacciones (Lado a Lado)</h4>

                                {/* Control de Espaciado entre Líneas */}
                                <div style={{
                                    background: '#fff',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '2px solid #10b981',
                                    marginBottom: '12px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '13px', fontWeight: '700', color: '#059669', display: 'block', marginBottom: '6px' }}>
                                                📏 Espaciado entre Líneas
                                            </label>
                                            <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                                Ajusta la distancia vertical entre cada transacción
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <button
                                                onClick={() => actualizarCoordenada('transaccionLineHeight', null, coordenadas.transaccionLineHeight - 1)}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: '#ef4444',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '16px',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                −
                                            </button>
                                            <input
                                                type="number"
                                                value={coordenadas.transaccionLineHeight}
                                                onChange={(e) => actualizarCoordenada('transaccionLineHeight', null, e.target.value)}
                                                style={{
                                                    width: '70px',
                                                    padding: '8px',
                                                    fontSize: '16px',
                                                    fontWeight: 'bold',
                                                    border: '2px solid #10b981',
                                                    borderRadius: '6px',
                                                    textAlign: 'center'
                                                }}
                                            />
                                            <button
                                                onClick={() => actualizarCoordenada('transaccionLineHeight', null, coordenadas.transaccionLineHeight + 1)}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: '#10b981',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '16px',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Control de Tamaño de Fuente */}
                                <div style={{
                                    background: '#fff',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '2px solid #3b82f6',
                                    marginBottom: '12px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '13px', fontWeight: '700', color: '#2563eb', display: 'block', marginBottom: '6px' }}>
                                                🔤 Tamaño de Fuente
                                            </label>
                                            <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                                Ajusta el tamaño del texto de las transacciones
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <button
                                                onClick={() => actualizarCoordenada('fontSize', null, Math.max(6, coordenadas.fontSize - 1))}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: '#ef4444',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '16px',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                −
                                            </button>
                                            <input
                                                type="number"
                                                value={coordenadas.fontSize}
                                                onChange={(e) => actualizarCoordenada('fontSize', null, e.target.value)}
                                                min="6"
                                                max="20"
                                                style={{
                                                    width: '70px',
                                                    padding: '8px',
                                                    fontSize: '16px',
                                                    fontWeight: 'bold',
                                                    border: '2px solid #3b82f6',
                                                    borderRadius: '6px',
                                                    textAlign: 'center'
                                                }}
                                            />
                                            <button
                                                onClick={() => actualizarCoordenada('fontSize', null, Math.min(20, coordenadas.fontSize + 1))}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: '#3b82f6',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '16px',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Control de Encabezado de Páginas Intermedias */}
                                <div style={{
                                    background: '#fff',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '2px solid #8b5cf6',
                                    marginBottom: '12px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                    <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#7c3aed', margin: '0 0 12px' }}>
                                        📋 Encabezado de Páginas Intermedias
                                    </h4>

                                    {/* Nombre */}
                                    <div style={{ marginBottom: '12px', padding: '8px', background: '#faf5ff', borderRadius: '4px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b21a8', display: 'block', marginBottom: '6px' }}>
                                            Nombre (Negritas)
                                        </label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                            <div>
                                                <label style={{ fontSize: '10px', color: '#64748b' }}>X:</label>
                                                <input
                                                    type="number"
                                                    value={coordenadas.encabezadoNombreX}
                                                    onChange={(e) => actualizarCoordenada('encabezadoNombreX', null, e.target.value)}
                                                    style={{ width: '100%', padding: '4px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '10px', color: '#64748b' }}>Y:</label>
                                                <input
                                                    type="number"
                                                    value={coordenadas.encabezadoNombreY}
                                                    onChange={(e) => actualizarCoordenada('encabezadoNombreY', null, e.target.value)}
                                                    style={{ width: '100%', padding: '4px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '10px', color: '#64748b' }}>Tamaño:</label>
                                                <input
                                                    type="number"
                                                    value={coordenadas.encabezadoNombreFontSize}
                                                    onChange={(e) => actualizarCoordenada('encabezadoNombreFontSize', null, e.target.value)}
                                                    style={{ width: '100%', padding: '4px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cuenta */}
                                    <div style={{ padding: '8px', background: '#faf5ff', borderRadius: '4px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b21a8', display: 'block', marginBottom: '6px' }}>
                                            Número de Cuenta
                                        </label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                            <div>
                                                <label style={{ fontSize: '10px', color: '#64748b' }}>X:</label>
                                                <input
                                                    type="number"
                                                    value={coordenadas.encabezadoCuentaX}
                                                    onChange={(e) => actualizarCoordenada('encabezadoCuentaX', null, e.target.value)}
                                                    style={{ width: '100%', padding: '4px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '10px', color: '#64748b' }}>Y:</label>
                                                <input
                                                    type="number"
                                                    value={coordenadas.encabezadoCuentaY}
                                                    onChange={(e) => actualizarCoordenada('encabezadoCuentaY', null, e.target.value)}
                                                    style={{ width: '100%', padding: '4px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '10px', color: '#64748b' }}>Tamaño:</label>
                                                <input
                                                    type="number"
                                                    value={coordenadas.encabezadoCuentaFontSize}
                                                    onChange={(e) => actualizarCoordenada('encabezadoCuentaFontSize', null, e.target.value)}
                                                    style={{ width: '100%', padding: '4px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* C.I./RUC */}
                                    <div style={{ padding: '8px', background: '#faf5ff', borderRadius: '4px', marginTop: '12px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b21a8', display: 'block', marginBottom: '6px' }}>
                                            C.I./RUC
                                        </label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                            <div>
                                                <label style={{ fontSize: '10px', color: '#64748b' }}>X:</label>
                                                <input
                                                    type="number"
                                                    value={coordenadas.encabezadoCiRucX}
                                                    onChange={(e) => actualizarCoordenada('encabezadoCiRucX', null, e.target.value)}
                                                    style={{ width: '100%', padding: '4px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '10px', color: '#64748b' }}>Y:</label>
                                                <input
                                                    type="number"
                                                    value={coordenadas.encabezadoCiRucY}
                                                    onChange={(e) => actualizarCoordenada('encabezadoCiRucY', null, e.target.value)}
                                                    style={{ width: '100%', padding: '4px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '10px', color: '#64748b' }}>Tamaño:</label>
                                                <input
                                                    type="number"
                                                    value={coordenadas.encabezadoCiRucFontSize}
                                                    onChange={(e) => actualizarCoordenada('encabezadoCiRucFontSize', null, e.target.value)}
                                                    style={{ width: '100%', padding: '4px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* CICLO */}
                                    <div style={{ padding: '8px', background: '#faf5ff', borderRadius: '4px', marginTop: '12px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b21a8', display: 'block', marginBottom: '6px' }}>
                                            CICLO
                                        </label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                            <div>
                                                <label style={{ fontSize: '10px', color: '#64748b' }}>X:</label>
                                                <input
                                                    type="number"
                                                    value={coordenadas.encabezadoCicloX}
                                                    onChange={(e) => actualizarCoordenada('encabezadoCicloX', null, e.target.value)}
                                                    style={{ width: '100%', padding: '4px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '10px', color: '#64748b' }}>Y:</label>
                                                <input
                                                    type="number"
                                                    value={coordenadas.encabezadoCicloY}
                                                    onChange={(e) => actualizarCoordenada('encabezadoCicloY', null, e.target.value)}
                                                    style={{ width: '100%', padding: '4px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '10px', color: '#64748b' }}>Tamaño:</label>
                                                <input
                                                    type="number"
                                                    value={coordenadas.encabezadoCicloFontSize}
                                                    onChange={(e) => actualizarCoordenada('encabezadoCicloFontSize', null, e.target.value)}
                                                    style={{ width: '100%', padding: '4px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Número de Página */}
                                    <div style={{ padding: '8px', background: '#faf5ff', borderRadius: '4px', marginTop: '12px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b21a8', display: 'block', marginBottom: '6px' }}>
                                            Número de Página (Superior Derecha)
                                        </label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                            <div>
                                                <label style={{ fontSize: '10px', color: '#64748b' }}>X:</label>
                                                <input
                                                    type="number"
                                                    value={coordenadas.numeroPaginaX}
                                                    onChange={(e) => actualizarCoordenada('numeroPaginaX', null, e.target.value)}
                                                    style={{ width: '100%', padding: '4px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '10px', color: '#64748b' }}>Y:</label>
                                                <input
                                                    type="number"
                                                    value={coordenadas.numeroPaginaY}
                                                    onChange={(e) => actualizarCoordenada('numeroPaginaY', null, e.target.value)}
                                                    style={{ width: '100%', padding: '4px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '10px', color: '#64748b' }}>Tamaño:</label>
                                                <input
                                                    type="number"
                                                    value={coordenadas.numeroPaginaFontSize}
                                                    onChange={(e) => actualizarCoordenada('numeroPaginaFontSize', null, e.target.value)}
                                                    style={{ width: '100%', padding: '4px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
                                    {['transaccionesInicioY', 'transaccionesColumna1X', 'transaccionesColumna2X',
                                        'colFecha', 'colOfic', 'colNDoc', 'colDescripcion', 'colDebito', 'colCredito', 'colSaldo'].map(campo => (
                                            <div key={campo} style={{ background: '#fff', padding: '8px', borderRadius: '6px', border: '1px solid #fbbf24' }}>
                                                <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>
                                                    {campo.replace(/([A-Z])/g, ' $1').replace('col', 'Col ')}
                                                </div>
                                                <input
                                                    type="number"
                                                    value={coordenadas[campo]}
                                                    onChange={(e) => actualizarCoordenada(campo, null, e.target.value)}
                                                    style={{ width: '100%', padding: '4px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                                                />
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Datos del Cliente */}
                <div className="gi-panel" style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', margin: '0 0 12px', color: '#1e293b' }}>
                        📋 Datos del Cliente (Opcionales)
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                        <div>
                            <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                Nombre Completo
                            </label>
                            <input
                                type="text"
                                value={cliente.nombre}
                                onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
                                placeholder="Juan Pérez García"
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                Número de Cuenta
                            </label>
                            <input
                                type="text"
                                value={cliente.numeroCuenta}
                                onChange={(e) => setCliente({ ...cliente, numeroCuenta: e.target.value })}
                                placeholder="2100123456"
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                Tipo de Cuenta
                            </label>
                            <select
                                value={cliente.tipoCuenta}
                                onChange={(e) => setCliente({ ...cliente, tipoCuenta: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px'
                                }}
                            >
                                <option value="AHORROS">Ahorros</option>
                                <option value="CORRIENTE">Corriente</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                Período
                            </label>
                            <input
                                type="text"
                                value={cliente.periodo}
                                onChange={(e) => setCliente({ ...cliente, periodo: e.target.value })}
                                placeholder="Enero 2024"
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                Saldo Inicial ($)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={cliente.saldoInicial}
                                onChange={(e) => {
                                    setCliente({ ...cliente, saldoInicial: parseFloat(e.target.value) || 0 });
                                    if (transacciones.length > 0) {
                                        recalcularSaldos(transacciones);
                                    }
                                }}
                                placeholder="1000.00"
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Agregar Transacción */}
                <div className="gi-panel" style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', margin: '0 0 12px', color: '#1e293b' }}>
                        ➕ Agregar Transacción
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto 1fr auto auto auto', gap: '8px', alignItems: 'end' }}>
                        <div>
                            <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                Fecha
                            </label>
                            <input
                                type="date"
                                value={nuevaTransaccion.fecha}
                                onChange={(e) => setNuevaTransaccion({ ...nuevaTransaccion, fecha: e.target.value })}
                                style={{
                                    padding: '8px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                OFIC.
                            </label>
                            <input
                                type="text"
                                value={nuevaTransaccion.ofic}
                                onChange={(e) => setNuevaTransaccion({ ...nuevaTransaccion, ofic: e.target.value })}
                                placeholder="001"
                                style={{
                                    width: '60px',
                                    padding: '8px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                N.DOC.
                            </label>
                            <input
                                type="text"
                                value={nuevaTransaccion.ndoc}
                                onChange={(e) => setNuevaTransaccion({ ...nuevaTransaccion, ndoc: e.target.value })}
                                placeholder="123456"
                                style={{
                                    width: '80px',
                                    padding: '8px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                Descripción
                            </label>
                            <input
                                type="text"
                                value={nuevaTransaccion.descripcion}
                                onChange={(e) => setNuevaTransaccion({ ...nuevaTransaccion, descripcion: e.target.value })}
                                placeholder="Transferencia recibida"
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                Débito ($)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={nuevaTransaccion.debito}
                                onChange={(e) => setNuevaTransaccion({ ...nuevaTransaccion, debito: e.target.value })}
                                placeholder="0.00"
                                style={{
                                    width: '120px',
                                    padding: '8px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                Crédito ($)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={nuevaTransaccion.credito}
                                onChange={(e) => setNuevaTransaccion({ ...nuevaTransaccion, credito: e.target.value })}
                                placeholder="0.00"
                                style={{
                                    width: '120px',
                                    padding: '8px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                        <button
                            onClick={agregarTransaccion}
                            style={{
                                padding: '8px 16px',
                                background: '#2563eb',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '14px',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            ➕ Agregar
                        </button>
                    </div>
                </div>

                {/* Tabla de Transacciones */}
                {
                    transacciones.length > 0 && (
                        <div className="gi-panel" style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h3 style={{ fontSize: '16px', margin: 0, color: '#1e293b' }}>
                                    📊 Transacciones ({transacciones.length})
                                </h3>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => generarPDF(true)}
                                        disabled={generandoPDF}
                                        style={{
                                            padding: '6px 12px',
                                            background: '#059669',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            cursor: generandoPDF ? 'wait' : 'pointer',
                                            fontWeight: '600'
                                        }}
                                    >
                                        👁️ Vista Previa
                                    </button>
                                    <button
                                        onClick={() => generarPDF(false)}
                                        disabled={generandoPDF}
                                        style={{
                                            padding: '6px 12px',
                                            background: '#ef4444',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            cursor: generandoPDF ? 'wait' : 'pointer',
                                            fontWeight: '600'
                                        }}
                                    >
                                        📥 Descargar PDF
                                    </button>
                                </div>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    fontSize: '13px'
                                }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                            <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Fecha</th>
                                            <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>OFIC.</th>
                                            <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>N.DOC.</th>
                                            <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Descripción</th>
                                            <th style={{ padding: '10px', textAlign: 'right', fontWeight: '600', color: '#475569' }}>Débito</th>
                                            <th style={{ padding: '10px', textAlign: 'right', fontWeight: '600', color: '#475569' }}>Crédito</th>
                                            <th style={{ padding: '10px', textAlign: 'right', fontWeight: '600', color: '#475569' }}>Saldo</th>
                                            <th style={{ padding: '10px', textAlign: 'center', fontWeight: '600', color: '#475569' }}>Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transacciones.map((t) => (
                                            <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '10px' }}>{t.fecha}</td>
                                                <td style={{ padding: '10px' }}>{t.ofic}</td>
                                                <td style={{ padding: '10px' }}>{t.ndoc}</td>
                                                <td style={{ padding: '10px' }}>{t.descripcion}</td>
                                                <td style={{ padding: '10px', textAlign: 'right', color: '#dc2626' }}>
                                                    {t.debito > 0 ? `$${t.debito.toFixed(2)}` : '-'}
                                                </td>
                                                <td style={{ padding: '10px', textAlign: 'right', color: '#059669' }}>
                                                    {t.credito > 0 ? `$${t.credito.toFixed(2)}` : '-'}
                                                </td>
                                                <td style={{ padding: '10px', textAlign: 'right', fontWeight: '600' }}>
                                                    ${t.saldo.toFixed(2)}
                                                </td>
                                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => eliminarTransaccion(t.id)}
                                                        style={{
                                                            padding: '4px 8px',
                                                            background: '#fef2f2',
                                                            color: '#dc2626',
                                                            border: '1px solid #fecaca',
                                                            borderRadius: '4px',
                                                            fontSize: '12px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        🗑️
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        <tr style={{ background: '#f8fafc', fontWeight: '600' }}>
                                            <td colSpan="6" style={{ padding: '10px', textAlign: 'right' }}>Saldo Final:</td>
                                            <td style={{ padding: '10px', textAlign: 'right', fontSize: '14px', color: '#1e293b' }}>
                                                ${transacciones[transacciones.length - 1].saldo.toFixed(2)}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                }

                {/* Vista Previa del PDF */}
                {
                    pdfPreviewUrl && (
                        <div style={{
                            marginTop: '16px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: '#f8fafc',
                            position: 'relative'
                        }}>
                            <div style={{
                                padding: '8px',
                                background: '#fff',
                                borderBottom: '1px solid #e2e8f0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>
                                    📄 Vista Previa del Estado de Cuenta
                                </span>
                                <button
                                    onClick={() => setPdfPreviewUrl(null)}
                                    style={{
                                        border: 'none',
                                        background: '#fff',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        borderRadius: '50%',
                                        width: '24px',
                                        height: '24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    ✖️
                                </button>
                            </div>
                            <iframe
                                src={`${pdfPreviewUrl}#toolbar=0&navpanes=0`}
                                title="Vista Previa PDF"
                                style={{ width: '100%', height: '600px', border: 'none' }}
                            />
                        </div>
                    )
                }
            </div>
        </div>
    );
};

export default EstadoCuentaBancaria;
