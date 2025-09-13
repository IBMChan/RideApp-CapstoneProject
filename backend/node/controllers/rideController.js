//laxmikanth: notification(email(smtp) - phone (firebase))
// prathik : book ride - ride accpet - ride cancel - basic functionalities wrt ride - type of vehicle based on sleection
//payment(paypal) and rating functionalities(r_to_d, d_to_r)

// ride.controller.js
import RideService from "../services/rideService.js";
import redisClient from "../config/redisConfig.js";

class RideController {
    // Rider creates a new ride
    async createRide(req, res) {
        try {
            const rider_id = 1; // TODO: from auth
            const { ride, matchedDrivers } = await RideService.createRide(req.body, rider_id);

            // ride is guaranteed to exist, fetch from redis if needed
            const rideData = await redisClient.get(`ride:${ride.ride_id}`);
            const rideFromCache = rideData ? JSON.parse(rideData) : ride;

            res.status(201).json({
                success: true,
                message: "Ride created successfully. Drivers matched.",
                ride_id: ride.ride_id,
                ride: rideFromCache,
                matchedDrivers,
            });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }


    // Driver gets pending rides
    async getPendingRides(req, res) {
        try {
            const rides = await RideService.getPendingRidesForDriver();
            res.json({ success: true, rides });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    // Driver accepts a ride
    async acceptRide(req, res) {
        try {
            const { ride_id } = req.params;
            const driver_id = req.user?.id; // From Auth
            // const driver_id = 18;
            const ride = await RideService.acceptRide(ride_id, driver_id);
            res.json({ success: true, ride });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    // Update ride status
    async updateRideStatus(req, res) {
        try {
            const { ride_id } = req.params;
            const { status } = req.body;
            const { id: userId, role } = req.user;

            const ride = await RideService.updateRideStatus(
                ride_id,
                status,
                userId,
                role
            );
            res.json({ success: true, ride });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    async completeRide(req, res) {
        try {
            const { ride_id } = req.params;
            const ride = await RideService.completeRide(ride_id);
            res.json({ success: true, ride });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    async cancelRide(req, res) {
        try {
            const { ride_id } = req.params;
            const ride = await RideService.cancelRide(ride_id);
            res.json({ success: true, ride });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    async getOngoingRides(req, res) {
        try {
            const driver_id = req.user?.id;
            const rides = await RideService.getOngoingRides(driver_id);
            res.json({ success: true, rides });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    async getRideHistory(req, res) {
        try {
            const driver_id = req.user?.id;
            const rides = await RideService.getRideHistory(driver_id);
            res.json({ success: true, rides });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    async getRide(req, res) {
        try {
            const { ride_id } = req.params;
            const ride = await RideService.getRide(ride_id);
            res.json({ success: true, ride });
        } catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    }

    async listRides(req, res) {
        try {
            const { id: user_id, role } = req.user;
            const rides = await RideService.listRides(user_id, role);
            res.json({ success: true, rides });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }
}

export default new RideController();
