// backend/node/routes/authRoutes.js
import { Router } from "express";
import { 
  login, 
  initiateSignup,
  completeSignup
} from "../controllers/authController.js";
import { validateLogin } from "../middlewares/validationMiddlerware.js";

const router = Router();

// Two-step signup process
router.post("/initiate-signup", initiateSignup);
router.post("/complete-signup", completeSignup);

// Login route
router.post("/login", validateLogin, login);

export default router;






































































// import { Router } from "express";
// import { login, signup } from "../controllers/authController.js";
// import { validateLogin, validateSignup } from "../middlewares/validationMiddlerware.js";

// const router = Router();

// router.post("/signup", validateSignup, signup); // driver must include license
// router.post("/login", validateLogin, login);

// export default router;









