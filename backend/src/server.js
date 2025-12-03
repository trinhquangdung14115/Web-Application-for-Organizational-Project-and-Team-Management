import { connectDB } from "./config/db.js";
import app from "./app.js";
import setupCronJobs from './services/cron.service.js';

const PORT = process.env.PORT || 4000;

await connectDB();
setupCronJobs();

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
