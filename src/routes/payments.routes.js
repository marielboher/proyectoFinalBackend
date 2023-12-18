import { Router } from "express";
import {
  createPayment,
  handlePaymentSuccess,
} from "../controllers/payment.controller.js";

const paymentsRouter = Router();

paymentsRouter.post("/create-checkout-session", createPayment);

paymentsRouter.get("/payment-success", handlePaymentSuccess);

paymentsRouter.get("/cancel", (req, res) => {});

export default paymentsRouter;
