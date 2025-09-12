import { connect } from "mongoose";

export const connectDB = async () => {
    try {
        const conn = await connect(`${process.env.MONGO_URL}/${process.env.DB_NAME}`);
    } catch (error) {
        process.exit(1);
    }
}

