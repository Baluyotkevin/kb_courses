import Stripe from "stripe";
import dotenv from "dotenv";
import { Request, Response } from "express";
import Course from "../models/courseModel";
import Transaction from "../models/transactionModel";
import UserCourseProgress from "../models/userCourseProgressModel";

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error (
        "STRIPE_SECRET_KEY is required but was not found in env variables"
    )
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createStripePaymentIntent = async (
    req: Request,
    res: Response
): Promise<void> => {

    let { amount } = req.body;

    if (!amount || amount <= 0 ) {
        amount = 50;
    };

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: "usd",
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: "never",
            }
        });

        res.json({ 
            message: "", 
            data: {
                clientSecret: paymentIntent.client_secret,
        }});

    } catch (err) {
        res.status(500).json({ message: "Error creating stripe payment intent", err})
    }
};

export const createTransaction = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { userId, courseId, transactionId, amount, paymentProvider } = req.body;


    try {
        // 1. Get course info
        const course = await Course.get(courseId);
        // 2. Create transaction record
        const newTransaction = new Transaction({
            dateTime: new Date().toISOString(),
            userId,
            courseId,
            transactionId,
            amount,
            paymentProvider
        });

        await newTransaction.save();

        // 3. Create initial course progress
        const initialProgress = new UserCourseProgress({
            userId,
            courseId,
            enrollmentDate: new Date().toISOString(),
            overAllProgress: 0,
            sections: course.sections.map((section: any) => ({
                sectionId: section.sectionId,
                chapters: section.chapters.map((chapter: any) => ({
                    chapterId: chapter.chapterId,
                    completed: false
                }))
            })),
            lastAccessedTimestamp: new Date().toISOString()
        })
        await initialProgress.save()

        // 4. Add enrollment to relevant course
        await Course.update(
                { courseId },
                { 
                    $ADD: {
                        enrollments: [{ userId }],
                    },
                }
            );

        res.json({
            message: "Purchase Course sucess",
            data: {
                transaction: newTransaction,
                courseProgress: initialProgress}
        })

    } catch (err) {
        res.status(500).json({ message: "Error creating transaction and enrollment", err})
    }
};

export const listTransactions = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { userId }= req.query;
    try {
        const transaction = userId ? await Transaction.query("userId").eq(userId).exec() : await Transaction.scan().exec();

        res.json({ 
            message: "Transactions retrieved successfully",
            data: transaction
        });

    } catch (err) {
        res.status(500).json({ message: "Error retrieving transcation", err})
    }
};
