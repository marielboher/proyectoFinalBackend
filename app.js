import express from "express";
import Handlebars from "handlebars";
import expressHandlebars from "express-handlebars";
import __dirname from "./utils.js";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cartsRouter from "./src/routes/cart.routes.js";
import productsRouter from "./src/routes/product.routes.js";
import viewsRouter from "./src/routes/views.routes.js";
import { messageModel } from "./src/models/message.model.js";
import ProductManager from "./src/dao/ProductManager.js";
import { allowInsecurePrototypeAccess } from "@handlebars/allow-prototype-access";
import sessionsRouter from "./src/routes/sessions.routes.js";
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "passport";
import initializePassport from "./src/config/passport.config.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { ENV_CONFIG } from "./src/config/config.js";
import emailRouter from "./src/routes/email.routes.js";
import smsRouter from "./src/routes/sms.routes.js";
import mockingRouter from "./src/mocking/mock.router.js";
import { addLogger, devLogger } from "./src/config/logger.js";
import loggerRouter from "./src/routes/logger.routes.js";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUIExpress from "swagger-ui-express";
import usersRouter from "./src/routes/users.routes.js";
import paymentsRouter from "./src/routes/payments.routes.js";

const app = express();
const port = ENV_CONFIG.port || 8000;

const httpServer = app.listen(port, () => {
  devLogger.info("Servidor escuchando en puerto " + port);
});

const mongoUrl = ENV_CONFIG.mongoUrl;
mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 20000, 
})
.then(() => console.log('Conectado a MongoDB'))
.catch(err => console.error('Error al conectar a MongoDB', err));

// socket
export const socketServer = new Server(httpServer);

app.set("socketServer", socketServer);

// handlebars
app.engine(
  "handlebars",
  expressHandlebars.engine({
    handlebars: allowInsecurePrototypeAccess(Handlebars),
  })
);
app.set("views", __dirname + "/views");
app.set("view engine", "handlebars");
app.use(express.static(__dirname));

// cors
app.use(
  cors({
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// swagger

const swaggerOptions = {
  definition: {
    openapi: "3.0.1",

    info: {
      title: "Documentacion API Adoptme",

      description: "Documentacion del uso de las apis relacionadas.",
    },
  },

  apis: [`./src/docs/**/*.yaml`],
};

const specs = swaggerJSDoc(swaggerOptions);

// logger
app.use(addLogger);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SECRET_KEY_SESSION,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
    },
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_CNX_STR,
      collectionName: "sessions",
    }),
  })
);
app.use(cookieParser());

// passport
app.use(passport.initialize());
app.use(passport.session());
initializePassport();

// rutas
app.use("/api/products/", productsRouter);
app.use("/api/carts/", cartsRouter);
app.use("/", viewsRouter);
app.use("/api/sessions/", sessionsRouter);
app.use("/email", emailRouter);
app.use("/sms", smsRouter);
app.use("/api/users", usersRouter);
app.use("/mockingproducts", mockingRouter);
app.use("/loggerTest", loggerRouter);
app.use("/apidocs", swaggerUIExpress.serve, swaggerUIExpress.setup(specs));
app.use("/payment", paymentsRouter)

const PM = new ProductManager();

socketServer.on("connection", async (socket) => {
  console.log("Un cliente se ha conectado");

  const allProducts = await PM.getProducts();
  socket.emit("initial_products", allProducts.payload);

  const previousMessages = await messageModel.find().sort({ timestamp: 1 });
  socket.emit("previous messages", previousMessages);

  socket.on("message", (data) => {
    console.log("Mensaje recibido del cliente:", data);
  });

  socket.on("socket_individual", (data) => {
    console.log("Evento 'socket_individual' recibido:", data);
  });

  socket.on("chat message", async (message) => {
    console.log("Received message object:", JSON.stringify(message, null, 2));

    const newMessage = new messageModel({
      user: message.user,
      message: message.text,
      timestamp: new Date(),
    });
    await newMessage.save();

    socketServer.emit("chat message", {
      user: message.user,
      message: message.text,
    });
  });
});
