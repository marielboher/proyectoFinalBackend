import ProductManager from "../dao/ProductManager.js";
import { cartModel } from "../models/cart.model.js";
import CartService from "../services/cartServices.js";
import ticketController from "./ticketController.js";
import Swal from "sweetalert2";
import { v4 as uuidv4 } from "uuid";

class CartController {
  constructor() {
    this.cartService = new CartService();
    this.productManager = new ProductManager();
  }

  async createCart(req, res) {
    try {
      const newCart = await this.cartService.createCart();
      res.status(201).json({
        status: "success",
        message: "El Carrito se creó correctamente!",
        cartId: newCart._id,
        payload: newCart,
      });
      req.logger.info("Cart created:", newCart);
    } catch (error) {
      res.status(500).send({
        status: "error",
        message: error.message,
      });
      req.logger.error("Error creating cart:", error);
    }
  }

  async getCart(req, res) {
    try {
      const cart = await this.cartService.getCart(req.params.cid);
      res.json({
        status: "success",
        cart: cart,
      });
      req.logger.info("Cart retrieved:", cart);
    } catch (error) {
      res.status(400).send({
        status: "error",
        message: error.message,
      });
      req.logger.error("Error getting cart:", error);
    }
  }

  async getCartById(cartId) {
    try {
      const cart = await this.cartService.getCart(cartId);
      if (!cart) {
        throw new Error("Cart not found");
      }
      return cart;
    } catch (error) {
      console.error("Error getting cart:", error);
      throw error;
    }
  }

  async addProductToCart(req, res) {
    try {
      const { cid, pid } = req.params;
      const userId = req.user._id;

      const product = await this.productManager.getProductById(pid);
      if (!product) {
        return res.status(404).send({
          status: "error",
          message: "Producto no encontrado",
        });
      }

      if (
        req.user.role === "premium" &&
        product.owner.toString() === userId.toString()
      ) {
        Swal.fire({
          icon: "warning",
          title: "No puedes agregar tus propios productos",
          text: "Como usuario premium, no puedes agregar tus propios productos al carrito",
        });
        return res.status(403).send({
          status: "error",
          message:
            "Como usuario premium, no puedes agregar tus propios productos al carrito",
        });
      }

      const result = await this.cartService.addProductToCart(cid, pid);
      res.send(result);
    } catch (error) {
      res.status(400).send({
        status: "error",
        message: error.message,
      });
    }
  }
  async updateQuantityProductFromCart(req, res) {
    try {
      const { cid, pid } = req.params;
      const { quantity } = req.body;
      const result = await this.cartService.updateQuantityProductFromCart(
        cid,
        pid,
        quantity
      );
      res.send(result);
    } catch (error) {
      res.status(400).send({ status: "error", message: error.message });
    }
  }

  async updateCart(req, res) {
    try {
      const cid = req.params.cid;
      const products = req.body.products;
      await this.cartService.updateCart(cid, products);
      res.send({
        status: "ok",
        message: "El producto se agregó correctamente!",
      });
    } catch (error) {
      res.status(400).send({ status: "error", message: error.message });
    }
  }

  async deleteProductFromCart(req, res) {
    try {
      const { cid, pid } = req.params;
      const result = await this.cartService.deleteProductFromCart(cid, pid);
      res.send(result);
    } catch (error) {
      res.status(400).send({ status: "error", message: error.message });
    }
  }

  async deleteProductsFromCart(cartId) {
    try {
      await this.cartService.deleteProductsFromCart(cartId);
      console.log("Carrito vaciado con éxito");
    } catch (error) {
      console.error("Error al vaciar el carrito:", error);
      throw error;
    }
  }

  async createPurchaseTicket(cartId, userEmail) {
    try {
      const cart = await this.cartService.getCart(cartId);

      if (!cart) {
        throw new Error("Carrito no encontrado");
      }

      console.log("Productos en el carrito:", cart.products);

      const failedProducts = [];
      const successfulProducts = [];

      for (const item of cart.products) {
        const product = await this.productManager.getProductById(item.product);

        if (!product) {
          console.error(`Producto ${item.product} no encontrado`);
          failedProducts.push(item);
          continue;
        }

        if (product.stock < item.quantity) {
          console.error(`Stock insuficiente para el producto ${item.product}`);
          failedProducts.push(item);
        } else {
          successfulProducts.push(item);
          const newStock = product.stock - item.quantity;
          await this.productManager.updateProduct(item.product, {
            stock: newStock,
          });
        }
      }

      if (successfulProducts.length === 0) {
        throw new Error("No se pudo comprar ningún producto");
      }

      const totalAmount = successfulProducts.reduce((total, item) => {
        const productPrice = item.product.price;
        const productQuantity = item.quantity;

        if (
          typeof productPrice !== "number" ||
          typeof productQuantity !== "number"
        ) {
          console.error(
            "Precio o cantidad inválidos para el producto:",
            item.product
          );
          return total;
        }

        return total + productPrice * productQuantity;
      }, 0);

      if (isNaN(totalAmount)) {
        throw new Error("Error al calcular el monto total de la compra");
      }

      const ticketData = {
        code: uuidv4(),
        purchase_datetime: new Date(),
        amount: totalAmount,
        purchaser: userEmail,
      };

      console.log("Datos del ticket antes de crear:", ticketData);

      const ticketCreated = await ticketController.createTicket(ticketData);

      await this.deleteProductsFromCart(cartId);

      return { success: true, ticketId: ticketCreated._id };
    } catch (error) {
      console.error("Error específico al crear el ticket de compra:", error);
      throw new Error("Error al crear el ticket de compra");
    }
  }

  async getPurchase(req, res) {
    try {
      const cid = req.params.cid;
      const purchase = await this.cartService.getCart(cid);

      if (purchase) {
        res.json({ status: "success", data: purchase });
      } else {
        res
          .status(404)
          .json({ status: "error", message: "Compra no encontrada" });
      }
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ status: "error", message: "Error interno del servidor" });
    }
  }
}

export default new CartController();
