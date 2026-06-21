import React from 'react';
import { QRCodeSVG } from 'qrcode.react'; // Asegúrate de instalar: npm i qrcode.react

export function OrderReceipt({ cartItems, totalPrice, deliveryCode, websiteUrl }) {
  // Calculamos la cantidad total de platos en el carrito
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="max-w-md mx-auto bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden font-sans text-stone-800">
      {/* Encabezado con la identidad de Punto 5 */}
      <div className="bg-gradient-to-r from-green-800 to-green-700 p-6 text-center text-white relative">
        <h2 className="text-3xl font-black tracking-tight">
          Punto <span className="text-green-300">5</span>
        </h2>
        <p className="text-xs text-green-100 uppercase tracking-widest mt-1">
          Recibo de Pedido
        </p>

        {/* Decoración estilo ticket cortado al fondo */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[radial-gradient(circle,transparent_20%,white_20%)] bg-[length:10px_10px]"></div>
      </div>

      {/* Contenido del Recibo */}
      <div className="p-6 space-y-6">
        {/* Código de Delivery Destacado */}
        <div className="bg-stone-50 border border-dashed border-stone-300 rounded-xl p-4 text-center">
          <span className="text-xs text-stone-500 uppercase font-bold tracking-wider block mb-1">
            Código de Delivery
          </span>
          <span className="text-2xl font-mono font-black text-green-700 tracking-widest">
            {deliveryCode}
          </span>
        </div>

        {/* Resumen de Platos */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
            Detalle del Pedido ({totalItems} platos)
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded text-xs">
                    x{item.quantity}
                  </span>
                  <span className="font-medium text-stone-700">
                    {item.name}
                  </span>
                </div>
                <span className="font-mono text-stone-600">
                  GHS {(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <hr className="border-t border-dashed border-stone-200" />

        {/* Totales */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-stone-500">
            <span>Subtotal ({totalItems} items)</span>
            <span className="font-mono">GHS {totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-stone-500">
            <span>Envío / Delivery</span>
            <span className="text-green-600 font-bold uppercase text-[10px] bg-green-50 px-1.5 py-0.5 rounded">
              Gratis
            </span>
          </div>
          <div className="flex justify-between items-baseline pt-2">
            <span className="text-base font-bold text-stone-900">
              Total Pagado
            </span>
            <span className="text-2xl font-mono font-black text-stone-950">
              GHS {totalPrice.toFixed(2)}
            </span>
          </div>
        </div>

        <hr className="border-t border-dashed border-stone-200" />

        {/* Sección del Código QR */}
        <div className="flex flex-col items-center justify-center pt-2 space-y-3">
          <div className="p-3 bg-white border border-stone-200 rounded-xl shadow-sm">
            <QRCodeSVG
              value={websiteUrl}
              size={120}
              bgColor={"#ffffff"}
              fgColor={"#166534"} // Color verde oscuro (matching tailwind green-800)
              level={"M"}
            />
          </div>
          <div className="text-center">
            <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              ¡Escanea para visitar nuestra Web!
            </p>
            <p className="text-[10px] text-stone-400 mt-0.5">
              Punto 5 Restaurant • Accra, Ghana
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}