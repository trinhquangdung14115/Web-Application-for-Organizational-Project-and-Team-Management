// src/app.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import router from "./routes.js";
import taskRoutes from "./routes/task.routes.js"; 
import commentRoutes from "./routes/comment.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import projectRoutes from "./routes/project.routes.js";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();

app.use(cors({
  origin: ['http://localhost:5173',
           'http://localhost:3000',
          'https://web-application-for-organizational-project-and-team.vercel.app', 
          'https://web-application-for-organizational.vercel.app',
          'https://web-application-for-organizational-project-and-team-rl1wsormn.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(morgan("dev"));

app.use("/api", router);
app.use("/api", taskRoutes);
app.use("/api", commentRoutes);
app.use("/api", notificationRoutes);
app.use("/api", projectRoutes);

// Hàm log routes
function printRoutes(stack, parentPath = '') {
  stack.forEach((middleware) => {
    if (middleware.route) {
      const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
      console.log(`Route: ${methods} ${parentPath}${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      const routerPath = middleware.regexp.source
        .replace('\\/?', '')
        .replace('(?=\\/|$)', '')
        .replace(/\\\//g, '/');
      
      printRoutes(middleware.handle.stack, parentPath + routerPath);
    }
  });
}

console.log('\n Registered Routes:');
printRoutes(app._router.stack, '');
console.log('');

// Swagger
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerDoc = YAML.load(path.join(__dirname, "..", "openapi.yaml"));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

export default app;
