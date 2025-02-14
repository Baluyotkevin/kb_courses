import express from "express";
import { createStripePaymentIntent, createTransaction, listTransactions } from "../controllers/transactionController";

const router = express.Router();

router.post("/", createTransaction);
router.post("/stripe/payment-intent", createStripePaymentIntent);
router.get("/", listTransactions);

export default router;