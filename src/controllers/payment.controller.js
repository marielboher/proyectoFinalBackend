import Stripe from "stripe";
import cartControllers from "./cartControllers.js";
import { ENV_CONFIG } from "../config/config.js";

const stripe = new Stripe(ENV_CONFIG.stripeKey);

export const createPayment = async (req, res) => {
  const cartId = req.body.cartId;

  if (!cartId) {
    return res.status(400).json({ error: "Cart ID is required" });
  }

  try {
    const cart = await cartControllers.getCartById(cartId);

    if (!cart || !cart.products || cart.products.length === 0) {
      throw new Error("El carrito está vacío o no se pudo cargar");
    }

    const lineItems = cart.products.map((item) => {
      if (!item.product || !item.product.price) {
        throw new Error(
          `Producto no válido o sin precio: ${
            item.product ? item.product.title : "Desconocido"
          }`
        );
      }

      const unitAmount = Math.round(item.product.price * 100);

      if (isNaN(unitAmount)) {
        throw new Error(
          `Precio inválido para el producto: ${item.product.title}`
        );
      }
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.product.title,
          },
          unit_amount: unitAmount,
        },
        quantity: item.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `http://localhost:8000/payment/payment-success?session_id={CHECKOUT_SESSION_ID}&cart_id=${cartId}`,
      cancel_url: "http://localhost:8000/cancel",
    });

    res.json(session);
  } catch (error) {
    console.error("Error al crear la sesión de pago:", error);
    res.status(500).send("Error interno del servidor");
  }
};
export const handlePaymentSuccess = async (req, res) => {
  const sessionId = req.query.session_id;
  const cartId = req.query.cart_id;
  const emailUser = req.session.user.email;

  if (!sessionId || !cartId) {
    return res.status(400).send("Faltan parámetros necesarios");
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      try {
        const result = await cartControllers.createPurchaseTicket(
          cartId,
          emailUser
        );
        if (result.success) {
          return res.redirect(`/mostrar-ticket/${result.ticketId}`);
        } else {
          return res.status(500).send("Error al crear el ticket de compra");
        }
      } catch (error) {
        console.error("Error al procesar el pago:", error);
        return res.status(500).send("Error interno del servidor");
      }
    } else {
      return res.status(400).send("El pago no se completó con éxito");
    }
  } catch (error) {
    console.error("Error al procesar el pago:", error);
    return res.status(500).send("Error interno del servidor");
  }
};
