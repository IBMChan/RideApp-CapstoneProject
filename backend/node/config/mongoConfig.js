import { connect } from "mongoose";

export const connectDB = async () => {
    try {
        const conn = await connect(`${process.env.MONGO_URL}/${process.env.MONGO_DB}`);
    } catch (error) {
        process.exit(1);
    }
}

