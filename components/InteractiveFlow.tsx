import React, { useState } from 'react';
import { 
  Compass, Box, Target, Store, FileText, BadgePercent, CheckCircle2, 
  ShieldAlert, Landmark, Truck, FileCheck, RefreshCcw, Receipt, 
  CalendarDays, PiggyBank, Scale, FileSpreadsheet, Play, ChevronRight, HelpCircle
} from 'lucide-react';
import { ViewMode, Order, PaymentRecord, ClientStore, Product, UserSession } from '../types';

interface InteractiveFlowProps {
  orders: Order[];
  payments: PaymentRecord[];
  clients: ClientStore[];
  products: Product[];
  session: UserSession;
  onNavigate: (view: ViewMode) => void;
}

interface ProcessNode {
  id: string;
  title: string;
  subtitle: string;
  phase: 'PLANIF' | 'VENTA' | 'OPERAC' | 'COBRO';
  role: 'ADMIN' | 'SELLER' | 'BOTH' | 'LOGISTICS';
  icon: React.ComponentType<{ size: number; className?: string }>;
  description: string;
  colorClass: {
    bg: string;
    border: string;
    text: string;
    hover: string;
    glow: string;
  };
  metricsTitle: string;
  actionLabel?: string;
  targetView?: ViewMode;
}

export const InteractiveFlow: React.FC<InteractiveFlowProps> = ({
  orders,
  payments,
  clients,
  products,
  session,
  onNavigate
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('toma-pedido');

  const processNodes: ProcessNode[] = [
    // PLANIF
    {
      id: 'asignacion-ruta',
      title: 'Asignación de Ruta',
      subtitle: 'Vendedor recibe cartera',
      phase: 'PLANIF',
      role: 'ADMIN',
      icon: Compass,
      description: 'El supervisor coordina la cartera de clientes específica asignada a cada preventista de campo. Esto optimiza el tiempo de viaje evitando el cruce de zonas y maximizando la cobertura geográfica diaria.',
      colorClass: {
        bg: 'bg-blue-50/90',
        border: 'border-blue-200',
        text: 'text-blue-800',
        hover: 'hover:bg-blue-100 hover:border-blue-400',
        glow: 'shadow-blue-100'
      },
      metricsTitle: 'Distribución Zonal de Clientes',
      actionLabel: 'Gestionar Clientes y Zonas',
      targetView: ViewMode.CLIENTS
    },
    {
      id: 'consulta-stock',
      title: 'Consulta de Stock',
      subtitle: 'Precios y disponibilidad',
      phase: 'PLANIF',
      role: 'BOTH',
      icon: Box,
      description: 'Antes de iniciar el trabajo de campo, el preventista revisa en tiempo real los saldos críticos del almacén y precios de venta para evitar vender productos agotados o con precios desactualizados.',
      colorClass: {
        bg: 'bg-teal-50/90',
        border: 'border-teal-200',
        text: 'text-teal-800',
        hover: 'hover:bg-teal-100 hover:border-teal-400',
        glow: 'shadow-teal-100'
      },
      metricsTitle: 'Inspección de Catálogo y Stock',
      actionLabel: 'Ver Catálogo y Stock Kardex',
      targetView: ViewMode.INVENTORY
    },
    {
      id: 'metas-dia',
      title: 'Metas del Día',
      subtitle: 'Cuota y prioridades',
      phase: 'PLANIF',
      role: 'BOTH',
      icon: Target,
      description: 'Cada preventista tiene objetivos claros asignados hoy para enfocar su esfuerzo comercial: volumen de venta en soles, productos foco (con sobrestock o alta rentabilidad), promociones de campaña y cuota de cobertura.',
      colorClass: {
        bg: 'bg-indigo-50/90',
        border: 'border-indigo-200',
        text: 'text-indigo-800',
        hover: 'hover:bg-indigo-100 hover:border-indigo-400',
        glow: 'shadow-indigo-100'
      },
      metricsTitle: 'Logro de Objetivos Diarios (Cuota global estimada: S/ 5,000)'
    },

    // VENTA
    {
      id: 'visita-tienda',
      title: 'Visita a Tienda',
      subtitle: 'Relevamiento y exhibición',
      phase: 'VENTA',
      role: 'SELLER',
      icon: Store,
      description: 'El preventista realiza la visita física al comercio, saluda al dueño de la bodega, observa el stock en percha/anaquel (relevamiento) y verifica la visibilidad de nuestros productos clave, sugiriendo reposición inmediata.',
      colorClass: {
        bg: 'bg-orange-50/90',
        border: 'border-orange-200',
        text: 'text-orange-800',
        hover: 'hover:bg-orange-100 hover:border-orange-400',
        glow: 'shadow-orange-100'
      },
      metricsTitle: 'Cobertura Física de Tiendas',
      actionLabel: 'Ver Agenda de Tiendas',
      targetView: ViewMode.CLIENTS
    },
    {
      id: 'toma-pedido',
      title: 'Toma de Pedido',
      subtitle: 'App / formulario manual',
      phase: 'VENTA',
      role: 'SELLER',
      icon: FileText,
      description: 'Se levanta el pedido en caliente directamente con el cliente en campo registrando productos, cantidades y bonificaciones. El pedido ingresa al sistema inmediatamente reduciendo errores administrativos y acelerando el despacho.',
      colorClass: {
        bg: 'bg-rose-50/90',
        border: 'border-rose-200',
        text: 'text-rose-800',
        hover: 'hover:bg-rose-100 hover:border-rose-400',
        glow: 'shadow-rose-100'
      },
      metricsTitle: 'Pre-Ventas Tomadas Hoy',
      actionLabel: 'Iniciar Toma de Pedidos',
      targetView: ViewMode.SELL_FIELD
    },
    {
      id: 'negociacion',
      title: 'Negociación',
      subtitle: 'Descuentos, promociones',
      phase: 'VENTA',
      role: 'SELLER',
      icon: BadgePercent,
      description: 'Aplicación de escalas de precio y ofertas vigentes por volumen (por ejemplo, por caja). El preventista tiene un rango de negociación de descuentos aprobado por el ERP corporativo para cerrar la orden con mayor rentabilidad.',
      colorClass: {
        bg: 'bg-purple-50/90',
        border: 'border-purple-200',
        text: 'text-purple-800',
        hover: 'hover:bg-purple-100 hover:border-purple-400',
        glow: 'shadow-purple-100'
      },
      metricsTitle: 'Descuentos Especiales Permitidos & Margen Comercial'
    },
    {
      id: 'confirmacion',
      title: 'Confirmación',
      subtitle: 'Pedido enviado al sistema',
      phase: 'VENTA',
      role: 'ADMIN',
      icon: CheckCircle2,
      description: 'El pedido de preventa se transmite al backend de Toome Preventas, donde queda grabado como "Pendiente de Confirmar" listo para la validación de crédito y asignación logística del despachador.',
      colorClass: {
        bg: 'bg-emerald-50/90',
        border: 'border-emerald-200',
        text: 'text-emerald-800',
        hover: 'hover:bg-emerald-100 hover:border-emerald-400',
        glow: 'shadow-emerald-100'
      },
      metricsTitle: 'Pedidos en Sistema Esperando Aprobación',
      actionLabel: 'Confirmar y Autorizar Pedidos',
      targetView: ViewMode.ORDERS_CONFIRM
    },

    // OPERACIONES
    {
      id: 'val-credito',
      title: 'Validación de Crédito',
      subtitle: 'Límite y morosidad',
      phase: 'OPERAC',
      role: 'ADMIN',
      icon: ShieldAlert,
      description: 'Antes de realizar el despacho físico, la administración evalúa computacionalmente si la tienda superó su cupo de deudas vivas de preventas anteriores, bloqueando preventivamente el camión si arrastra historial impago.',
      colorClass: {
        bg: 'bg-amber-50/90',
        border: 'border-amber-200',
        text: 'text-amber-800',
        hover: 'hover:bg-amber-100 hover:border-amber-400',
        glow: 'shadow-amber-100'
      },
      metricsTitle: 'Rendimiento de Deuda en Calle',
      actionLabel: 'Monitorear Deuda y Créditos',
      targetView: ViewMode.PAYMENTS
    },
    {
      id: 'aprobacion',
      title: 'Aprobación',
      subtitle: 'ERP genera la orden',
      phase: 'OPERAC',
      role: 'ADMIN',
      icon: Landmark,
      description: 'Al corroborar el cupo financiero y disponibilidad real, el ERP convierte la preventa en una orden oficial de picking. Se emite la lista de preparación automatizada del almacén para conformar la carga diaria.',
      colorClass: {
        bg: 'bg-lime-50/90',
        border: 'border-lime-200',
        text: 'text-lime-800',
        hover: 'hover:bg-lime-100 hover:border-lime-400',
        glow: 'shadow-lime-100'
      },
      metricsTitle: 'Pedidos Oficiales Aprobados para Despachar'
    },
    {
      id: 'picking-despacho',
      title: 'Picking y Despacho',
      subtitle: 'Almacén prepara pedido',
      phase: 'OPERAC',
      role: 'LOGISTICS',
      icon: Truck,
      description: 'Operarios del almacén central realizan el consolidado y picking de mercadería. Los productos son cargados de forma estructurada en el furgón de reparto ordenados por secuencia lógica de entrega sobre el mapa.',
      colorClass: {
        bg: 'bg-sky-50/90',
        border: 'border-sky-200',
        text: 'text-sky-800',
        hover: 'hover:bg-sky-100 hover:border-sky-400',
        glow: 'shadow-sky-100'
      },
      metricsTitle: 'Logística de Rutas y Distribución',
      actionLabel: 'Programar Rutas de Despacho',
      targetView: ViewMode.ROUTES
    },
    {
      id: 'entrega-tienda',
      title: 'Entrega en Tienda',
      subtitle: 'Repartidor + factura',
      phase: 'OPERAC',
      role: 'LOGISTICS',
      icon: Truck,
      description: 'El transportista llega a la coordenada de la tienda en su camión asignado, descarga las cajas correspondientes y le entrega el comprobante físico/digital al cliente detallando lo facturado.',
      colorClass: {
        bg: 'bg-cyan-50/90',
        border: 'border-cyan-200',
        text: 'text-cyan-800',
        hover: 'hover:bg-cyan-100 hover:border-cyan-400',
        glow: 'shadow-cyan-100'
      },
      metricsTitle: 'Estatus del Reparto Diario'
    },
    {
      id: 'conformidad',
      title: 'Conformidad',
      subtitle: 'Firma de recepción',
      phase: 'OPERAC',
      role: 'BOTH',
      icon: FileCheck,
      description: 'El comerciante de la tienda verifica que las unidades descargadas coincidan con la guía de remisión, y firma la conformidad en el dispositivo móvil del furgón o en papel de cargo.',
      colorClass: {
        bg: 'bg-emerald-50/90',
        border: 'border-emerald-200',
        text: 'text-emerald-800',
        hover: 'hover:bg-emerald-100 hover:border-emerald-400',
        glow: 'shadow-emerald-100'
      },
      metricsTitle: 'Visitas y Entregas con Cargo Conforme'
    },
    {
      id: 'devoluciones',
      title: 'Devoluciones',
      subtitle: 'Nota de crédito / rechazo',
      phase: 'OPERAC',
      role: 'BOTH',
      icon: RefreshCcw,
      description: 'En caso de daños en la mercadería, vencimientos detectados o rechazo del pedido a pie de camión, se carga de vuelta al vehículo emitiéndose una Nota de Crédito comercial de inmediato en el ERP.',
      colorClass: {
        bg: 'bg-rose-50/90',
        border: 'border-rose-200',
        text: 'text-rose-800',
        hover: 'hover:bg-rose-100 hover:border-rose-400',
        glow: 'shadow-rose-100'
      },
      metricsTitle: 'Rechazos de Campo Procesados'
    },

    // COBRO
    {
      id: 'facturacion',
      title: 'Facturación',
      subtitle: 'Comprobante electrónico',
      phase: 'COBRO',
      role: 'ADMIN',
      icon: Receipt,
      description: 'Al entregarse conforme, el sistema finaliza el comprobante de pago oficial (Boleta o Factura electrónica peruana), enviando el XML ante SUNAT y actualizando el pasivo tributario de la empresa.',
      colorClass: {
        bg: 'bg-blue-50/90',
        border: 'border-blue-200',
        text: 'text-blue-800',
        hover: 'hover:bg-blue-100 hover:border-blue-400',
        glow: 'shadow-blue-100'
      },
      metricsTitle: 'Facturación y Comprobantes de Pago'
    },
    {
      id: 'condicion-pago',
      title: 'Condición de Pago',
      subtitle: 'Contado / crédito 15-30d',
      phase: 'COBRO',
      role: 'BOTH',
      icon: CalendarDays,
      description: 'La transacción se liquida según la condición pactada. Puede ser cobrado en Efectivo o Yape en el acto (Contado) o alimentarse a la cuenta corriente del cliente para cobro diferido (Crédito a 7, 15 o 30 días).',
      colorClass: {
        bg: 'bg-purple-50/90',
        border: 'border-purple-200',
        text: 'text-purple-800',
        hover: 'hover:bg-purple-100 hover:border-purple-400',
        glow: 'shadow-purple-100'
      },
      metricsTitle: 'Condiciones Comerciales Aplicadas Hoy'
    },
    {
      id: 'cobranza-campo',
      title: 'Cobranza en Campo',
      subtitle: 'Vendedor o cobrador',
      phase: 'COBRO',
      role: 'SELLER',
      icon: PiggyBank,
      description: 'En su siguiente visita comercial o mediante un cobrador dedicado, se gestiona el recaudo financiero del saldo histórico adeudado por la tienda, registrándose amortizaciones y abonos al instante.',
      colorClass: {
        bg: 'bg-amber-50/90',
        border: 'border-amber-200',
        text: 'text-amber-800',
        hover: 'hover:bg-amber-100 hover:border-amber-400',
        glow: 'shadow-amber-100'
      },
      metricsTitle: 'Estatus Financiero de Recaudaciones',
      actionLabel: 'Ver Registro de Recaudación',
      targetView: ViewMode.PAYMENTS
    },
    {
      id: 'liquidacion-diaria',
      title: 'Liquidación Diaria',
      subtitle: 'Vendedor rinde al cierre',
      phase: 'COBRO',
      role: 'SELLER',
      icon: Scale,
      description: 'Al final de la jornada de venta, el preventista realiza la cuadratura rindiendo el dinero en efectivo recaudado en banco y los códigos de operación digital capture de Yape ante el tesorero de la empresa.',
      colorClass: {
        bg: 'bg-slate-50/90',
        border: 'border-slate-200',
        text: 'text-slate-800',
        hover: 'hover:bg-slate-100 hover:border-slate-400',
        glow: 'shadow-slate-100'
      },
      metricsTitle: 'Caja del Preventista'
    },
    {
      id: 'reporte-supervisor',
      title: 'Reporte Supervisor',
      subtitle: 'Efectividad y cobertura',
      phase: 'COBRO',
      role: 'ADMIN',
      icon: FileSpreadsheet,
      description: 'Los supervisores corporativos revisan los indicadores acumulados de campo: volumen neto, efectividad de visita (drop size), efectividad por ruta y tasa de rechazos o deudas vencidas.',
      colorClass: {
        bg: 'bg-indigo-50/90',
        border: 'border-indigo-200',
        text: 'text-indigo-800',
        hover: 'hover:bg-indigo-100 hover:border-indigo-400',
        glow: 'shadow-indigo-100'
      },
      metricsTitle: 'BI - Cobertura & Eficacia General',
      actionLabel: 'Ver Panel de Estadísticas',
      targetView: ViewMode.REPORTS
    },
    {
      id: 'analisis-ajuste',
      title: 'Análisis y Ajuste',
      subtitle: 'Ajuste de ruta / cuota',
      phase: 'COBRO',
      role: 'ADMIN',
      icon: Compass,
      description: 'Retroalimentación continua. Mediante el cruce de datos históricos de compra se reorganiza la frecuencia de visita geográfica, rediseñando zonas de reparto para la preventa del día de mañana.',
      colorClass: {
        bg: 'bg-sky-50/90',
        border: 'border-sky-200',
        text: 'text-sky-800',
        hover: 'hover:bg-sky-100 hover:border-sky-400',
        glow: 'shadow-sky-100'
      },
      metricsTitle: 'Bucle Cerrado: Optimización de Puntos de Venta'
    }
  ];

  const selectedNode = processNodes.find(n => n.id === selectedNodeId) || processNodes[0];

  // Live Metric Calculators based on real-time React state
  const getLiveMetrics = (nodeId: string) => {
    const totalSalesVol = orders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + o.total, 0);
    const approvedAbonos = payments.filter(p => p.approvedByAdmin).reduce((sum, p) => sum + p.amount, 0);

    switch (nodeId) {
      case 'asignacion-ruta':
        const zonesSet = new Set(clients.map(c => c.zone));
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-xxs text-slate-400 uppercase block font-bold">Zonas de Preventa</span>
              <span className="text-lg font-black text-slate-800">{zonesSet.size} Zonas</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-xxs text-slate-400 uppercase block font-bold">Clientes en Cartera</span>
              <span className="text-lg font-black text-slate-800">{clients.length} Tiendas</span>
            </div>
          </div>
        );
      case 'consulta-stock':
        const criticalStock = products.filter(p => p.stock <= p.minStock);
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-xxs text-slate-400 uppercase block font-bold">Catálogo de Productos</span>
              <span className="text-lg font-black text-slate-800">{products.length} SKU</span>
            </div>
            <div className={`p-3 rounded-xl ${criticalStock.length > 0 ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
              <span className="text-xxs text-slate-400 uppercase block font-bold">Stock Crítico Bajo</span>
              <span className="text-lg font-black">{criticalStock.length} Alertas</span>
            </div>
          </div>
        );
      case 'metas-dia':
        const quotaPercentage = Math.min(100, Math.round((totalSalesVol / 5000) * 100));
        return (
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>S/ {totalSalesVol.toLocaleString('es-PE', { minimumFractionDigits: 2 })} recolectados</span>
              <span>{quotaPercentage}% de la Cuota</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-teal-500 to-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${quotaPercentage}%` }}></div>
            </div>
          </div>
        );
      case 'visita-tienda':
        const activeClientsToday = new Set(orders.filter(o => o.status !== 'CANCELLED').map(o => o.storeId));
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-xxs text-slate-400 uppercase block font-bold">Visitas efectivas hoy</span>
              <span className="text-lg font-black text-[#017E84]">{activeClientsToday.size} tiendas</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-xxs text-slate-400 uppercase block font-bold">Cartera de clientes total</span>
              <span className="text-lg font-black text-slate-800">{clients.length} tiendas</span>
            </div>
          </div>
        );
      case 'toma-pedido':
        const pendingOrders = orders.filter(o => o.status === 'PENDING_CONFIRMATION');
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-xxs text-slate-400 uppercase block font-bold">Preventas sin Confirmar</span>
              <span className="text-lg font-black text-orange-600">{pendingOrders.length} ped.</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-xxs text-slate-400 uppercase block font-bold">Monto Registrado</span>
              <span className="text-sm font-black text-slate-800">S/ {pendingOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}</span>
            </div>
          </div>
        );
      case 'negociacion':
        const discountedOrdersCount = orders.filter(o => o.items.some(i => i.discount > 0)).length;
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-xxs text-slate-400 uppercase block font-bold">Ventas con Descuento</span>
              <span className="text-lg font-black text-purple-700">{discountedOrdersCount} pedidos</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-xxs text-slate-400 uppercase block font-bold">Tolerancia Máxima ERP</span>
              <span className="text-lg font-black text-slate-800">10.00%</span>
            </div>
          </div>
        );
      case 'confirmacion':
        const ordersForApproval = orders.filter(o => o.status === 'PENDING_CONFIRMATION');
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-xxs text-slate-400 uppercase block font-bold">Pedidos Pendientes</span>
              <span className="text-lg font-black text-[#017E84]">{ordersForApproval.length} pendientes</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-xxs text-slate-400 uppercase block font-bold">Total Confirmados</span>
              <span className="text-sm font-black text-slate-800">{orders.filter(o => o.status === 'CONFIRMED' || o.status === 'DELIVERED').length} despachados</span>
            </div>
          </div>
        );
      case 'val-credito':
        const totalCreditoDeuda = clients.reduce((sum, c) => sum + c.outstandingBalance, 0);
        const debtorsCount = clients.filter(c => c.outstandingBalance > 0).length;
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-xxs text-slate-400 uppercase block font-bold">Deuda viva global en calle</span>
              <span className="text-lg font-black text-rose-650">S/ {totalCreditoDeuda.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-xxs text-slate-400 uppercase block font-bold">Tiendas con Deuda Activa</span>
              <span className="text-lg font-black text-slate-800">{debtorsCount} clientes</span>
            </div>
          </div>
        );
      case 'aprobacion':
        const approvedOrders = orders.filter(o => o.status === 'CONFIRMED');
        return (
          <div className="bg-slate-50 p-3 rounded-xl flex justify-between items-center">
            <div>
              <span className="text-xxs text-slate-400 uppercase block font-bold">Pedidos Oficiales en Espera de Ruta</span>
              <span className="text-lg font-black text-emerald-700">{approvedOrders.length} unidades</span>
            </div>
            <div className="text-right">
              <span className="text-xxs text-slate-400 uppercase block font-bold">Mesa de Emisión</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Operativa</span>
            </div>
          </div>
        );
      case 'picking-despacho':
        const activeRoutesCount = routes.filter(r => r.status === 'ACTIVE').length;
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-xxs text-slate-400 uppercase block font-bold">Vehículos en ruta activa</span>
              <span className="text-lg font-black text-sky-800">{activeRoutesCount} unidades</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-xxs text-slate-400 uppercase block font-bold">Rutas totales creadas</span>
              <span className="text-lg font-black text-slate-800">{routes.length} armadas</span>
            </div>
          </div>
        );
      case 'entrega-tienda':
        const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length;
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-xxs text-slate-400 uppercase block font-bold">Pedidos descargados hoy</span>
              <span className="text-lg font-black text-cyan-800">{deliveredCount} entregados</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-xxs text-slate-400 uppercase block font-bold">Efectividad de Entrega</span>
              <span className="text-lg font-black text-slate-800">100%</span>
            </div>
          </div>
        );
      case 'conformidad':
        const compliantDeliveries = orders.filter(o => o.status === 'DELIVERED').length;
        return (
          <div className="bg-slate-50 p-3 rounded-xl flex justify-between items-center">
            <div>
              <span className="text-xxs text-slate-400 uppercase block font-bold">Entregas con Check-in Digital</span>
              <span className="text-sm font-extrabold text-slate-800">{compliantDeliveries} de {orders.filter(o => o.status !== 'CANCELLED' && o.status !== 'PENDING_CONFIRMATION').length} unidades despachadas</span>
            </div>
            <div className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0">
              Conforme
            </div>
          </div>
        );
      case 'devoluciones':
        return (
          <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center text-slate-500">
            <div>
              <span className="text-xxs text-slate-400 uppercase block font-bold">Rechazos en el período comercial</span>
              <span className="text-sm font-semibold text-slate-705">0 reclamos recibidos hoy</span>
            </div>
            <span className="text-[10px] text-slate-400 italic">Mermas del 0.00%</span>
          </div>
        );
      case 'facturacion':
        const billedOrders = orders.filter(o => o.status !== 'CANCELLED');
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-xxs text-slate-400 uppercase block font-bold">Comprobantes XML SUNAT</span>
              <span className="text-lg font-black text-blue-800">{billedOrders.length} emitidos</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-xxs text-slate-400 uppercase block font-bold">Firma Digital SUNAT</span>
              <span className="text-xs font-bold text-emerald-600 block mt-1">✓ Sincronizado</span>
            </div>
          </div>
        );
      case 'condicion-pago':
        const creditCount = orders.filter(o => o.paymentMethod === 'TRANSFER' || o.paymentMethod === 'CREDIT_CARD').length;
        const cashCount = orders.filter(o => o.paymentMethod === 'CASH' || o.paymentMethod === 'YAPE').length;
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-xxs text-slate-400 uppercase block font-bold">Venta al Contado</span>
              <span className="text-sm font-bold text-slate-800">{cashCount} pedidos</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-xxs text-slate-400 uppercase block font-bold">Créditos de Preventistas</span>
              <span className="text-sm font-bold text-indigo-700">{creditCount} vigentes</span>
            </div>
          </div>
        );
      case 'cobranza-campo':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-xxs text-slate-400 uppercase block font-bold">Suma de Abonos Ingresados</span>
              <span className="text-lg font-black text-emerald-700">S/ {approvedAbonos.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-xxs text-slate-400 uppercase block font-bold">Abonos por Aprobar</span>
              <span className="text-base font-bold text-orange-600">{payments.filter(p => !p.approvedByAdmin).length} recibos</span>
            </div>
          </div>
        );
      case 'liquidacion-diaria':
        const totalCaja = payments.reduce((sum, p) => sum + p.amount, 0);
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-xxs text-slate-400 uppercase block font-bold">Efectivo total rendido</span>
              <span className="text-base font-black text-[#017E84]">S/ {totalCaja.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-xxs text-slate-400 uppercase block font-bold">Cierres de Preventistas</span>
              <span className="text-sm font-bold text-slate-700">{payments.length} transacciones</span>
            </div>
          </div>
        );
      case 'reporte-supervisor':
        const totalClientsCount = Math.max(1, clients.length);
        const coveredCount = new Set(orders.filter(o => o.status !== 'CANCELLED').map(o => o.storeId)).size;
        const coverageRate = ((coveredCount / totalClientsCount) * 100).toFixed(1);
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-xxs text-slate-400 uppercase block font-bold">Cobertura Comercial</span>
              <span className="text-lg font-black text-indigo-900">{coverageRate}%</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-xxs text-slate-400 uppercase block font-bold">Ticket Promedio Venta</span>
              <span className="text-sm font-black text-slate-850">S/ {orders.length > 0 ? (totalSalesVol / orders.length).toFixed(1) : '0.00'}</span>
            </div>
          </div>
        );
      case 'analisis-ajuste':
        const zonesGrouped = Array.from(new Set(clients.map(c => c.zone)));
        return (
          <div className="bg-slate-50 p-3 rounded-xl text-slate-650 text-xs">
            <span className="text-xxs text-slate-400 block uppercase font-bold mb-1">Rutas geoposicionadas óptimas</span>
            Se recalibran <strong className="text-slate-900">{zonesGrouped.length} zonas de preventa</strong> utilizando análisis de calor y dispersión de pedidos. El bucle se retroalimenta diariamente.
          </div>
        );

      default:
        return null;
    }
  };

  const getPhaseNodes = (phase: 'PLANIF' | 'VENTA' | 'OPERAC' | 'COBRO') => {
    return processNodes.filter(n => n.phase === phase);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 font-sans">
      
      {/* Header Info */}
      <div className="border-b border-slate-100 pb-5">
        <h5 className="text-[10px] font-bold text-[#017E84] tracking-widest uppercase mb-1 flex items-center gap-1.5">
          <HelpCircle size={13} /> MAPA INTERACTIVO DE PRODUCCIÓN
        </h5>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
          Ingeniería de Procesos Toome Campo
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Flujo integral de preventa, picking y recaudaciones en calle. Haz clic en cualquiera de las etapas del diagrama para auditar la información técnica y operacional relacionada.
        </p>
      </div>

      {/* Main Layout containing Diagram and Detail panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Diagram Area - Takes 2 cols */}
        <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-800 relative overflow-hidden flex flex-col justify-between select-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full filter blur-3xl rounded-tl-full"></div>
          
          <div className="space-y-6 relative z-10">
            {/* Phase 1: PLANIFICACIÓN */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest border-l-2 border-blue-500 pl-2">I. PLANIFICACIÓN (PRE-SALIDA)</span>
              <div className="grid grid-cols-3 gap-3">
                {getPhaseNodes('PLANIF').map(node => {
                  const NodeIcon = node.icon;
                  const isSelected = selectedNodeId === node.id;
                  return (
                    <div 
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`cursor-pointer transition-all duration-200 p-3 rounded-2xl border text-left flex flex-col justify-between h-24 relative shadow-sm ${
                        isSelected 
                          ? 'bg-blue-600 text-white border-blue-500 ring-4 ring-blue-500/25 scale-[1.03] ' + node.colorClass.glow
                          : `${node.colorClass.bg} ${node.colorClass.border} ${node.colorClass.text} ${node.colorClass.hover}`
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <NodeIcon size={18} className={isSelected ? 'text-white' : 'text-blue-600'} />
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'}`}>
                          {node.role === 'ADMIN' ? 'ADM' : 'PREV'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold leading-tight">{node.title}</h4>
                        <p className={`text-[9px] mt-0.5 mt-auto leading-none truncate ${isSelected ? 'text-blue-150' : 'text-slate-500 font-medium'}`}>{node.subtitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Connecting arrow separator */}
            <div className="flex justify-center my-1">
              <div className="h-6 w-0.5 bg-gradient-to-b from-blue-400 to-orange-400 relative">
                <div className="absolute -bottom-1 -left-1 text-orange-400 leading-none">▼</div>
              </div>
            </div>

            {/* Phase 2: VENTA */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest border-l-2 border-orange-500 pl-2">II. VENTA EN CAMPO (PREVENTISTA)</span>
              <div className="grid grid-cols-4 gap-2.5">
                {getPhaseNodes('VENTA').map(node => {
                  const NodeIcon = node.icon;
                  const isSelected = selectedNodeId === node.id;
                  return (
                    <div 
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`cursor-pointer transition-all duration-200 p-2.5 rounded-2xl border text-left flex flex-col justify-between h-24 relative shadow-sm ${
                        isSelected 
                          ? 'bg-orange-600 text-white border-orange-500 ring-4 ring-orange-500/25 scale-[1.03] ' + node.colorClass.glow
                          : `${node.colorClass.bg} ${node.colorClass.border} ${node.colorClass.text} ${node.colorClass.hover}`
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <NodeIcon size={16} className={isSelected ? 'text-white' : 'text-orange-600'} />
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${isSelected ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-850'}`}>
                          {node.role === 'ADMIN' ? 'ADM' : node.role === 'SELLER' ? 'PREV' : 'AMB'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xxs font-extrabold leading-tight">{node.title}</h4>
                        <p className={`text-[8px] mt-0.5 leading-none truncate ${isSelected ? 'text-orange-150' : 'text-slate-500 font-medium'}`}>{node.subtitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Connecting arrow separator */}
            <div className="flex justify-center my-1">
              <div className="h-6 w-0.5 bg-gradient-to-b from-orange-400 to-teal-400 relative">
                <div className="absolute -bottom-1 -left-1 text-teal-400 leading-none">▼</div>
              </div>
            </div>

            {/* Phase 3: OPERACIONES */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest border-l-2 border-teal-500 pl-2">III. OPERACIONES & DESPACHO LOGÍSTICO</span>
              <div className="grid grid-cols-3 gap-3">
                {getPhaseNodes('OPERAC').slice(0, 3).map(node => {
                  const NodeIcon = node.icon;
                  const isSelected = selectedNodeId === node.id;
                  return (
                    <div 
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`cursor-pointer transition-all duration-200 p-3 rounded-2xl border text-left flex flex-col justify-between h-24 relative shadow-sm ${
                        isSelected 
                          ? 'bg-teal-600 text-white border-teal-500 ring-4 ring-teal-500/25 scale-[1.03] ' + node.colorClass.glow
                          : `${node.colorClass.bg} ${node.colorClass.border} ${node.colorClass.text} ${node.colorClass.hover}`
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <NodeIcon size={18} className={isSelected ? 'text-white' : 'text-teal-600'} />
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${isSelected ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800'}`}>
                          {node.role === 'ADMIN' ? 'ADM' : node.role === 'LOGISTICS' ? 'LOG' : 'AMB'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold leading-tight">{node.title}</h4>
                        <p className={`text-[9px] mt-0.5 leading-none truncate ${isSelected ? 'text-teal-150' : 'text-slate-500 font-medium'}`}>{node.subtitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Subrow (Entrega, Conformidad, Devoluciones) */}
              <div className="grid grid-cols-3 gap-3">
                {getPhaseNodes('OPERAC').slice(3, 6).map(node => {
                  const NodeIcon = node.icon;
                  const isSelected = selectedNodeId === node.id;
                  return (
                    <div 
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`cursor-pointer transition-all duration-200 p-3 rounded-2xl border text-left flex flex-col justify-between h-24 relative shadow-sm ${
                        isSelected 
                          ? 'bg-teal-600 text-white border-teal-500 ring-4 ring-teal-500/25 scale-[1.03] ' + node.colorClass.glow
                          : `${node.colorClass.bg} ${node.colorClass.border} ${node.colorClass.text} ${node.colorClass.hover}`
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <NodeIcon size={18} className={isSelected ? 'text-white' : 'text-teal-600'} />
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${isSelected ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800'}`}>
                          {node.role === 'BOTH' ? 'AMB' : node.role === 'LOGISTICS' ? 'REPART' : 'AMB'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold leading-tight">{node.title}</h4>
                        <p className={`text-[9px] mt-0.5 leading-none truncate ${isSelected ? 'text-indigo-150' : 'text-slate-500 font-medium'}`}>{node.subtitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Connecting arrow separator */}
            <div className="flex justify-center my-1">
              <div className="h-6 w-0.5 bg-gradient-to-b from-teal-400 to-indigo-400 relative">
                <div className="absolute -bottom-1 -left-1 text-indigo-400 leading-none">▼</div>
              </div>
            </div>

            {/* Phase 4: COBRO */}
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-2">IV. FACTURACIÓN, COBRANZA Y RENDICIÓN</span>
              
              {/* Row 4.1 */}
              <div className="grid grid-cols-3 gap-3">
                {getPhaseNodes('COBRO').slice(0, 3).map(node => {
                  const NodeIcon = node.icon;
                  const isSelected = selectedNodeId === node.id;
                  return (
                    <div 
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`cursor-pointer transition-all duration-200 p-3 rounded-2xl border text-left flex flex-col justify-between h-24 relative shadow-sm ${
                        isSelected 
                          ? 'bg-indigo-600 text-white border-indigo-500 ring-4 ring-indigo-500/25 scale-[1.03] ' + node.colorClass.glow
                          : `${node.colorClass.bg} ${node.colorClass.border} ${node.colorClass.text} ${node.colorClass.hover}`
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <NodeIcon size={18} className={isSelected ? 'text-white' : 'text-indigo-600'} />
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${isSelected ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'}`}>
                          {node.role === 'ADMIN' ? 'ADM' : node.role === 'SELLER' ? 'PREV' : 'AMB'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold leading-tight">{node.title}</h4>
                        <p className={`text-[9px] mt-0.5 leading-none truncate ${isSelected ? 'text-indigo-150' : 'text-slate-500 font-medium'}`}>{node.subtitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Row 4.2 Closure indicators */}
              <div className="grid grid-cols-3 gap-3">
                {getPhaseNodes('COBRO').slice(3, 6).map(node => {
                  const NodeIcon = node.icon;
                  const isSelected = selectedNodeId === node.id;
                  return (
                    <div 
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`cursor-pointer transition-all duration-200 p-3 rounded-2xl border text-left flex flex-col justify-between h-24 relative shadow-sm ${
                        isSelected 
                          ? 'bg-indigo-600 text-white border-indigo-500 ring-4 ring-indigo-500/25 scale-[1.03] ' + node.colorClass.glow
                          : `${node.colorClass.bg} ${node.colorClass.border} ${node.colorClass.text} ${node.colorClass.hover}`
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <NodeIcon size={18} className={isSelected ? 'text-white' : 'text-indigo-600'} />
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'}`}>
                          {node.role === 'ADMIN' ? 'ADM' : 'PREV'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold leading-tight">{node.title}</h4>
                        <p className={`text-[9px] mt-0.5 leading-none truncate ${isSelected ? 'text-indigo-150' : 'text-slate-500 font-medium'}`}>{node.subtitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Closed feedback Loop Tracker */}
            <div className="pt-2 flex justify-start items-center gap-2">
              <div className="h-0.5 flex-1 bg-dashed bg-slate-700 relative flex justify-center">
                <div className="absolute top-1/2 left-0 w-2 h-2 rounded-full bg-indigo-400 -translate-y-1/2"></div>
                <div className="absolute top-1/2 right-0 w-2 h-2 rounded-full bg-blue-400 -translate-y-1/2"></div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900 px-3 z-10">Bucle de Proceso Cerrado - Ajuste de Rutas Mañana</span>
              </div>
            </div>

          </div>
        </div>

        {/* Detailed Audit & Metrics Dashboard Panel - Takes 1 col */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-spreadsheet flex flex-col justify-between min-h-[500px]">
          
          <div className="space-y-6">
            {/* Stage title */}
            <div className="border-b border-slate-100 pb-4 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inspeccionando Etapa</span>
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-slate-50 rounded-xl text-slate-700">
                  {React.createElement(selectedNode.icon, { size: 24, className: 'text-[#017E84]' })}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 leading-tight">{selectedNode.title}</h3>
                  <span className="text-[10px] text-slate-400 font-medium block">{selectedNode.subtitle}</span>
                </div>
              </div>
            </div>

            {/* Description card */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">¿Cómo funciona el proceso?</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {selectedNode.description}
              </p>
            </div>

            {/* Live Metrics container */}
            <div className="bg-slate-50/60 rounded-2xl p-4 border border-slate-150/50 space-y-3">
              <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                <span className="w-2 h-2 rounded-full bg-[#017E84]"></span>
                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  {selectedNode.metricsTitle}
                </h5>
              </div>
              
              <div className="pt-1">
                {getLiveMetrics(selectedNode.id)}
              </div>
            </div>
          </div>

          {/* Action Button if navigation target exists */}
          {selectedNode.targetView && (
            <div className="pt-6 border-t border-slate-100">
              <button
                onClick={() => onNavigate(selectedNode.targetView!)}
                className="w-full bg-[#017E84] hover:bg-[#01686c] text-white py-3 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Play size={13} className="fill-white" />
                <span>{selectedNode.actionLabel || `Ir a modulo`}</span>
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
