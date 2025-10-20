import express from "express";
import googleOauthRouter from "./routes/googleOauth.js";
import hubspotOauthRouter from "./routes/hubspotOauth.js";
import chatRouter from "./routes/chat.js";
import queryRoutes from "./routes/query.js";
import userRoutes from "./routes/user.js";
import indexUserRouter from "./routes/indexUserData.js";


const app = express();
app.use(express.json());

app.use("/api/google/oauth", googleOauthRouter);
app.use("/api/hubspot/oauth", hubspotOauthRouter);
app.use("/api/index-user", indexUserRouter);

app.use("/api/chat", chatRouter);
app.use("/api/query", queryRoutes); 
app.use("/api/auth-test", userRoutes); 

app.listen(4000, () => {
  console.log("Backend running on http://localhost:4000");
});
